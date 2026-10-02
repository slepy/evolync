import React from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input, Label, Text, YStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface BaseNumberInputProps {
  label?: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  allowDecimals?: boolean;
  flex?: number;
}

interface FormNumberInputProps<
  TFieldValues extends FieldValues,
> extends BaseNumberInputProps {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  value?: never;
  onChangeText?: never;
}

interface StandaloneNumberInputProps extends BaseNumberInputProps {
  control?: never;
  name?: string;
  value: string;
  onChangeText: (text: string) => void;
}

type NumberInputProps<TFieldValues extends FieldValues = FieldValues> =
  | FormNumberInputProps<TFieldValues>
  | StandaloneNumberInputProps;

// ============================================================================
// NumberInput Component
// ============================================================================

/**
 * Reusable number input component with validation and error display.
 * Supports both React Hook Form and standalone usage.
 *
 * @example React Hook Form mode
 * <NumberInput
 *   control={control}
 *   name="price"
 *   label="Price"
 *   placeholder="0.00"
 *   error={errors.price?.message}
 * />
 *
 * @example Standalone mode
 * <NumberInput
 *   value={amount.toString()}
 *   onChangeText={(text) => setAmount(parseFloat(text) || 0)}
 *   label="Amount"
 *   placeholder="0.00"
 * />
 */
export const NumberInput = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  disabled = false,
  flex = 1,
  value: standaloneValue,
  onChangeText: standaloneOnChangeText,
}: NumberInputProps<TFieldValues>) => {
  const inputId = name ?? "number-input";

  const renderInput = (
    inputValue: string,
    onChange: (text: string) => void,
    onBlur?: () => void,
  ) => (
    <Input
      id={inputId}
      placeholder={placeholder}
      value={inputValue}
      onChangeText={(text: string) => onChange(text)}
      onBlur={onBlur ? () => onBlur() : undefined}
      disabled={disabled}
      keyboardType="numeric"
      borderColor={error ? "$imperialRed" : "$borderStrong"}
      borderWidth={2}
      focusStyle={{
        borderColor: error ? "$imperialRed" : "$chineseGold",
        backgroundColor: "$surface",
      }}
      backgroundColor={disabled ? "$fillStrong" : "$background"}
      color="$textPrimary"
      placeholderTextColor="$textMuted"
    />
  );

  return (
    <YStack gap="$2" {...(flex !== 1 && { flex, flexBasis: 0 })}>
      {label && (
        <Text fontSize="$3" color="$textSecondary" fontWeight="500">
          {label}
        </Text>
      )}

      {control && name ? (
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) =>
            renderInput(
              value !== undefined && value !== null ? String(value) : "",
              onChange,
              onBlur,
            )
          }
        />
      ) : (
        renderInput(standaloneValue ?? "", standaloneOnChangeText ?? (() => {}))
      )}

      {error && (
        <Text color="$imperialRed" fontSize="$3" fontWeight="500">
          {error}
        </Text>
      )}
    </YStack>
  );
};
