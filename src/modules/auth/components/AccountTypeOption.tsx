import { withAlpha } from "@/core/components";
import { contextColors } from "@/core/theme/tokens";
import { Building, User, type LucideIcon } from "lucide-react-native";
import React from "react";
import { Text, View, XStack, YStack } from "tamagui";

interface AccountTypeOptionProps {
  /** Organization (amber, "I run a school") or student (blue, "I train in a school"). */
  type: "organization" | "student";
  title: string;
  description: string;
  /** Role chips under the description (Instructor, Owner / Student). */
  chips: string[];
  onPress: () => void;
}

const ICONS: Record<AccountTypeOptionProps["type"], LucideIcon> = {
  organization: Building,
  student: User,
};

/**
 * Account type card of the sign up board: decorative ring, 52px icon square
 * and role chips in the context color, 19/800 title, muted description.
 */
export const AccountTypeOption: React.FC<AccountTypeOptionProps> = ({ type, title, description, chips, onPress }) => {
  const c = contextColors[type];
  const Icon = ICONS[type];

  return (
    <YStack
      role="button"
      aria-label={title}
      onPress={onPress}
      pressStyle={{ opacity: 0.85 }}
      position="relative"
      overflow="hidden"
      gap={14}
      padding={20}
      borderRadius="$card"
      backgroundColor="$neutralCard"
      borderWidth={1}
      borderColor="$neutralCardBorder"
    >
      <View
        position="absolute"
        right={-40}
        top={-50}
        width={150}
        height={150}
        borderRadius={75}
        borderWidth={1.5}
        borderColor={withAlpha(c.label, 0.18)}
        pointerEvents="none"
      />
      <View width={52} height={52} borderRadius={16} backgroundColor={c.fill} alignItems="center" justifyContent="center">
        <Icon size={24} color={c.label} strokeWidth={2} />
      </View>
      <YStack gap={4}>
        <Text fontSize={19} fontWeight="$section" letterSpacing={-0.2} color="$neutralText">
          {title}
        </Text>
        <Text fontSize={13.5} lineHeight={20} fontWeight="$secondary" color="$neutralMuted">
          {description}
        </Text>
      </YStack>
      <XStack flexWrap="wrap" gap={6}>
        {chips.map((chip) => (
          <View key={chip} paddingVertical={4} paddingHorizontal={10} borderRadius={10} backgroundColor={c.fill}>
            <Text fontSize={12} fontWeight="$button" color={c.label}>
              {chip}
            </Text>
          </View>
        ))}
      </XStack>
    </YStack>
  );
};
