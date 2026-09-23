/**
 * i18n helper utilities
 * Provides standalone translation function for use with explicit imports
 */

import i18n from "./config";

/**
 * Standalone translation function (non-reactive)
 * Use this when you need to explicitly import the translation function
 *
 * Note: The global t() function is available everywhere without imports.
 * This export is provided for cases where explicit imports are preferred.
 *
 * @param key - Translation key (e.g., 'save')
 * @param params - Optional interpolation parameters
 * @returns Translated string
 *
 * WARNING: This will NOT re-render components when language changes!
 * For reactive components, use the useTranslation() hook instead.
 */
export const t = (key: string, params?: Record<string, any>): string => {
  // @ts-ignore - i18n types are too strict for dynamic keys
  return params ? i18n.t(key, params) : i18n.t(key);
};
