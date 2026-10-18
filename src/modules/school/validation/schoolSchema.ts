import { z } from 'zod';
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
} from '@/core/utils/currencies';

/**
 * Validation schema for creating a new school
 *
 * Validation rules:
 * - name: Required, 2-100 characters
 */
export const createSchoolSchema = z.object({
  name: z
    .string()
    .min(2, t('nameTooShort'))
    .max(100, t('nameTooLong', { count: 100 }))
    .trim(),
});

/**
 * TypeScript type inferred from the schema
 * Use this for type-safe form values
 */
export type CreateSchoolFormValues = z.infer<typeof createSchoolSchema>;

/**
 * Validation schema for updating an existing school
 */
export const updateSchoolSchema = z.object({
  name: z
    .string()
    .min(2, t('nameTooShort'))
    .max(100, t('nameTooLong', { count: 100 }))
    .trim(),
  address: z
    .string()
    .max(500, t('addressTooLong'))
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
});

export type UpdateSchoolFormValues = z.infer<typeof updateSchoolSchema>;

/**
 * Validation schema for school settings (payment defaults)
 */
export const schoolSettingsSchema = z.object({
  defaultCurrency: z
    .string()
    .length(3, 'settings.validation.currencyInvalidFormat')
    .toUpperCase()
    .refine(
      (val) => SUPPORTED_CURRENCIES.includes(val as any),
      'settings.validation.currencyNotSupported'
    )
    .default(DEFAULT_CURRENCY),

  defaultPaymentAmount: z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(',', '.') : val),
    z.coerce
      .number({
        required_error: 'settings.validation.amountRequired',
        invalid_type_error: 'settings.validation.amountInvalidType',
      })
      .nonnegative('settings.validation.amountMustBePositive')
      .multipleOf(0.01, 'settings.validation.amountTooManyDecimals')
      .default(0)
  ),
});

export type SchoolSettingsFormValues = z.infer<typeof schoolSettingsSchema>;

/**
 * Combined schema for the settings form (school info + payment settings)
 */
export const schoolSettingsFormSchema = z.object({
  ...updateSchoolSchema.shape,
  ...schoolSettingsSchema.shape,
});

export type CombinedSchoolSettingsFormValues = z.infer<typeof schoolSettingsFormSchema>;
