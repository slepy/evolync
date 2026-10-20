import { Check } from "lucide-react-native";
import { View } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";

export interface ListCheckProps {
  accent?: ListAccent;
}

/**
 * Round check marking the chosen row of a select sheet and the current
 * context (switcher): accent ring around the check, the size of the 24px
 * `ListCheckbox`. The row itself stays unfilled.
 */
export function ListCheck({ accent = "neutral" }: ListCheckProps) {
  const { label } = resolveListAccent(accent);
  return (
    <View
      width={24}
      height={24}
      borderRadius={12}
      borderWidth={2}
      borderColor={label}
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Check size={13} color={label} strokeWidth={3} />
    </View>
  );
}
