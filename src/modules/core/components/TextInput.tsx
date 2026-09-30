import React, { useId } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input, Label, Text, YStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface BaseTextInputProps {
  label?: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoFocus?: boolean;
  keyboardType?: "default" | "number-pad" | "email-address" | "phone-pad";
  maxLength?: number;
  flex?: number;
}

interface FormTextInputProps<
  TFieldValues extends FieldValues,
> extends BaseTextInputProps {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  value?: never;
  onChangeText?: never;
}

interface StandaloneTextInputProps extends BaseTextInputProps {
  control?: never;
  name?: string;
  value: string;
  onChangeText: (text: string) => void;
}

type TextInputProps<TFieldValues extends FieldValues = FieldValues> =
  | FormTextInputProps<TFieldValues>
  | StandaloneTextInputProps;

// ============================================================================
// TextInput Component
// ============================================================================

/**
 * Reusable text input component with validation and error display.
 * Supports both React Hook Form and standalone usage.
 *
 * @example React Hook Form mode
 * <TextInput
 *   control={control}
 *   name="full_name"
 *   label={t('authRegisterInstructorFullName')}
 *   placeholder={t('authRegisterInstructorFullNamePlaceholder')}
 *   error={errors.full_name?.message}
 * />
 *
 * @example Standalone mode
 * <TextInput
 *   value={name}
 *   onChangeText={setName}
 *   label="Name"
 *   placeholder="Enter name"
 * />
 */
export const TextInput = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  disabled = false,
  autoCapitalize = "sentences",
  autoFocus,
  keyboardType,
  maxLength,
  flex = 1,
  value: standaloneValue,
  onChangeText: standaloneOnChangeText,
}: TextInputProps<TFieldValues>) => {
  const autoId = useId();
  const inputId = name ?? autoId;

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
      autoCapitalize={autoCapitalize}
      autoFocus={autoFocus}
      keyboardType={keyboardType}
      maxLength={maxLength}
      borderColor={error ? "$imperialRed" : "$softGrayLight"}
      borderWidth={2}
      focusStyle={{
        borderColor: error ? "$imperialRed" : "$chineseGold",
        backgroundColor: "$pearlWhiteLight",
      }}
      backgroundColor={disabled ? "$softGrayLight" : "$pearlWhite"}
      color="$inkBlack"
      placeholderTextColor="$softGray"
    />
  );

  return (
    <YStack gap="$2" flex={flex} {...(flex !== 1 && { flexBasis: 0 })}>
      {label && (
        <Text fontSize="$3" color="$softGrayDark" fontWeight="500">
          {label}
        </Text>
      )}

      {control && name ? (
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) =>
            renderInput(value as string, onChange, onBlur)
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
