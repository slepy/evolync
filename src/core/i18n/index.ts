/**
 * i18n module exports
 * Central export point for internationalization functionality
 */

export { default as i18n, changeLanguage, getCurrentLanguage, getAvailableLanguages } from './config';
export { useTranslation } from '../hooks/useTranslation';
export { LanguageSwitcher } from '../components/LanguageSwitcher';
export { t } from './helpers';
