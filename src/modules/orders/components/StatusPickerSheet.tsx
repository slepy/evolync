import { Check } from "lucide-react-native";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Button, Sheet, Text, XStack, YStack, useTheme } from "tamagui";

import { OrderStatus } from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";

// ============================================================================
// Types
// ============================================================================

interface StatusPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: OrderStatus;
  onSelectStatus: (status: OrderStatus) => void;
  isUpdating?: boolean;
}

interface StatusStyleConfig {
  color: ColorTokens;
  bg: ColorTokens;
}

const statusStyleMap: Record<OrderStatus, StatusStyleConfig> = {
  placed: { color: "$textPrimary", bg: "$fillStrong" },
  paid: { color: "$blue11", bg: "$blue3" },
  processing: { color: "$warningText", bg: "$warningSurface" },
  ready_for_pickup: { color: "$purple10", bg: "$purple3" },
  completed: { color: "$jadeGreen", bg: "$successSurface" },
};

// ============================================================================
// StatusPickerSheet Component
// ============================================================================

export const StatusPickerSheet: React.FC<StatusPickerSheetProps> = ({
  open,
  onOpenChange,
  currentStatus,
  onSelectStatus,
  isUpdating = false,
}) => {
  const theme = useTheme();

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[40]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Frame padding="$3">
        <Sheet.Handle />
        <YStack gap="$4">
          <YStack gap="$2">
            {Object.values(OrderStatus).map((status) => {
              const isSelected = status === currentStatus;
              const styleConfig = statusStyleMap[status];
              const colorKey = styleConfig.color.replace(
                "$",
                "",
              ) as keyof typeof theme;
              const iconColor = isSelected ? theme[colorKey]?.val : undefined;

              return (
                <Button
                  key={status}
                  size="$4"
                  backgroundColor={isSelected ? styleConfig.bg : "$background"}
                  borderColor={
                    isSelected ? styleConfig.color : "$borderStrong"
                  }
                  borderWidth={1}
                  onPress={() => {
                    if (!isUpdating && status !== currentStatus) {
                      onSelectStatus(status);
                    }
                  }}
                  disabled={isUpdating}
                  justifyContent="space-between"
                  paddingHorizontal="$4"
                >
                  <XStack
                    flex={1}
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <OrderStatusBadge status={status} />
                    {isSelected && <Check size={20} color={iconColor} />}
                  </XStack>
                </Button>
              );
            })}
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
