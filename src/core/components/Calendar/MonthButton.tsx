import { neutral } from "@/core/theme/tokens";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { View } from "tamagui";

export interface MonthButtonProps {
  label: string;
  onPress: () => void; icon: "prev" | "next";
}

export function MonthButton({ label, onPress, icon }: MonthButtonProps) {
  const Icon = icon === "prev" ? ChevronLeft : ChevronRight;
  return (
    <View
      role="button"
      aria-label={label}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      width={44}
      height={44}
      borderRadius={22}
      backgroundColor="$neutralTintFill"
      alignItems="center"
      justifyContent="center"
    >
      <Icon size={20} color={neutral.text} strokeWidth={2.4} />
    </View>
  );
}
