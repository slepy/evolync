import { BellRing } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Button, Sheet, Text, useTheme, XStack, YStack } from "tamagui";
import {
  dismissPushRationale,
  setPushNotificationsEnabled,
  shouldOfferPushRationale,
  syncPushRegistration,
} from "../services";

/**
 * Mounted on both dashboards. Keeps this device's push registration current
 * and, the first time only, explains push before the OS permission prompt so
 * the one-shot system dialog is not wasted.
 */
export function PushPermissionPrompt() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    syncPushRegistration().catch(console.error);
    shouldOfferPushRationale()
      .then((offer) => active && setOpen(offer))
      .catch(console.error);
    return () => {
      active = false;
    };
  }, []);

  const close = () => {
    setOpen(false);
    dismissPushRationale().catch(console.error);
  };

  const enable = () => {
    close();
    setPushNotificationsEnabled(true).catch(console.error);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={(next: boolean) => (next ? setOpen(true) : close())}
      snapPoints={[40]}
      dismissOnSnapToBottom
      zIndex={200}
    >
      <Sheet.Overlay backgroundColor="rgba(0, 0, 0, 0.5)" opacity={0.5} />
      <Sheet.Frame
        padding="$4"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <Sheet.Handle />
        <YStack gap="$3" paddingTop="$2">
          <XStack gap="$3" alignItems="center">
            <BellRing size={28} color={theme.blue11?.val} />
            <Text fontSize="$6" fontWeight="700" flex={1}>
              {t("notificationsPushRationaleTitle")}
            </Text>
          </XStack>
          <Text fontSize="$4" color="$gray11">
            {t("notificationsPushRationaleBody")}
          </Text>
          <Button backgroundColor="$blue10" color="white" onPress={enable}>
            {t("notificationsPushRationaleEnable")}
          </Button>
          <Button variant="outlined" onPress={close}>
            {t("notificationsPushRationaleLater")}
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
