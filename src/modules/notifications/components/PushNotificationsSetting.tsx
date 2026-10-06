import { FormCard, SecondaryButton, ToggleRow } from "@/core/components";
import { Bell } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { AppState, Linking } from "react-native";
import {
  getPushPermission,
  getPushPreference,
  isPushSupported,
  setPushNotificationsEnabled,
} from "../services";
import type { PushPermission } from "../utils";

/**
 * Notifications card of the Settings tab (17A / 17B): one "Push
 * notifications" switch for this device. Reflects both the user's choice and
 * the OS permission; when the OS blocks it the hint turns red and "Open device
 * settings" appears. Re-checks when the app returns to the foreground (the
 * user may have changed OS settings).
 */
export function PushNotificationsSetting() {
  const supported = isPushSupported();
  const [preference, setPreference] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<PushPermission>("undetermined");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [pref, perm] = await Promise.all([getPushPreference(), getPushPermission()]);
    setPreference(pref);
    setPermission(perm);
  }, []);

  useEffect(() => {
    if (!supported) return;
    refresh().catch(console.error);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh().catch(console.error);
    });
    return () => subscription.remove();
  }, [supported, refresh]);

  const blocked = supported && permission === "denied";
  const checked = supported && preference !== false && permission === "granted";

  const handleChange = async (enabled: boolean) => {
    setBusy(true);
    try {
      await setPushNotificationsEnabled(enabled);
      await refresh();
    } catch (err) {
      console.error("[PushNotificationsSetting] change:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormCard icon={Bell} accent="neutral" gap={14} title={t("notificationsTitle")} subtitle={t("notificationsPushDeviceOnly")}>
      <ToggleRow
        title={t("notificationsPushSetting")}
        hint={
          !supported
            ? t("notificationsPushUnsupported")
            : blocked
              ? t("notificationsPushBlocked")
              : t("notificationsPushSettingHint")
        }
        hintTone={blocked ? "danger" : "muted"}
        label={t("notificationsPushSetting")}
        checked={checked}
        onChange={handleChange}
        disabled={!supported || blocked || busy}
      />
      {blocked ? (
        <SecondaryButton size="sm" label={t("notificationsPushOpenSettings")} onPress={() => Linking.openSettings()} />
      ) : null}
    </FormCard>
  );
}
