import { z } from 'zod';
import { localizedSchema } from '@/core/utils/localizedSchema';

/**
 * Validation schema for the "forgot password" request form (email only).
 */
export const forgotPasswordSchema = localizedSchema(() =>
  z.object({
    email: z.string().trim().email(t('invalidEmail')),
  }),
);

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
