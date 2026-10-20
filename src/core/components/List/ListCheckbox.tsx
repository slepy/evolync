import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { View } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";

export interface ListCheckboxProps {
  checked: boolean;
  accent?: ListAccent;
}

/** Square checkbox on the right of a checkbox-list row (board S section 5). */
export function ListCheckbox({ checked, accent = "neutral" }: ListCheckboxProps) {
  if (!checked) {
    return (
      <View width={24} height={24} borderRadius="$chip" borderWidth={1.5} borderColor="$neutralControl" flexShrink={0} />
    );
  }

  const a = resolveListAccent(accent);
  return (
    <View width={24} height={24} borderRadius="$chip" overflow="hidden" alignItems="center" justifyContent="center" flexShrink={0}>
      <LinearGradient colors={[a.from, a.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Check size={14} color={a.onGradient} strokeWidth={3} />
    </View>
  );
}
