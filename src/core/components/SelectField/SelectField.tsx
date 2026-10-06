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
  /** Muted second line under a chosen value (12E2: the student's school). */
  valueHint?: string;
  /** Muted note under the field. */
  hint?: string;
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
  valueHint,
  hint,
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
        <YStack flex={1} minWidth={0} gap={2}>
          <Text
            fontSize={15}
            fontWeight={value ? "$rowTitle" : "600"}
            color={value ? "$neutralText" : neutral.placeholder}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
          {value && valueHint ? (
            <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
              {valueHint}
            </Text>
          ) : null}
        </YStack>
        <Chevron size={20} color={open ? tint : neutral.muted} strokeWidth={2.2} />
      </XStack>
      {hint ? (
        <Text fontSize={12.5} fontWeight="$secondary" color={neutral.placeholder}>
          {hint}
        </Text>
      ) : null}
    </YStack>
  );
}
