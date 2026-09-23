import { ErrorBanner, ImagePicker, PhoneInput, TextInput } from "@/modules/core/components";
import type { PhoneValue } from "@/modules/core/components";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { Controller, useForm } from "react-hook-form";
import { YStack } from "tamagui";
import {
  profileSchema,
  type ProfileFormValues,
} from "../validation/profileSchema";

// ============================================================================
// Types
// ============================================================================

export interface ProfileFormHandle {
  submit: () => void;
  isDirty: boolean;
}

export interface ProfileFormProps {
  /** Initial profile data for edit mode */
  initialData: {
    full_name: string;
    avatar_url: string | null;
    email?: string;
    phone?: PhoneValue | null;
  };
  /** Callback when form is submitted with valid data */
  onSubmit: (data: ProfileFormValues) => void;
  /** Whether form submission is in progress */
  isLoading: boolean;
  /** Error message to display */
  error?: string | null;
  /** Callback to reset error state */
  onResetError?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

// ============================================================================
// ProfileForm Component
// ============================================================================

export const ProfileForm = forwardRef<ProfileFormHandle, ProfileFormProps>(
  ({ initialData, onSubmit, isLoading, error, onResetError, onDirtyChange }, ref) => {
    const {
      control,
      handleSubmit,
      formState: { errors, isDirty },
    } = useForm<ProfileFormValues>({
      resolver: zodResolver(profileSchema),
      mode: "onBlur",
      defaultValues: {
        full_name: initialData.full_name,
        avatar_url: initialData.avatar_url,
        phone: initialData.phone ?? { prefix: "+48", number: "" },
      },
    });

    useImperativeHandle(ref, () => ({
      submit: handleSubmit(onSubmit),
      isDirty,
    }));

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    return (
      <YStack gap="$6">
        {/* Error Banner */}
        {error && (
          <ErrorBanner
            title={t("error")}
            message={error}
            onDismiss={onResetError ?? (() => {})}
          />
        )}

        {/* Avatar Picker */}
        <Controller
          control={control}
          name="avatar_url"
          render={({ field: { value, onChange } }) => (
            <ImagePicker
              value={value}
              onChange={onChange}
              label={t("profileAvatar")}
              aspect={[1, 1]}
              quality={0.8}
              maxSize={512}
            />
          )}
        />

        {/* Full Name */}
        <TextInput
          control={control}
          name="full_name"
          label={t("fullName")}
          placeholder={t("fullNamePlaceholder")}
          error={errors.full_name?.message}
          autoCapitalize="words"
        />

        {/* Phone Number */}
        <PhoneInput
          control={control}
          name="phone"
          label={t("phoneNumber")}
          error={errors.phone?.message as string | undefined}
          disabled={isLoading}
        />

        {/* Email (read-only info) */}
        {initialData.email && (
          <TextInput
            value={initialData.email}
            onChangeText={() => {}}
            label={t("email")}
            placeholder=""
            disabled
          />
        )}
      </YStack>
    );
  },
);
