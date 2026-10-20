import { AlertBanner, AuthPage, AuthPrompt, PhoneField, PrimaryButton, TextField } from '@/core/components';
import { contextColors } from '@/core/theme/tokens';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRegister } from '../hooks/useRegister';
import type { RegisterRequest } from '../types/registerDto';
import { registerSchema, type RegisterFormValues } from '../validation/registerSchema';
import { PasswordFields } from './PasswordFields';
import { PHONE_PREFIXES } from '@/core/utils/phonePrefixes';
import { NextStepCard } from "./NextStepCard";

const student = contextColors.student;

/** Student button gradient of the board: the first two stops of the student context. */
const STUDENT_BUTTON_COLORS = { from: student.gradient[0].color, to: student.gradient[1].color, text: student.fg };

/**
 * useRegister reports either a translation key ("errorEmailAlreadyExists") or a
 * raw Supabase message; only keys go through t(), whose ":" / "." separators
 * would mangle free text.
 */
const registrationErrorMessage = (error: string): string | undefined => {
  if (error === 'errorRegistrationFailed') return undefined;
  return /^error[A-Z]\w*$/.test(error) ? t(error) : error;
};

/**
 * New account screen (sign up → "I train in a school" board): optional name,
 * email, optional phone with prefix, password + rules, confirm, next-step
 * card, blue Create pinned at the bottom. Joining a school comes next.
 */
export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const { register: registerUser, isLoading, error: apiError } = useRegister();
  const [errorDismissed, setErrorDismissed] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
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

  const onSubmit = handleSubmit(async (data) => {
    setErrorDismissed(false);
    const phoneNumber = data.phone && data.phone.number ? `${data.phone.prefix}${data.phone.number}` : undefined;

    const request: RegisterRequest = {
      email: data.email,
      password: data.password,
      ...(data.full_name ? { full_name: data.full_name } : {}),
      ...(phoneNumber ? { phone_number: phoneNumber } : {}),
    };

    await registerUser(request);
  });

  return (
    <AuthPage
      title={t('authNewAccount')}
      footer={<PrimaryButton label={t('create')} colors={STUDENT_BUTTON_COLORS} onPress={onSubmit} loading={isLoading} />}
    >
      {apiError && !errorDismissed ? (
        <AlertBanner title={t('errorRegistrationFailed')} message={registrationErrorMessage(apiError)} onDismiss={() => setErrorDismissed(true)} />
      ) : null}

      <Controller
        control={control}
        name="full_name"
        render={({ field }) => (
          <TextField
            size="large"
            accent="student"
            label={t('authFullNameOptional')}
            value={field.value ?? ''}
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
            accent="student"
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
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <PhoneField
            accent="student"
            label={t('phoneOptional')}
            prefix={field.value?.prefix ?? '+48'}
            number={field.value?.number ?? ''}
            onChange={field.onChange}
            prefixes={PHONE_PREFIXES}
            placeholder="600 123 456"
            error={errors.phone?.message as string | undefined}
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
        accent="student"
        disabled={isLoading}
      />

      <NextStepCard />

      <AuthPrompt text={t('authHaveAccount')} action={t('authSignIn')} onPress={() => router.replace('/auth/login' as any)} />
    </AuthPage>
  );
};
