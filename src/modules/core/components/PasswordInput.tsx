import { Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Pressable } from "react-native";
import { Input, Text, XStack, YStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface PasswordInputProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string;
  error?: string;
  disabled?: boolean;
}

// ============================================================================
// PasswordInput Component
// ============================================================================

/**
 * Reusable password input component with show/hide toggle and error display.
 *
 * @example
 * <PasswordInput
 *   control={control}
 *   name="password"
 *   label={t('password')}
 *   error={errors.password?.message}
 * />
 */
export const PasswordInput = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  error,
  disabled = false,
}: PasswordInputProps<TFieldValues>) => {
  const [showPassword, setShowPassword] = useState(false);
  const defaultLabel = label || t("password");

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <YStack gap="$2">
      <Text fontSize="$3" color="$softGrayDark" fontWeight="500">
        {defaultLabel}
      </Text>

      <XStack position="relative" alignItems="center">
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
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="password"
              autoComplete="password"
              borderColor={error ? "$imperialRed" : "$softGrayLight"}
              borderWidth={2}
              focusStyle={{
                borderColor: error ? "$imperialRed" : "$chineseGold",
                backgroundColor: "$pearlWhiteLight",
              }}
              backgroundColor="$pearlWhite"
              color="$inkBlack"
              flex={1}
              paddingRight="$10"
            />
          )}
        />

        <Pressable
          onPress={togglePasswordVisibility}
          style={{
            position: "absolute",
            right: 12,
            padding: 8,
          }}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff
              size={22}
              color={disabled ? "#94A3B8" : "#64748B"}
              pointerEvents="none"
            />
          ) : (
            <Eye
              size={22}
              color={disabled ? "#94A3B8" : "#64748B"}
              pointerEvents="none"
            />
          )}
        </Pressable>
      </XStack>

      {error && (
        <Text color="$imperialRed" fontSize="$3" fontWeight="500">
          {error}
        </Text>
      )}
    </YStack>
  );
};
