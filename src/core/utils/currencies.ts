/**
 * Supported currency codes (ISO 4217)
 */
export const SUPPORTED_CURRENCIES = ["PLN", "EUR", "USD", "GBP"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Default currency
 */
export const DEFAULT_CURRENCY: SupportedCurrency = "PLN";
