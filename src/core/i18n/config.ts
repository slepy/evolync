import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import en from './locales/en.json';
import pl from './locales/pl.json';

const LANGUAGE_STORAGE_KEY = '@evolync:language';

// Platform-safe storage wrapper
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore localStorage errors on web
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
};

// Get device locale or default to 'en'
const getDeviceLanguage = (): string => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  return deviceLocale === 'pl' ? 'pl' : 'en';
};

// Initialize i18n SYNCHRONOUSLY with device language
// AsyncStorage language preference is loaded in background and applied later
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pl: { translation: pl },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
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

// Load stored language preference in background and apply if different from device default
// Wrapped in setTimeout to ensure storage is fully initialized
setTimeout(() => {
  storage
    .getItem(LANGUAGE_STORAGE_KEY)
    .then((storedLanguage) => {
      if (storedLanguage && storedLanguage !== i18n.language) {
        i18n.changeLanguage(storedLanguage);
      }
    })
    .catch((error) => {
      console.warn('Failed to load stored language preference:', error);
    });
}, 0);

// Change language and persist choice
export const changeLanguage = async (language: 'en' | 'pl') => {
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
export const getAvailableLanguages = () => [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
];

export default i18n;
