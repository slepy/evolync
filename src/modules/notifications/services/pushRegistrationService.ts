import { getCurrentLanguage } from "@/core/i18n/config";
import { supabase } from "@/config/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  shouldRegisterForPush,
  shouldShowPushRationale,
  toPushLocale,
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
export const ANDROID_CHANNEL_ID = "default";

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
    importance: Notifications.AndroidImportance.DEFAULT,
  });
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

    const { error } = await supabase.rpc("register_push_token", {
      p_token: token,
      p_platform: Platform.OS,
      p_locale: toPushLocale(getCurrentLanguage()),
    });
    if (error) throw error;

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return { status: "registered", token };
  } catch (error) {
    console.error("[push] Registration failed:", error);
    return { status: "error", error };
  }
};

/** Re-register on app use when the user wants push and the OS allows it. */
export const syncPushRegistration = async (): Promise<PushRegistrationResult> => {
  const [preference, permission] = await Promise.all([getPushPreference(), getPushPermission()]);
  if (!shouldRegisterForPush(preference, permission)) {
    return preference === false ? { status: "disabled" } : { status: "permission-denied" };
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
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
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
