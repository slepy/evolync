import { neutral } from "@/core/theme/tokens";
import { Lock } from "lucide-react-native";
import { Text, XStack } from "tamagui";

/** "LOCKED" tag after the title of a locked period (14A), next to `CurrentBadge` when both apply. */
export function LockedBadge() {
  return (
    <XStack
      alignItems="center"
      gap={4}
      paddingVertical={2}
      paddingHorizontal={8}
      borderRadius={8}
      backgroundColor="$neutralTintFill"
      flexShrink={0}
    >
      <Lock size={11} color={neutral.tint} strokeWidth={2.6} />
      <Text fontSize={10.5} fontWeight="$button" letterSpacing={0.6} textTransform="uppercase" color="$neutralTint">
        {t("locked")}
      </Text>
    </XStack>
  );
}
