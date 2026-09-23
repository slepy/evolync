import type { OrderStatus } from "@/modules/orders/types";
import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { formatPrice } from "@/modules/core/utils/formatters";
import { format } from "date-fns";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Text, XStack, YStack, useTheme } from "tamagui";

import { OrderStatusBadge } from "./OrderStatusBadge";

// ============================================================================
// Types
// ============================================================================

interface OrderCardUserProps {
  displayName: string;
  status: OrderStatus;
  totalsByCurrency: Record<string, number>;
  createdAt: Date;
  onPress: () => void;
}

// ============================================================================
// OrderCard Component
// ============================================================================

export const OrderCardUser: React.FC<OrderCardUserProps> = ({
  displayName,
  status,
  totalsByCurrency,
  createdAt,
  onPress,
}) => {
  const theme = useTheme();
  const iconColor: ColorTokens = "$blue11";
  const resolvedIconColor = iconColor.startsWith("$")
    ? theme[iconColor.slice(1)]?.val || iconColor
    : iconColor;

  return (
    <BaseCard onPress={onPress}>
      <XStack gap="$3" alignItems="center">
        {/* Icon Container */}
        <Thumbnail backgroundColor="$blue3" borderColor={resolvedIconColor} />

        {/* Content */}
        <CardInfo
          displayName={displayName}
          subtitle={format(createdAt, "dd.MM.yyyy")}
        />

        {/* Status and price */}
        <YStack gap="$1" alignItems="flex-end">
          <OrderStatusBadge status={status} />
          {Object.entries(totalsByCurrency).map(([cur, amount]) => (
            <Text key={cur} fontSize="$3" fontWeight="700" color="$jadeGreen">
              {formatPrice(amount, cur)}
            </Text>
          ))}
        </YStack>
      </XStack>
    </BaseCard>
  );
};
