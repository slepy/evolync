import { PasswordInput, SubmitButton, TextInput } from "@/modules/core/components";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { YStack } from "tamagui";
import {
  OTP_MAX_LENGTH,
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
      <TextInput
        control={control}
        name="code"
        label={t("otpCode")}
        placeholder="00000000"
        error={errors.code?.message}
        disabled={isLoading}
        keyboardType="number-pad"
        maxLength={OTP_MAX_LENGTH}
        autoCapitalize="none"
        flex={0}
      />

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
