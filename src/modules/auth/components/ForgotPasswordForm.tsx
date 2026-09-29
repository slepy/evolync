import { EmailInput, SubmitButton } from "@/modules/core/components";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { YStack } from "tamagui";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../validation/forgotPasswordSchema";

// ============================================================================
// Types
// ============================================================================

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
}

// ============================================================================
// ForgotPasswordForm Component
// ============================================================================

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data.email);
  });

  return (
    <YStack gap="$3">
      <EmailInput
        control={control}
        name="email"
        label={t("email")}
        error={errors.email?.message}
        disabled={isLoading}
      />

      <SubmitButton
        onPress={handleFormSubmit}
        isLoading={isLoading}
        disabled={!isValid || isLoading}
        title={t("sendResetLink")}
      />
    </YStack>
  );
};
