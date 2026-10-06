import { Plus, type LucideIcon } from "lucide-react-native";
import { Text, XStack } from "tamagui";
import { resolveListAccent, withAlpha, type ListAccent } from "../List/accent";

export interface DashedButtonProps {
  /** "Add row", "Add tag". */
  label: string;
  onPress: () => void;
  accent?: ListAccent;
  /** "block" (default): full width, 52px ("Add row", T3). "chip": 36px, inline with chips ("Add tag", T3). */
  size?: "block" | "chip";
  /** Default: plus. */
  icon?: LucideIcon;
}

/** Outlined "add one more" button: dashed border at 50% of the accent, accent label, no fill. */
export function DashedButton({ label, onPress, accent = "neutral", size = "block", icon: Icon = Plus }: DashedButtonProps) {
  const a = resolveListAccent(accent);
  const block = size === "block";

  return (
    <XStack
      role="button"
      aria-label={label}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      alignSelf={block ? "stretch" : "flex-start"}
      alignItems="center"
      justifyContent="center"
      gap={block ? 8 : 6}
      height={block ? 52 : 36}
      paddingLeft={block ? 20 : 10}
      paddingRight={block ? 20 : 14}
      borderRadius={block ? 26 : 18}
      borderWidth={1.5}
      borderStyle="dashed"
      borderColor={withAlpha(a.tint, 0.5)}
      backgroundColor="transparent"
    >
      <Icon size={block ? 18 : 15} color={a.label} strokeWidth={2.6} />
      <Text fontSize={block ? 15 : 13} fontWeight="$button" color={a.label} numberOfLines={1}>
        {label}
      </Text>
    </XStack>
  );
}
