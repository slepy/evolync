import { z } from 'zod';

/**
 * Validation schema for the "forgot password" request form (email only).
 */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(t('invalidEmail')),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
