import { neutral } from "@/core/theme/tokens";
import React, { useState } from "react";
import { Input, Text, YStack } from "tamagui";

interface CodeFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  maxLength: number;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * Code from the email (new password board): 64px field, 26/800 digits spaced
 * out and centered, one-time-code autofill; keeps digits only.
 */
export const CodeField: React.FC<CodeFieldProps> = ({ label, value, onChangeText, maxLength, hint, error, disabled }) => {
  const [focused, setFocused] = useState(false);
  const note = error ?? hint;

  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      <Input
        aria-label={label}
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, ""))}
        editable={!disabled}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        unstyled
        height={64}
        paddingHorizontal={16}
        borderRadius={16}
        backgroundColor="$neutralPage"
        borderWidth={focused || error ? 1.5 : 1}
        borderColor={error ? "$alertDot" : focused ? neutral.tint : "$neutralRaisedBorder"}
        color="$neutralText"
        fontSize={26}
        fontWeight="$section"
        letterSpacing={8}
        textAlign="center"
      />
      {note ? (
        <Text fontSize={12.5} fontWeight={error ? "600" : "$secondary"} color={error ? "$trashText" : "$neutralPlaceholder"}>
          {note}
        </Text>
      ) : null}
    </YStack>
  );
};
