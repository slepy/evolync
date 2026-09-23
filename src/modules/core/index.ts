/**
 * Core module exports
 * Central export point for all core functionality
 */

// i18n exports
export { useTranslation } from '@/core/i18n';
export { changeLanguage, getCurrentLanguage, getAvailableLanguages } from '@/core/i18n';
export { LanguageSwitcher } from '@/core/i18n';

// Re-export commonly used hooks and utilities as they are created
// Example:
// export { useColorScheme } from './hooks/useColorScheme';
