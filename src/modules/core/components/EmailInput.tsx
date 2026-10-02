import React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Input, YStack, Text } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface EmailInputProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string;
  error?: string;
  disabled?: boolean;
  flex?: number;
}

// ============================================================================
// EmailInput Component
// ============================================================================

/**
 * Reusable email input component with validation and error display.
 *
 * @example
 * <EmailInput
 *   control={control}
 *   name="email"
 *   label={t('email')}
 *   error={errors.email?.message}
 * />
 */
export const EmailInput = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  error,
  disabled = false,
  flex = 1,
}: EmailInputProps<TFieldValues>) => {
  const defaultLabel = label || t("email");

  return (
    <YStack gap="$2" flex={flex} {...(flex !== 1 && { flexBasis: 0 })}>
      {defaultLabel && (
        <Text fontSize="$3" color="$textSecondary" fontWeight="500">
          {defaultLabel}
        </Text>
      )}

      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            id={name}
            placeholder={defaultLabel}
            value={value as string}
            onChange={onChange}
            onChangeText={onChange}
            onBlur={onBlur}
            disabled={disabled}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            borderColor={error ? "$imperialRed" : "$borderStrong"}
            borderWidth={2}
            focusStyle={{
              borderColor: error ? "$imperialRed" : "$chineseGold",
              backgroundColor: "$surface",
            }}
            backgroundColor="$background"
            color="$textPrimary"
            placeholderTextColor="$textMuted"
          />
        )}
      />

      {error && (
        <Text color="$imperialRed" fontSize="$3" fontWeight="500">
          {error}
        </Text>
      )}
    </YStack>
  );
};
