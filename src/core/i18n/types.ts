/**
 * i18n TypeScript type definitions
 * Provides type safety for translation keys
 */

import en from './locales/en.json';

export type TranslationKeys = typeof en;

export type LanguageCode = 'en' | 'pl' | 'hu';

export interface Language {
  code: LanguageCode;
  /** Name in the language itself ("Magyar"). */
  label: string;
  /** Short code shown in the sign in corner ("HU"). */
  short: string;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: TranslationKeys;
    };
  }
}
