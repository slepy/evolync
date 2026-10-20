import { FormSheet, PrimaryButton } from "@/core/components";
import { danger } from "@/core/theme/tokens";
import { Ban } from "lucide-react-native";
import React from "react";
import { Text, XStack, YStack } from "tamagui";
import type { EventSheetAction } from "../types";

interface EventCancelSheetProps {
  /** Which action asks; null keeps the sheet closed. */
  action: EventSheetAction | null;
  onClose: () => void;
  name: string;
  /** Paid participants block a delete; the sheet offers cancelling instead. */
  paidCount: number;
  busy?: boolean;
  onCancelEvent: () => void;
  onDeleteEvent: () => void;
}

const DANGER_BUTTON = { from: danger.from, to: danger.to, text: danger.buttonText };

/**
 * Cancel / delete confirmation (10E): "Cancel {name}?" with Cancel event /
 * Keep. A delete with paid participants is blocked and offers the cancel
 * instead; without them it confirms the delete.
 */
export const EventCancelSheet: React.FC<EventCancelSheetProps> = ({
  action,
  onClose,
  name,
  paidCount,
  busy,
  onCancelEvent,
  onDeleteEvent,
}) => {
  const deleting = action === "delete" && paidCount === 0;
  const blocked = action === "delete" && paidCount > 0;

  return (
    <FormSheet
      open={action !== null}
      onOpenChange={(open) => !open && onClose()}
      title={deleting ? t("eventsDeleteSheetTitle", { name }) : t("eventsCancelSheetTitle", { name })}
      subtitle={deleting ? t("eventsDeleteSheetMessage") : t("eventsCancelSheetMessage")}
    >
      <YStack gap={12}>
        <PrimaryButton
          label={deleting ? t("delete") : t("eventsCancelEvent")}
          colors={DANGER_BUTTON}
          onPress={deleting ? onDeleteEvent : onCancelEvent}
          loading={busy}
        />
        <XStack
          role="button"
          aria-label={t("eventsKeep")}
          onPress={busy ? undefined : onClose}
          pressStyle={{ opacity: 0.8 }}
          height={52}
          borderRadius={26}
          borderWidth={1}
          borderColor="$neutralRaisedBorder"
          backgroundColor="$neutralCard"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={15} fontWeight="$button" color="$neutralText">
            {t("eventsKeep")}
          </Text>
        </XStack>
        {blocked ? (
          <YStack
            gap={10}
            paddingVertical={14}
            paddingHorizontal={16}
            borderRadius={18}
            backgroundColor="$trashFill"
            borderWidth={1}
            borderStyle="dashed"
            borderColor="$trashBorder"
          >
            <XStack alignItems="center" gap={8}>
              <Ban size={16} color={danger.text} strokeWidth={2.2} />
              <Text fontSize={14} fontWeight="$button" color="$trashText">
                {t("eventsDeleteBlockedTitle")}
              </Text>
            </XStack>
            <Text fontSize={13} fontWeight="$secondary" lineHeight={18} color="$neutralMuted">
              {t("eventsDeleteBlockedCount", { count: paidCount })}
            </Text>
          </YStack>
        ) : null}
      </YStack>
    </FormSheet>
  );
};
