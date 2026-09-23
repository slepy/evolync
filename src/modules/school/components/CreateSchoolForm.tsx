import { ErrorBanner, TextInput } from "@/modules/core/components";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { YStack } from "tamagui";
import type { CreateSchoolFormValues } from "../validation";
import { createSchoolSchema } from "../validation";

// ============================================================================
// Types
// ============================================================================

export interface CreateSchoolFormHandle {
  submit: () => void;
}

interface CreateSchoolFormProps {
  onSubmit: (data: CreateSchoolFormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onResetError: () => void;
}

// ============================================================================
// CreateSchoolForm Component
// ============================================================================

export const CreateSchoolForm = forwardRef<
  CreateSchoolFormHandle,
  CreateSchoolFormProps
>(({ onSubmit, isLoading, error, onResetError }, ref) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSchoolFormValues>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: {
      name: "",
    },
  });

  useImperativeHandle(ref, () => ({
    submit: handleSubmit(onSubmit),
  }));

  return (
    <YStack gap="$4" width="100%">
      {/* Error Banner */}
      {error && (
        <ErrorBanner
          title={t("errorCreateFailed")}
          message={error}
          onDismiss={onResetError}
        />
      )}

      {/* Name Input */}
      <TextInput
        control={control}
        name="name"
        label={t("schoolNameLabel")}
        placeholder={t("schoolNamePlaceholder")}
        error={errors.name?.message}
        disabled={isLoading}
        autoCapitalize="words"
      />
    </YStack>
  );
});
