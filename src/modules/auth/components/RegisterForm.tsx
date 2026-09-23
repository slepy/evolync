import { EmailInput, ErrorBanner, PasswordInput, PhoneInput, SubmitButton, TextInput } from '@/modules/core/components';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { YStack } from 'tamagui';
import { useRegister } from '../hooks/useRegister';
import type { RegisterRequest } from '../types/registerDto';
import {
  registerSchema,
  type RegisterFormValues,
} from '../validation/registerSchema';

export const RegisterForm: React.FC = () => {
  const { register: registerUser, isLoading, error: apiError } = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: { prefix: '+48', number: '' },
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    const { confirmPassword, phone, ...registerData } = data;

    // Build phone_number string if number was provided
    const phoneNumber =
      phone && phone.number ? `${phone.prefix}${phone.number}` : undefined;

    const finalData: RegisterRequest = {
      email: registerData.email,
      password: registerData.password,
      ...(registerData.full_name ? { full_name: registerData.full_name } : {}),
      ...(phoneNumber ? { phone_number: phoneNumber } : {}),
    };

    await registerUser(finalData);
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

      {/* Full Name (Optional) */}
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

      {/* Phone Number (Optional) */}
      <PhoneInput
        control={control}
        name="phone"
        label={t('phoneNumber')}
        error={errors.phone?.message as string | undefined}
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
