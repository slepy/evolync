import { format, isSameDay } from "date-fns";
import { dateFnsLocale, intlLocaleTag } from "@/core/i18n/localeTags";

/**
 * Shared formatting utilities
 */

/**
 * Gets the date-fns locale based on the current app locale
 */
const getLocale = () => dateFnsLocale(t("locale"));

/**
 * Gets the Intl locale string based on the current app locale
 */
const getIntlLocale = () => intlLocaleTag(t("locale"));

/**
 * Formats a price with the given currency using the current locale
 * @param price - The price amount
 * @param currency - Currency code (e.g., "PLN", "EUR")
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string): string => {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: "currency",
    currency: currency,
  }).format(price);
};

/**
 * Formats a date range for display
 * - Single day: "5 January 2026"
 * - Same month: "5 - 10 January 2026"
 * - Different months: "28 Dec - 3 Jan 2026"
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const locale = getLocale();

  if (isSameDay(startDate, endDate)) {
    return format(startDate, "d MMMM yyyy", { locale });
  }

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth) {
    return `${format(startDate, "d", { locale })} - ${format(endDate, "d MMMM yyyy", { locale })}`;
  }

  return `${format(startDate, "d MMM", { locale })} - ${format(endDate, "d MMM yyyy", { locale })}`;
};
