import { getCurrentLanguage } from "@/core/i18n/config";
import { supabase } from "@/config/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  isPushRegistrationStale,
  shouldRegisterForPush,
  shouldShowPushRationale,
  toPushLocale,
  type PushLocale,
  type PushPermission,
} from "../utils";

/**
 * Push registration. A device token is device state, not offline business
 * data, so it goes straight to Supabase through the register_push_token /
 * disable_push_token RPCs (an allowed direct call, see CLAUDE.md). Failures
 * are logged and retried on the next dashboard visit — the inbox never
 * depends on push.
 */

const PUSH_PREFERENCE_KEY = "@evolync:pushEnabled";
const PUSH_TOKEN_KEY = "@evolync:pushToken";
const PUSH_RATIONALE_DISMISSED_KEY = "@evolync:pushRationaleDismissed";
const PUSH_LAST_REGISTRATION_KEY = "@evolync:pushLastRegistration";
/** Must match send-push. An existing channel's importance cannot be raised, hence a new id. */
export const ANDROID_CHANNEL_ID = "notifications";
/** Channel of earlier builds (DEFAULT importance: no heads-up banner). */
const LEGACY_ANDROID_CHANNEL_ID = "default";

export type PushRegistrationResult =
  | { status: "registered"; token: string }
  | { status: "unsupported" }
  | { status: "permission-denied" }
  | { status: "disabled" }
  | { status: "error"; error: unknown };

const isPushCapable = () => Platform.OS !== "web" && Device.isDevice;

const getProjectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

export const getPushPreference = async (): Promise<boolean | null> => {
  const value = await AsyncStorage.getItem(PUSH_PREFERENCE_KEY);
  return value === null ? null : value === "true";
};

const setPushPreference = (enabled: boolean) =>
  AsyncStorage.setItem(PUSH_PREFERENCE_KEY, String(enabled));

export const getPushPermission = async (): Promise<PushPermission> => {
  if (!isPushCapable()) return "denied";
  const { status } = await Notifications.getPermissionsAsync();
  return status as PushPermission;
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: t("notificationsTitle"),
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });
  await Notifications.deleteNotificationChannelAsync(LEGACY_ANDROID_CHANNEL_ID).catch(() => {});
};

/**
 * Fetch this device's Expo push token and register it for the signed-in user.
 * With `requestPermission`, asks the OS first when it has not been asked yet.
 */
export const registerForPushNotifications = async (
  { requestPermission = false }: { requestPermission?: boolean } = {},
): Promise<PushRegistrationResult> => {
  if (!isPushCapable()) return { status: "unsupported" };

  try {
    await ensureAndroidChannel();

    let permission = await getPushPermission();
    if (permission === "undetermined" && requestPermission) {
      permission = (await Notifications.requestPermissionsAsync()).status as PushPermission;
    }
    if (permission !== "granted") return { status: "permission-denied" };

    const projectId = getProjectId();
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    const locale = toPushLocale(getCurrentLanguage());
    const { error } = await supabase.rpc("register_push_token", {
      p_token: token,
      p_platform: Platform.OS,
      p_locale: locale,
    });
    if (error) throw error;

    await AsyncStorage.multiSet([
      [PUSH_TOKEN_KEY, token],
      [PUSH_LAST_REGISTRATION_KEY, JSON.stringify({ at: Date.now(), locale })],
    ]);
    return { status: "registered", token };
  } catch (error) {
    console.error("[push] Registration failed:", error);
    return { status: "error", error };
  }
};

const getLastRegistration = async (): Promise<{ at: number; locale: PushLocale } | null> => {
  try {
    const raw = await AsyncStorage.getItem(PUSH_LAST_REGISTRATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Keep the registration current on app use (dashboard visits): only when the
 * user wants push, the OS allows it, and the last registration is stale or
 * was for another language.
 */
export const syncPushRegistration = async (): Promise<PushRegistrationResult | { status: "fresh" }> => {
  const [preference, permission] = await Promise.all([getPushPreference(), getPushPermission()]);
  if (!shouldRegisterForPush(preference, permission)) {
    return preference === false ? { status: "disabled" } : { status: "permission-denied" };
  }
  const locale = toPushLocale(getCurrentLanguage());
  if (!isPushRegistrationStale(await getLastRegistration(), locale, Date.now())) {
    // A fresh registration from an older build still needs the current channel.
    await ensureAndroidChannel().catch((error) => console.error("[push] Channel setup failed:", error));
    return { status: "fresh" };
  }
  return registerForPushNotifications();
};

/**
 * Disable this device's token server-side. Safe to call when none is stored.
 * Bounded by `timeoutMs` so a slow network never holds up sign-out.
 */
export const disablePushToken = async ({ timeoutMs = 4000 }: { timeoutMs?: number } = {}): Promise<void> => {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (!token) return;

  const disable = async () => {
    const { error } = await supabase.rpc("disable_push_token", { p_token: token });
    if (error) throw error;
    await AsyncStorage.multiRemove([PUSH_TOKEN_KEY, PUSH_LAST_REGISTRATION_KEY]);
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timed out")), timeoutMs);
  });

  try {
    await Promise.race([disable(), timeout]);
  } catch (error) {
    console.error("[push] Disabling token failed:", error);
  } finally {
    clearTimeout(timer);
  }
};

/** Whether this device can receive push at all (physical iOS/Android device). */
export const isPushSupported = (): boolean => isPushCapable();

/** Settings switch. Turning on asks for OS permission the first time. */
export const setPushNotificationsEnabled = async (
  enabled: boolean,
): Promise<PushRegistrationResult> => {
  await setPushPreference(enabled);
  if (!enabled) {
    await disablePushToken();
    return { status: "disabled" };
  }
  return registerForPushNotifications({ requestPermission: true });
};

export const shouldOfferPushRationale = async (): Promise<boolean> => {
  if (!isPushCapable()) return false;
  const [preference, permission, dismissed] = await Promise.all([
    getPushPreference(),
    getPushPermission(),
    AsyncStorage.getItem(PUSH_RATIONALE_DISMISSED_KEY),
  ]);
  return shouldShowPushRationale(preference, permission, dismissed === "true");
};

export const dismissPushRationale = () => AsyncStorage.setItem(PUSH_RATIONALE_DISMISSED_KEY, "true");
