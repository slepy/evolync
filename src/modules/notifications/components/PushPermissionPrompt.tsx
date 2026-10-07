import {
  ListDivider,
  ListIcon,
  PrimaryButton,
  SecondaryButton,
  type ListAccent,
} from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { useStore } from "@/store";
import {
  BellRing,
  CalendarCheck,
  CalendarPlus,
  CreditCard,
  ShoppingBag,
  UserPlus,
  type LucideIcon,
} from "lucide-react-native";
import React, { Fragment, useEffect, useState } from "react";
import { Sheet, Text, View, XStack, YStack } from "tamagui";
import {
  dismissPushRationale,
  setPushNotificationsEnabled,
  shouldOfferPushRationale,
  syncPushRegistration,
} from "../services";

interface PromptRow {
  icon: LucideIcon;
  accent: ListAccent;
  label: string;
}

/** What push brings: the owner's and the member's notification kinds (N5). */
const OWNER_ROWS: PromptRow[] = [
  { icon: ShoppingBag, accent: "orders", label: "notificationsPushRowOrders" },
  { icon: UserPlus, accent: "students", label: "notificationsPushRowJoinRequests" },
  { icon: CalendarCheck, accent: "events", label: "notificationsPushRowEventSignups" },
];

const STUDENT_ROWS: PromptRow[] = [
  { icon: CreditCard, accent: "payments", label: "notificationsPushRowPayments" },
  { icon: CalendarPlus, accent: "events", label: "notificationsPushRowEventAdded" },
];

/**
 * Mounted on both dashboards. Keeps this device's push registration current
 * and, the first time only, explains push in a sheet (N5) before the OS
 * permission prompt so the one-shot system dialog is not wasted.
 */
export function PushPermissionPrompt() {
  const ownsOrganization = useStore((s) => !!s.organization);
  const [open, setOpen] = useState(false);
  const rows = ownsOrganization ? OWNER_ROWS : STUDENT_ROWS;

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
      snapPointsMode="fit"
      dismissOnSnapToBottom
      zIndex={200_000}
    >
      <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame
        role="dialog"
        aria-label={t("notificationsPushRationaleTitle")}
        backgroundColor="$neutralRaised"
        borderTopLeftRadius="$header"
        borderTopRightRadius="$header"
        paddingHorizontal={20}
        paddingTop={12}
        paddingBottom={32}
      >
        <Sheet.Handle backgroundColor="$neutralControl" />
        <YStack gap={16} paddingTop={12}>
          <XStack alignItems="center" gap={14}>
            <View
              width={48}
              height={48}
              borderRadius="$rowIcon"
              backgroundColor="$neutralTintFill"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <BellRing size={22} color={neutral.text} strokeWidth={2} />
            </View>
            <YStack flex={1} minWidth={0} gap={3}>
              <Text fontSize={20} fontWeight="$section" color="$neutralText">
                {t("notificationsPushRationaleTitle")}
              </Text>
              <Text fontSize={13.5} fontWeight="$secondary" lineHeight={19} color="$neutralMuted">
                {t("notificationsPushRationaleBody")}
              </Text>
            </YStack>
          </XStack>

          <YStack borderRadius={18} borderWidth={1} borderColor="$neutralCardBorder" backgroundColor="$neutralCard">
            {rows.map((row, index) => (
              <Fragment key={row.label}>
                {index > 0 ? <ListDivider /> : null}
                <XStack alignItems="center" gap={12} paddingVertical={10} paddingHorizontal={14}>
                  <ListIcon icon={row.icon} accent={row.accent} size={36} />
                  <Text flex={1} fontSize={14.5} fontWeight="700" color="$neutralText">
                    {t(row.label)}
                  </Text>
                </XStack>
              </Fragment>
            ))}
          </YStack>

          <PrimaryButton label={t("notificationsPushRationaleEnable")} accent="light" onPress={enable} />
          <SecondaryButton label={t("notificationsPushRationaleLater")} onPress={close} />
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
