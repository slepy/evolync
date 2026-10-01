import React, { useCallback, useEffect, useState } from "react";
import { AppState, Linking } from "react-native";
import { Button, Switch, Text, XStack, YStack } from "tamagui";
import {
  getPushPermission,
  getPushPreference,
  isPushSupported,
  setPushNotificationsEnabled,
} from "../services";
import type { PushPermission } from "../utils";

/**
 * Settings row: one global "Push notifications" switch. Reflects both the
 * user's choice and the OS permission; re-checks when the app returns to the
 * foreground (the user may have changed OS settings).
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

  const blocked = permission === "denied";
  const checked = supported && preference !== false && permission === "granted";

  const handleChange = async (enabled: boolean) => {
    setBusy(true);
    try {
      await setPushNotificationsEnabled(enabled);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <YStack gap="$2">
      <XStack justifyContent="space-between" alignItems="center" gap="$3">
        <YStack flex={1} gap="$1">
          <Text fontSize="$5" fontWeight="bold">
            {t("notificationsPushSetting")}
          </Text>
          <Text fontSize="$3" color="$gray11">
            {!supported
              ? t("notificationsPushUnsupported")
              : blocked
                ? t("notificationsPushBlocked")
                : t("notificationsPushSettingHint")}
          </Text>
        </YStack>
        <Switch
          checked={checked}
          onCheckedChange={handleChange}
          disabled={!supported || blocked || busy}
          accessibilityLabel={t("notificationsPushSetting")}
        >
          <Switch.Thumb animation="quick" />
        </Switch>
      </XStack>
      {supported && blocked && (
        <Button size="$3" variant="outlined" alignSelf="flex-start" onPress={() => Linking.openSettings()}>
          {t("notificationsPushOpenSettings")}
        </Button>
      )}
    </YStack>
  );
}
