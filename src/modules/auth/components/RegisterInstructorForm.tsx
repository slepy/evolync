import { EmailInput, ErrorBanner, PasswordInput, SubmitButton, TextInput } from '@/modules/core/components';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { YStack } from 'tamagui';
import { useRegisterInstructor } from '../hooks/useRegisterInstructor';
import type { RegisterInstructorRequest } from '../types/registerDto';
import {
  registerInstructorSchema,
  type RegisterInstructorFormValues,
} from '../validation/registerSchema';

export const RegisterInstructorForm: React.FC = () => {
  const { register, isLoading, error: apiError } = useRegisterInstructor();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterInstructorFormValues>({
    resolver: zodResolver(registerInstructorSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      organization_name: '',
      school_name: '',
    },
  });

  const onSubmit = async (data: RegisterInstructorFormValues) => {
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...requestData } = data;
    await register(requestData as RegisterInstructorRequest);
  };

  const clearError = () => {
    // Error is managed by the hook, will be cleared on next attempt
  };

  return (
    <YStack gap="$3">
      {/* API Error Banner */}
      {apiError && (
        <ErrorBanner
          title={t('errorUnknown')}
          message={apiError}
          onDismiss={clearError}
        />
      )}

      {/* Full Name */}
      <TextInput
        control={control}
        name="full_name"
        label={t('fullName')}
        placeholder={t('fullNamePlaceholder')}
        error={errors.full_name?.message}
        disabled={isLoading}
      />

      {/* Email */}
      <EmailInput
        control={control}
        name="email"
        label={t('email')}
        error={errors.email?.message}
        disabled={isLoading}
      />

      {/* Password */}
      <PasswordInput
        control={control}
        name="password"
        label={t('password')}
        error={errors.password?.message}
        disabled={isLoading}
      />

      {/* Confirm Password */}
      <PasswordInput
        control={control}
        name="confirmPassword"
        label={t('confirmPassword')}
        error={errors.confirmPassword?.message}
        disabled={isLoading}
      />

      {/* Organization Name */}
      <TextInput
        control={control}
        name="organization_name"
        label={t('organizationName')}
        placeholder={t('organizationName')}
        error={errors.organization_name?.message}
        disabled={isLoading}
      />

      {/* School Name */}
      <TextInput
        control={control}
        name="school_name"
        label={t('firstSchoolName')}
        placeholder={t('firstSchoolName')}
        error={errors.school_name?.message}
        disabled={isLoading}
      />

      {/* Submit Button */}
      <SubmitButton
        onPress={handleSubmit(onSubmit)}
        isLoading={isLoading}
        disabled={!isValid || isLoading}
        title={t('createAccount')}
      />
    </YStack>
  );
};
