import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../storage';
import type { Language, LanguageCode } from './types';

import en from './locales/en.json';
import hu from './locales/hu.json';
import pl from './locales/pl.json';

// Device-local only: the chosen language is never stored in the database.
const LANGUAGE_STORAGE_KEY = '@evolync:language';

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

// Each language labelled in its own language, short code for the sign in corner.
const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pl', label: 'Polski', short: 'PL' },
  { code: 'hu', label: 'Magyar', short: 'HU' },
];

export const isLanguageCode = (value: unknown): value is LanguageCode =>
  LANGUAGES.some((lang) => lang.code === value);

// Initialize i18n SYNCHRONOUSLY in English until the user picks a language;
// the stored choice is applied by `languageReady` before the splash hides.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pl: { translation: pl },
    hu: { translation: hu },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false, // React Native already escapes values
  },
  react: {
    useSuspense: false, // Important for React Native
  },
});

// Setup global translation function immediately
// Works in both React Native and web environments
(globalThis as any).t = (key: string, params?: Record<string, any>) => {
  // @ts-ignore - i18n types are too strict for dynamic keys
  return params ? i18n.t(key, params) : i18n.t(key);
};

/** Resolves once the stored language (if any) is applied; the root layout waits for it. */
export const languageReady: Promise<void> = new Promise<void>((resolve) => setTimeout(resolve, 0))
  .then(() => storage.getItem(LANGUAGE_STORAGE_KEY))
  .then(async (storedLanguage) => {
    if (isLanguageCode(storedLanguage) && storedLanguage !== i18n.language) {
      await i18n.changeLanguage(storedLanguage);
    }
  })
  .catch((error) => {
    console.warn('Failed to load stored language preference:', error);
  });

// Change language and persist choice
export const changeLanguage = async (language: LanguageCode) => {
  try {
    await storage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

// Get available languages
export const getAvailableLanguages = (): Language[] => LANGUAGES;

export default i18n;
