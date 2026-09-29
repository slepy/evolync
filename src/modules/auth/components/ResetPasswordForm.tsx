import { PasswordInput, SubmitButton } from "@/modules/core/components";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { YStack } from "tamagui";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../validation/resetPasswordSchema";

// ============================================================================
// Types
// ============================================================================

interface ResetPasswordFormProps {
  onSubmit: (password: string) => Promise<void>;
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
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data.password);
  });

  return (
    <YStack gap="$3">
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
