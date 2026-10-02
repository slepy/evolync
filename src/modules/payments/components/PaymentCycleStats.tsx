import React, { useState } from "react";
import { Popover, Text, XStack, YStack } from "tamagui";
import { PaymentStatus } from "@/database/models/PaymentRecord";
import { MiniStat } from "@/modules/core/components";
import { STATUS_CONFIG } from "../constants";

interface PaymentCycleStatsProps {
  paid: number;
  pending: number;
  cancelled: number;
  paidByCurrency: Record<string, number>;
  pendingByCurrency: Record<string, number>;
  cancelledByCurrency: Record<string, number>;
}

function AmountPopover({
  amounts,
  children,
}: {
  amounts: Record<string, number>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(amounts);

  if (entries.length === 0) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen} placement="bottom">
      <Popover.Trigger onPress={() => setOpen(true)} asChild>
        {children}
      </Popover.Trigger>
      <Popover.Content
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$3"
        padding="$2"
        elevate
        animation="quick"
        enterStyle={{ opacity: 0, scale: 0.95 }}
        exitStyle={{ opacity: 0, scale: 0.95 }}
      >
        <Popover.Arrow borderWidth={1} borderColor="$borderColor" />
        <YStack gap="$1">
          {entries.map(([currency, amount]) => (
            <XStack key={currency} justifyContent="space-between" gap="$3">
              <Text fontSize="$2" color="$textPrimary">
                {currency}: {amount.toFixed(2)}
              </Text>
            </XStack>
          ))}
        </YStack>
      </Popover.Content>
    </Popover>
  );
}

export function PaymentCycleStats({
  paid,
  pending,
  cancelled,
  paidByCurrency,
  pendingByCurrency,
  cancelledByCurrency,
}: PaymentCycleStatsProps) {
  const paidConfig = STATUS_CONFIG[PaymentStatus.PAID];
  const pendingConfig = STATUS_CONFIG[PaymentStatus.PENDING];
  const cancelledConfig = STATUS_CONFIG[PaymentStatus.CANCELLED];

  return (
    <XStack
      marginVertical="$3"
      justifyContent="center"
      alignItems="center"
      paddingHorizontal="$2"
      gap="$5"
    >
      <AmountPopover amounts={paidByCurrency}>
        <MiniStat
          icon={paidConfig.icon}
          value={paid}
          color={paidConfig.color}
          label={t("statusPaid")}
          pressable
        />
      </AmountPopover>

      <AmountPopover amounts={pendingByCurrency}>
        <MiniStat
          icon={pendingConfig.icon}
          value={pending}
          color={pendingConfig.color}
          label={t("statusPending")}
          pressable
        />
      </AmountPopover>

      <AmountPopover amounts={cancelledByCurrency}>
        <MiniStat
          icon={cancelledConfig.icon}
          value={cancelled}
          color={cancelledConfig.color}
          label={t("statusCancelled")}
          pressable
        />
      </AmountPopover>
    </XStack>
  );
}
