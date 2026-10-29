import { z } from 'zod';
import { localizedSchema } from '@/core/utils/localizedSchema';
import { passwordRegex } from './registerSchema';

// Supabase's "Email OTP Length" is configurable (6–10 digits) in the
// Dashboard, so accept the whole range instead of pinning one length.
export const OTP_MIN_LENGTH = 6;
export const OTP_MAX_LENGTH = 10;

/**
 * Validation schema for verifying the emailed recovery code and setting a new
 * password in a single step. Reuses the same complexity rules as registration.
 */
export const resetPasswordSchema = localizedSchema(() =>
  z
    .object({
      code: z
        .string()
        .regex(/^\d*$/, t('otpCodeInvalid'))
        .min(OTP_MIN_LENGTH, t('otpCodeLength', { min: OTP_MIN_LENGTH, max: OTP_MAX_LENGTH }))
        .max(OTP_MAX_LENGTH, t('otpCodeLength', { min: OTP_MIN_LENGTH, max: OTP_MAX_LENGTH })),
      password: z
        .string()
        .min(8, t('passwordMinLength', { count: 8 }))
        .regex(passwordRegex, t('passwordComplexity')),
      confirmPassword: z
        .string()
        .min(8, t('required')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordsMustMatch'),
      path: ['confirmPassword'],
    }),
);

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
