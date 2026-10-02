import { User, Users } from "lucide-react-native";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Text, XStack, YStack, useTheme } from "tamagui";

import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";

// ============================================================================
// Types
// ============================================================================

interface AccountTypeCardProps {
  title: string;
  description?: string | null;
  icon: "owner" | "student";
  onPress: () => void;
}

// ============================================================================
// AccountTypeCard Component
// ============================================================================

export const AccountTypeCard: React.FC<AccountTypeCardProps> = ({
  title,
  description,
  icon,
  onPress,
}) => {
  const theme = useTheme();
  const IconComponent = icon === "owner" ? Users : User;
  const bgColor: ColorTokens =
    icon === "owner" ? "$imperialRed" : "$chineseGold";

  return (
    <BaseCard onPress={onPress} padding="$3" marginHorizontal="$0">
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          size={50}
          backgroundColor={bgColor}
          borderColor={theme.background?.val}
          borderRadius={10}
          icon={<IconComponent size={25} />}
        />
        <CardInfo displayName={title} subtitle={description || undefined} />
      </XStack>
    </BaseCard>
  );
};
