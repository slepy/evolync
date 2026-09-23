import { Building2 } from "lucide-react-native";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Text, XStack, YStack, useTheme } from "tamagui";

import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";

// ============================================================================
// Types
// ============================================================================

interface SchoolCardProps {
  name: string;
  address?: string;
  onPress: () => void;
}

// ============================================================================
// SchoolCard Component
// ============================================================================

export const SchoolCard: React.FC<SchoolCardProps> = ({
  name,
  address,
  onPress,
}) => {
  const iconColor: ColorTokens = "$blue11";

  return (
    <BaseCard onPress={onPress}>
      <XStack gap="$3" alignItems="center">
        {/* Icon Container */}
        <Thumbnail
          backgroundColor="$blue3"
          borderColor={iconColor}
          icon={<Building2 />}
        />

        {/* Content */}
        <CardInfo
          displayName={name}
          subtitle={address || t("emptyNoAddress")}
        />
      </XStack>
    </BaseCard>
  );
};
