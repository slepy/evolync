import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook for translations with TypeScript support
 * Re-exports react-i18next's useTranslation hook with better typing
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  return {
    t,
    i18n,
    language: i18n.language,
    changeLanguage: i18n.changeLanguage,
  };
};
