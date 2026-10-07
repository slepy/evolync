import { PrimaryButton } from "@/core/components";
import { contextColors, neutral } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { LogIn } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";

const school = contextColors.school.gradient;

/**
 * Header box of a student without a school (board 5): "You're not enrolled in
 * any school yet", the hint and the red "Join a school" button.
 */
export function NoSchoolCard({ onJoin }: { onJoin: () => void }) {
  return (
    <YStack
      gap={18}
      padding={24}
      borderRadius="$header"
      borderWidth={1}
      borderColor="$neutralRaisedBorder"
      overflow="hidden"
    >
      <LinearGradient
        colors={[neutral.raised, neutral.card]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <YStack gap={6}>
        <Text fontSize={22} lineHeight={26} fontWeight="800" letterSpacing={-0.3} color="$neutralText">
          {t("notInAnySchool")}
        </Text>
        <Text fontSize={14} lineHeight={21} fontWeight="500" color="$neutralMuted">
          {t("noSchoolHint")}
        </Text>
      </YStack>
      <PrimaryButton
        label={t("noSchoolJoin")}
        icon={LogIn}
        colors={{ from: school[0].color, to: school[1].color, text: contextColors.school.fg }}
        onPress={onJoin}
      />
    </YStack>
  );
}
