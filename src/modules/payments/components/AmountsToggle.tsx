import { ListIcon } from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { ChevronDown, ChevronUp, Wallet } from "lucide-react-native";
import { Text, XStack } from "tamagui";

export interface AmountsToggleProps {
  open: boolean;
  onPress: () => void;
}

/** "Amounts" row under the summary legend (14B collapsed / 14B1 expanded). */
export function AmountsToggle({ open, onPress }: AmountsToggleProps) {
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <XStack
      role="button"
      aria-label={t("paymentsAmounts")}
      aria-expanded={open}
      onPress={onPress}
      pressStyle={{ opacity: 0.85 }}
      alignItems="center"
      gap={8}
      minHeight={44}
      marginVertical={-6}
      marginHorizontal={-4}
      paddingHorizontal={4}
    >
      <ListIcon icon={Wallet} accent="payments" size={32} />
      <Text flex={1} fontSize={14} fontWeight="$button" color="$neutralText">
        {t("paymentsAmounts")}
      </Text>
      <Chevron size={18} color={neutral.muted} strokeWidth={2.2} />
    </XStack>
  );
}
