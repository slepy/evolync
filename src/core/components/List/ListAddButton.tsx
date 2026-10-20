import { Plus } from "lucide-react-native";
import { View } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";

export interface ListAddButtonProps {
  onPress: () => void;
  /** Accessible label (default: "Add"). */
  label?: string;
  accent?: ListAccent;
}

/** `+` quick action on the right of a row (same as the module tile's): 40px circle, accent fill. */
export function ListAddButton({ onPress, label, accent = "neutral" }: ListAddButtonProps) {
  const a = resolveListAccent(accent);
  return (
    <View
      role="button"
      aria-label={label ?? t("add")}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      hitSlop={4}
      width={40}
      height={40}
      borderRadius={20}
      backgroundColor={a.fill}
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Plus size={18} color={a.tint} strokeWidth={2.8} />
    </View>
  );
}
