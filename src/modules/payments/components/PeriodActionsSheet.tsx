import { FormSheet, ListCard, ListIcon, ListRow } from "@/core/components";
import { danger } from "@/core/theme/tokens";
import { CircleAlert, Lock, LockOpen, Trash2 } from "lucide-react-native";
import React from "react";
import { Text, View, XStack } from "tamagui";
import type { CanDeletePeriod } from "../paymentPeriod";

export interface PeriodActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "October 2026" */
  title: string;
  /** "1 – 31 Oct · 10 members" */
  subtitle?: string;
  locked: boolean;
  /** Unsaved changes on 14B: Lock waits for Save. */
  changed: boolean;
  deletable: CanDeletePeriod;
  onToggleLock: () => void;
  onDelete: () => void;
}

/** Reason a row can't run, under it in the trash red (14B2 / 14B4). */
function BlockedReason({ text }: { text: string }) {
  return (
    <XStack role="note" alignItems="flex-start" gap={6} paddingLeft={56} marginTop={-4}>
      <CircleAlert size={14} color={danger.text} strokeWidth={2.4} />
      <Text flex={1} fontSize={12.5} fontWeight="700" lineHeight={17} color="$trashText">
        {text}
      </Text>
    </XStack>
  );
}

/**
 * Period actions (14B2 / 14B4): Lock / Unlock payments (written at once), and
 * Delete period in red — dimmed with its reason while something is paid or the
 * period is locked.
 */
export const PeriodActionsSheet: React.FC<PeriodActionsSheetProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  locked,
  changed,
  deletable,
  onToggleLock,
  onDelete,
}) => {
  const lockBlocked = !locked && changed;
  const deleteReason = deletable.ok
    ? undefined
    : deletable.reason === "paid"
      ? t("paymentsDeleteBlockedPaid", { count: deletable.count })
      : t("paymentsDeleteBlockedLocked");

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={title} subtitle={subtitle}>
      <ListCard>
        <ListRow
          size="md"
          title={locked ? t("paymentsUnlock") : t("paymentsLock")}
          subtitle={lockBlocked ? t("paymentsLockSaveFirst") : locked ? t("paymentsUnlockHint") : t("paymentsLockHint")}
          leading={<ListIcon icon={locked ? LockOpen : Lock} accent="payments" size={44} />}
          disabled={lockBlocked}
          onPress={() => {
            onOpenChange(false);
            onToggleLock();
          }}
        />
        <ListRow
          size="md"
          danger
          title={t("paymentsDeletePeriod")}
          subtitle={t("paymentsDeletePeriodHint")}
          leading={
            <View
              width={44}
              height={44}
              borderRadius={14}
              borderWidth={1}
              borderColor="$trashBorder"
              backgroundColor="$trashFill"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Trash2 size={20} color={danger.text} strokeWidth={2} />
            </View>
          }
          disabled={!deletable.ok}
          expanded={!!deleteReason}
          onPress={() => {
            onOpenChange(false);
            onDelete();
          }}
        >
          {deleteReason ? <BlockedReason text={deleteReason} /> : undefined}
        </ListRow>
      </ListCard>
    </FormSheet>
  );
};
