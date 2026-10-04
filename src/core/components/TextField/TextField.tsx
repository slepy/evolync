import { neutral } from "@/core/theme/tokens";
import { useState } from "react";
import type { TextInputProps } from "react-native";
import { Input, Text, YStack } from "tamagui";
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
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const tint = resolveListAccent(accent).tint;
  const note = error ?? hint;

  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      <Input
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        unstyled
        height={56}
        paddingHorizontal={16}
        borderRadius={16}
        backgroundColor="$neutralCard"
        borderWidth={focused || error ? 1.5 : 1}
        borderColor={error ? "$trashText" : focused ? tint : "$neutralRaisedBorder"}
        color="$neutralText"
        fontSize={15}
        fontWeight="600"
      />
      {note ? (
        <Text fontSize={12.5} fontWeight="$secondary" color={error ? "$trashText" : "$neutralMuted"}>
          {note}
        </Text>
      ) : null}
    </YStack>
  );
}
