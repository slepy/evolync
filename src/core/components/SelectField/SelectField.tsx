import { neutral } from "@/core/theme/tokens";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface SelectFieldProps {
  /** Uppercase field label above the field ("COLOR", "STUDENT"). */
  label: string;
  /** Chosen value; empty shows the placeholder. */
  value?: string;
  placeholder?: string;
  /** Optional 36px avatar / swatch in front of the value. */
  leading?: ReactNode;
  /** Opens the picker. */
  onPress: () => void;
  /** Picker open: border and chevron in the module tint. */
  open?: boolean;
  accent?: ListAccent;
  /**
   * "down" (default): the picker opens as a sheet over the field.
   * "right": the picker replaces the current view (e.g. the color step of a sheet).
   */
  chevron?: "down" | "right";
}

/**
 * Field that opens a picker (board S section 7): 56px, radius 16, card fill,
 * chevron on the right (down, or right when it opens a next step); 1.5px tint border while its picker is open.
 */
export function SelectField({
  label,
  value,
  placeholder,
  leading,
  onPress,
  open,
  accent = "neutral",
  chevron = "down",
}: SelectFieldProps) {
  const tint = resolveListAccent(accent).tint;
  const Chevron = chevron === "right" ? ChevronRight : open ? ChevronUp : ChevronDown;

  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      <XStack
        role="button"
        aria-haspopup="dialog"
        aria-label={value ? `${label}, ${value}` : label}
        onPress={onPress}
        pressStyle={{ opacity: 0.85 }}
        alignItems="center"
        gap={12}
        minHeight={56}
        paddingVertical={8}
        paddingLeft={leading ? 10 : 16}
        paddingRight={12}
        borderRadius={16}
        backgroundColor="$neutralCard"
        borderWidth={open ? 1.5 : 1}
        borderColor={open ? tint : "$neutralRaisedBorder"}
      >
        {leading}
        <Text
          flex={1}
          fontSize={15}
          fontWeight={value ? "$rowTitle" : "600"}
          color={value ? "$neutralText" : neutral.placeholder}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Chevron size={20} color={open ? tint : neutral.muted} strokeWidth={2.2} />
      </XStack>
    </YStack>
  );
}
