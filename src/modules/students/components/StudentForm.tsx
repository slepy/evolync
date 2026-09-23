import { ErrorBanner, TextInput } from "@/modules/core/components";
import { PhoneInput } from "@/modules/core/components/PhoneInput";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { forwardRef, useCallback, useEffect, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { YStack } from "tamagui";
import type { StudentFormValues } from "../validation";
import { studentSchema } from "../validation";

// ============================================================================
// Types
// ============================================================================

export interface StudentFormHandle {
  submit: () => void;
}

interface StudentFormProps {
  defaultValues?: Partial<StudentFormValues>;
  onSubmit: (data: StudentFormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onResetError: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

// ============================================================================
// StudentForm Component
// ============================================================================

/**
 * Form for creating or editing a student (Shadow User).
 *
 * Fields:
 * - displayName (required)
 * - email (optional)
 * - phoneNumber (optional)
 *
 * Accepts defaultValues for edit mode (pre-fills existing data).
 */
export const StudentForm = forwardRef<StudentFormHandle, StudentFormProps>(
  ({ defaultValues, onSubmit, isLoading, error, onResetError, onDirtyChange }, ref) => {
    const {
      control,
      handleSubmit,
      formState: { errors, isDirty },
    } = useForm<StudentFormValues>({
      resolver: zodResolver(studentSchema),
      defaultValues: {
        displayName: "",
        email: "",
        phoneNumber: undefined,
        ...defaultValues,
      },
    });

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    const submit = useCallback(() => {
      handleSubmit(onSubmit)();
    }, [handleSubmit, onSubmit]);

    useImperativeHandle(ref, () => ({ submit }), [submit]);

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
          name="displayName"
          label={t("studentNameLabel")}
          placeholder={t("studentNamePlaceholder")}
          error={errors.displayName?.message}
          disabled={isLoading}
          autoCapitalize="words"
        />

        {/* Email Input */}
        <TextInput
          control={control}
          name="email"
          label={t("email")}
          placeholder={t("emailPlaceholder")}
          error={errors.email?.message}
          disabled={isLoading}
          autoCapitalize="none"
        />

        {/* Phone Input */}
        <PhoneInput
          control={control}
          name="phoneNumber"
          label={t("phoneNumber")}
          error={errors.phoneNumber?.number?.message}
          disabled={isLoading}
        />
      </YStack>
    );
  },
);
