import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { Check } from "lucide-react-native";
import React from "react";
import { useTheme, XStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface SelectableMemberCardProps {
  member: {
    id: string;
    displayName: string;
    schoolName?: string;
  };
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

// ============================================================================
// SelectableMemberCard Component
// ============================================================================

export const SelectableMemberCard: React.FC<SelectableMemberCardProps> = ({
  member,
  isSelected,
  onPress,
  disabled = false,
}) => {
  const theme = useTheme();

  return (
    <BaseCard
      marginHorizontal="$0"
      onPress={onPress}
      backgroundColor={isSelected ? theme.blue3?.val : undefined}
      borderColor={isSelected ? theme.blue11?.val : undefined}
    >
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          backgroundColor={theme.blue3?.val}
          borderColor={theme.blue11?.val}
        />
        <CardInfo displayName={member.displayName} subtitle={member.schoolName} />
        {isSelected && <Check size={20} color={theme.blue11?.val} />}
      </XStack>
    </BaseCard>
  );
};
