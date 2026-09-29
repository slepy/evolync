import { PasswordInput, SubmitButton } from "@/modules/core/components";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Input, Text, YStack } from "tamagui";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../validation/resetPasswordSchema";

// ============================================================================
// Types
// ============================================================================

interface ResetPasswordFormProps {
  onSubmit: (code: string, password: string) => Promise<void>;
  isLoading: boolean;
}

// ============================================================================
// ResetPasswordForm Component
// ============================================================================

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data.code, data.password);
  });

  return (
    <YStack gap="$3">
      <YStack gap="$2">
        <Text fontSize="$3" color="$softGrayDark" fontWeight="500">
          {t("otpCode")}
        </Text>
        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              id="code"
              placeholder="000000"
              value={value}
              onChangeText={(text) => onChange(text.replace(/[^0-9]/g, "").slice(0, 6))}
              onBlur={onBlur}
              disabled={isLoading}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              fontSize="$7"
              letterSpacing={8}
              borderColor={errors.code ? "$imperialRed" : "$softGrayLight"}
              borderWidth={2}
              focusStyle={{
                borderColor: errors.code ? "$imperialRed" : "$chineseGold",
                backgroundColor: "$pearlWhiteLight",
              }}
              backgroundColor="$pearlWhite"
              color="$inkBlack"
              placeholderTextColor="$softGray"
            />
          )}
        />
        {errors.code && (
          <Text color="$imperialRed" fontSize="$3" fontWeight="500">
            {errors.code.message}
          </Text>
        )}
      </YStack>

      <PasswordInput
        control={control}
        name="password"
        label={t("newPassword")}
        error={errors.password?.message}
        disabled={isLoading}
      />

      <PasswordInput
        control={control}
        name="confirmPassword"
        label={t("confirmNewPassword")}
        error={errors.confirmPassword?.message}
        disabled={isLoading}
      />

      <SubmitButton
        onPress={handleFormSubmit}
        isLoading={isLoading}
        disabled={!isValid || isLoading}
        title={t("resetPasswordButton")}
      />
    </YStack>
  );
};
