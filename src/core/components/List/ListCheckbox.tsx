import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { View } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";

export interface ListCheckboxProps {
  checked: boolean;
  accent?: ListAccent;
}

/**
 * Square checkbox on the right of a checkbox-list row (board S section 5).
 *
 * The view tree stays the same in both states (gradient, outline and check
 * are always mounted, only their opacity changes): swapping the outlined box
 * for a gradient box made a box checked after the first render disappear on
 * device instead of turning into the gradient.
 */
export function ListCheckbox({ checked, accent = "neutral" }: ListCheckboxProps) {
  const a = resolveListAccent(accent);
  return (
    <View
      width={24}
      height={24}
      borderRadius="$chip"
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <LinearGradient
        colors={[a.from, a.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: checked ? 1 : 0 }]}
      />
      <View
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        borderRadius="$chip"
        borderWidth={1.5}
        borderColor="$neutralControl"
        opacity={checked ? 0 : 1}
      />
      <View opacity={checked ? 1 : 0}>
        <Check size={14} color={a.onGradient} strokeWidth={3} />
      </View>
    </View>
  );
}
