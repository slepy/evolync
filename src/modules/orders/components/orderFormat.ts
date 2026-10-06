import { formatPrice } from "@/modules/core/utils/formatters";

const localeTag = (): string => (t("locale") === "pl" ? "pl-PL" : "en-US");

/** "12 Mar" (list rows). */
export const formatOrderDay = (date: Date): string =>
  date.toLocaleDateString(localeTag(), { day: "numeric", month: "short" });

/** "12 Mar 2026, 14:05" (details: Created / Updated). */
export const formatOrderDateTime = (date: Date): string =>
  date.toLocaleString(localeTag(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** "240,00 zł · 20,00 €" — one amount per currency. */
export const formatOrderTotals = (totals: Record<string, number>): string =>
  Object.entries(totals)
    .map(([currency, amount]) => formatPrice(amount, currency))
    .join(" · ");
