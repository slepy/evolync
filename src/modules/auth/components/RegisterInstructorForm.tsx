import { AlertBanner, AuthPage, AuthPrompt, PrimaryButton, TextField } from '@/core/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRevalidateOnLanguageChange } from '@/core/hooks';
import { Text } from 'tamagui';
import { useRegisterInstructor } from '../hooks/useRegisterInstructor';
import type { RegisterInstructorRequest } from '../types/registerDto';
import { registerInstructorSchema, type RegisterInstructorFormValues } from '../validation/registerSchema';
import { PasswordFields } from './PasswordFields';

interface SectionTitleProps {
  children: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children }) => (
  <Text fontSize={18} fontWeight="$section" color="$neutralText" marginTop={6}>
    {children}
  </Text>
);

/**
 * New organization screen (sign up → "I run a school" board): "Your account"
 * (name, email, password + rules, confirm) and "Organization" (name, first
 * school), amber Create pinned at the bottom.
 */
export const RegisterInstructorForm: React.FC = () => {
  const router = useRouter();
  const { register, isLoading, error: apiError } = useRegisterInstructor();
  const [errorDismissed, setErrorDismissed] = useState(false);

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
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
  useRevalidateOnLanguageChange(errors, trigger);

  const onSubmit = handleSubmit(async (data) => {
    setErrorDismissed(false);
    const { confirmPassword, ...requestData } = data;
    await register(requestData as RegisterInstructorRequest);
  });

  return (
    <AuthPage
      title={t('authNewOrganization')}
      footer={<PrimaryButton label={t('create')} accent="organization" onPress={onSubmit} loading={isLoading} />}
    >
      {apiError && !errorDismissed ? (
        <AlertBanner title={apiError} onDismiss={() => setErrorDismissed(true)} />
      ) : null}

      <SectionTitle>{t('authYourAccount')}</SectionTitle>
      <Controller
        control={control}
        name="full_name"
        render={({ field }) => (
          <TextField
            size="large"
            accent="organization"
            label={t('fullName')}
            value={field.value}
            onChangeText={field.onChange}
            placeholder={t('fullNamePlaceholder')}
            error={errors.full_name?.message}
            disabled={isLoading}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            size="large"
            accent="organization"
            label={t('email')}
            value={field.value}
            onChangeText={(v) => field.onChange(v.trim())}
            error={errors.email?.message}
            disabled={isLoading}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
        )}
      />
      <PasswordFields
        control={control}
        errors={errors}
        password="password"
        confirm="confirmPassword"
        passwordLabel={t('password')}
        confirmLabel={t('confirmPassword')}
        accent="organization"
        disabled={isLoading}
      />

      <SectionTitle>{t('organization')}</SectionTitle>
      <Controller
        control={control}
        name="organization_name"
        render={({ field }) => (
          <TextField
            size="large"
            accent="organization"
            label={t('organizationName')}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.organization_name?.message}
            disabled={isLoading}
            autoCapitalize="words"
          />
        )}
      />
      <Controller
        control={control}
        name="school_name"
        render={({ field }) => (
          <TextField
            size="large"
            accent="organization"
            label={t('authFirstSchool')}
            value={field.value}
            onChangeText={field.onChange}
            hint={t('authFirstSchoolHint')}
            error={errors.school_name?.message}
            disabled={isLoading}
            autoCapitalize="words"
          />
        )}
      />

      <AuthPrompt text={t('authHaveAccount')} action={t('authSignIn')} onPress={() => router.replace('/auth/login' as any)} />
    </AuthPage>
  );
};
