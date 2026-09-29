import { z } from 'zod';
import { passwordRegex } from './registerSchema';

/**
 * Validation schema for setting a new password from a recovery link.
 * Reuses the same complexity rules as registration.
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, t('passwordMinLength'))
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
