/**
 * i18n TypeScript type definitions
 * Provides type safety for translation keys
 */

import en from './locales/en.json';

export type TranslationKeys = typeof en;

export type LanguageCode = 'en' | 'pl';

export interface Language {
  code: LanguageCode;
  label: string;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: TranslationKeys;
    };
  }
}
