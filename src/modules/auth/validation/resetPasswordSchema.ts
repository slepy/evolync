import { z } from 'zod';
import { passwordRegex } from './registerSchema';

/**
 * Validation schema for verifying the emailed recovery code and setting a new
 * password in a single step. Reuses the same complexity rules as registration.
 */
export const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .length(6, t('otpCodeLength'))
      .regex(/^\d{6}$/, t('otpCodeInvalid')),
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
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
