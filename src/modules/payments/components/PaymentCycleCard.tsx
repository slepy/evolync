import { Calendar } from "lucide-react-native";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Text, XStack, YStack, useTheme } from "tamagui";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";

import { BaseCard, Thumbnail } from "@/modules/core/components";

// ============================================================================
// Types
// ============================================================================

interface PaymentCycleCardProps {
  periodStart: Date;
  periodEnd: Date;
  paidCount: number;
  totalCount: number;
  onPress: () => void;
}

// ============================================================================
// PaymentCycleCard Component
// ============================================================================

export const PaymentCycleCard: React.FC<PaymentCycleCardProps> = ({
  periodStart,
  periodEnd,
  paidCount,
  totalCount,
  onPress,
}) => {
  const theme = useTheme();
  const iconColor: ColorTokens = "$green10";
  const resolvedIconColor = iconColor.startsWith("$")
    ? theme[iconColor.slice(1)]?.val || iconColor
    : iconColor;

  // Format dates
  const locale = t("locale") === "pl" ? pl : enUS;
  const startFormatted = format(periodStart, "d MMM", { locale });
  const endFormatted = format(periodEnd, "d MMM yyyy", { locale });
  const dateRange = `${startFormatted} - ${endFormatted}`;

  // Calculate progress
  const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
  const progressColor =
    progress === 100 ? "$green10" : progress > 50 ? "$yellow10" : "$red10";

  return (
    <BaseCard onPress={onPress}>
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          backgroundColor="$successSurface"
          borderColor="$jadeGreen"
          icon={<Calendar />}
        />

        {/* Content */}
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$textPrimary">
            {dateRange}
          </Text>
          <Text fontSize="$2" color={progressColor} fontWeight="600">
            {paidCount}/{totalCount} {t("statusPaid")}
          </Text>
        </YStack>
      </XStack>
    </BaseCard>
  );
};
