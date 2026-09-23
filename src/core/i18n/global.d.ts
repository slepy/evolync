/**
 * Global i18n type definitions
 * Makes translation function available globally without imports
 */

declare global {
  /**
   * Global translation function (non-reactive)
   * Available everywhere without imports after app initialization
   *
   * @param key - Translation key (e.g., 'save', 'auth.signIn')
   * @param params - Optional interpolation parameters (e.g., { name: 'John' })
   * @returns Translated string
   *
   * @example
   * // Simple usage
   * <Text>{t('save')}</Text>
   *
   * // With parameters
   * <Text>{t('lastSynced', { time: '5 min ago' })}</Text>
   *
   * // In functions
   * throw new Error(t('emailRequired'));
   *
   * NOTE: Components using global t() won't re-render on language change.
   * Use useTranslation() hook in components with language switchers.
   */
  function t(key: string, params?: Record<string, any>): string;

  // Also declare it on globalThis for React Native compatibility
  var globalThis: typeof globalThis & {
    t: (key: string, params?: Record<string, any>) => string;
  };
}

export {};
