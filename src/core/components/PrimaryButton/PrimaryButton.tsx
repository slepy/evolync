import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, StyleSheet } from "react-native";
import { Text, XStack } from "tamagui";
import type { ListAccent } from "../List/accent";
import { resolvePrimaryButtonColors, type PrimaryButtonColors } from "./primaryButtonColors";

export interface PrimaryButtonProps {
  /** One word: Create, Save… */
  label: string;
  onPress: () => void;
  /** Module / context whose button gradient colors the button (default neutral). */
  accent?: ListAccent;
  /** Overrides the accent's gradient and text color. */
  colors?: Partial<PrimaryButtonColors>;
  /** Optional icon in front of the label. */
  icon?: LucideIcon;
  disabled?: boolean;
  /** Shows a spinner instead of the label and blocks presses. */
  loading?: boolean;
}

/**
 * Primary action of a form or sheet (board S shared pieces): full width,
 * 52px, solid gradient in the module accent, one-word label.
 */
export function PrimaryButton({
  label,
  onPress,
  accent = "neutral",
  colors,
  icon: Icon,
  disabled,
  loading,
}: PrimaryButtonProps) {
  const c = resolvePrimaryButtonColors(accent, colors);
  const inactive = disabled || loading;

  return (
    <XStack
      role="button"
      aria-label={label}
      aria-disabled={inactive}
      onPress={inactive ? undefined : onPress}
      pressStyle={inactive ? undefined : { opacity: 0.85 }}
      opacity={disabled && !loading ? 0.5 : 1}
      width="100%"
      height={52}
      borderRadius={26}
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
      gap={8}
    >
      <LinearGradient colors={[c.from, c.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {loading ? (
        <ActivityIndicator color={c.text} />
      ) : (
        <>
          {Icon ? <Icon size={18} color={c.text} strokeWidth={2.4} /> : null}
          <Text fontSize={15} fontWeight="$button" color={c.text} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </XStack>
  );
}
