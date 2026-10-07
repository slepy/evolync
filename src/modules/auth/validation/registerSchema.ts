import { z } from 'zod';
import { passwordRegex } from '../utils/passwordRules';

export { passwordRegex };

/**
 * Validation schema for instructor registration form.
 * Extends the DTO with confirmPassword field for UI validation.
 */
export const registerInstructorSchema = z
  .object({
    full_name: z
      .string()
      .min(2, t('fullNameRequired')),
    email: z
      .string()
      .email(t('invalidEmail')),
    password: z
      .string()
      .min(8, t('passwordMinLength', { count: 8 }))
      .regex(passwordRegex, t('passwordComplexity')),
    confirmPassword: z
      .string()
      .min(8, t('required')),
    organization_name: z
      .string()
      .min(3, t('organizationNameRequired')),
    school_name: z
      .string()
      .min(3, t('schoolNameRequired')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('passwordsMustMatch'),
    path: ['confirmPassword'],
  });

/**
 * TypeScript type inferred from the validation schema.
 * Used by React Hook Form for type-safe form values.
 */
export type RegisterInstructorFormValues = z.infer<typeof registerInstructorSchema>;

const phoneValueSchema = z.object({
  prefix: z.string(),
  number: z.string(),
});

/**
 * Validation schema for user registration form (no organization).
 * Requires only email and password (full_name optional, phone optional).
 */
export const registerSchema = z
  .object({
    full_name: z.string().optional().or(z.literal('')), // Allow empty field
    email: z
      .string()
      .email(t('invalidEmail')),
    password: z
      .string()
      .min(8, t('passwordMinLength', { count: 8 }))
      .regex(passwordRegex, t('passwordComplexity')), // Same regex as Instructor
    confirmPassword: z
      .string()
      .min(8, t('required')),
    phone: phoneValueSchema
      .optional()
      .refine(
        (val) => !val || val.number === '' || /^\d{4,15}$/.test(val.number),
        { message: t('phoneNumberInvalid') },
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('passwordsMustMatch'),
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
