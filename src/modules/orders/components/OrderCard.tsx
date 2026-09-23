import type { OrderStatus } from "@/modules/orders/types";
import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { formatPrice } from "@/modules/core/utils/formatters";
import { format } from "date-fns";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Text, XStack, YStack, useTheme } from "tamagui";

import { OrderStatusBadge } from "./OrderStatusBadge";
import SchoolMember from "@/database/models/SchoolMember";
import { useRankById } from "@/modules/grading";

// ============================================================================
// Types
// ============================================================================

interface OrderCardProps {
  member: SchoolMember | null;
  status: OrderStatus;
  itemCount: number;
  totalsByCurrency: Record<string, number>;
  createdAt: Date;
  onPress: () => void;
}

// ============================================================================
// OrderCard Component
// ============================================================================

export const OrderCard: React.FC<OrderCardProps> = ({
  member,
  status,
  itemCount,
  totalsByCurrency,
  createdAt,
  onPress,
}) => {
  const theme = useTheme();
  const rank = useRankById(member?.currentRankId);

  const iconColor: ColorTokens = "$blue11";
  const resolvedIconColor = iconColor.startsWith("$")
    ? theme[iconColor.slice(1)]?.val || iconColor
    : iconColor;

  // Build subtitle
  const subtitleParts = [];
  subtitleParts.push(`${itemCount} ${t("items")}`);
  subtitleParts.push(format(createdAt, "dd.MM.yyyy"));
  const subtitle = subtitleParts.join(" • ");

  return (
    <BaseCard onPress={onPress}>
      <XStack gap="$3" alignItems="center">
        {/* Icon Container */}
        <Thumbnail
          backgroundColor="$blue3"
          borderColor={resolvedIconColor}
          imageUrl={member?.avatarUrl}
          rankColor={rank?.color}
        />

        {/* Content */}
        <CardInfo
          displayName={member?.displayName ?? t("unknownMember")}
          subtitle={subtitle}
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
