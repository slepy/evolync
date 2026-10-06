import { neutral } from "@/core/theme/tokens";
import type { LucideIcon } from "lucide-react-native";
import { useState } from "react";
import type { TextInputProps } from "react-native";
import { Input, Text, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface TextFieldProps {
  /** Uppercase field label above the input ("NAME"). */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** Colors the focused border (module accent). */
  accent?: ListAccent;
  /** Muted line under the field; replaced by `error` when set. */
  hint?: string;
  error?: string;
  autoFocus?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
  returnKeyType?: TextInputProps["returnKeyType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  keyboardType?: TextInputProps["keyboardType"];
  /** Grows from 56px to fit several lines (descriptions). */
  multiline?: boolean;
  /** Muted 18px icon in front of the value (15A ADDRESS: map pin). */
  icon?: LucideIcon;
  /** Inside a `FormCard`: page fill instead of the card fill (15A, 16E RANK). */
  inset?: boolean;
}

/**
 * Form text field (board S select field geometry): 12/800 uppercase label,
 * 56px input on the card fill, 1.5px border in the module tint while focused.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  accent = "neutral",
  hint,
  error,
  autoFocus,
  maxLength,
  onSubmitEditing,
  returnKeyType,
  autoCapitalize,
  keyboardType,
  multiline,
  icon: Icon,
  inset,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const tint = resolveListAccent(accent).tint;
  const note = error ?? hint;

  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      <XStack
        alignItems={multiline ? "flex-start" : "center"}
        gap={10}
        height={multiline ? undefined : 56}
        minHeight={multiline ? 96 : undefined}
        paddingLeft={16}
        paddingRight={Icon ? 16 : 0}
        borderRadius={16}
        backgroundColor={inset ? "$neutralPage" : "$neutralCard"}
        borderWidth={focused || error ? 1.5 : 1}
        borderColor={error ? "$trashText" : focused ? tint : "$neutralRaisedBorder"}
      >
        {Icon ? <Icon size={18} color={neutral.muted} strokeWidth={2} /> : null}
        <Input
          flex={1}
          aria-label={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={neutral.placeholder}
          autoFocus={autoFocus}
          maxLength={maxLength}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          unstyled
          height={multiline ? undefined : 54}
          minHeight={multiline ? 94 : undefined}
          paddingRight={Icon ? 0 : 16}
          paddingVertical={multiline ? 16 : undefined}
          textAlignVertical={multiline ? "top" : undefined}
          color="$neutralText"
          fontSize={15}
          fontWeight="600"
        />
      </XStack>
      {note ? (
        <Text fontSize={12.5} fontWeight="$secondary" color={error ? "$trashText" : "$neutralMuted"}>
          {note}
        </Text>
      ) : null}
    </YStack>
  );
}
