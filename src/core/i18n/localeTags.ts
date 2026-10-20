import type { Locale } from "date-fns";
import { enUS, hu, pl } from "date-fns/locale";

/**
 * Formatting locales of an app language ("en" / "pl" / "hu", or a tag like
 * "pl-PL"). English screens differ in date order, so callers pick `en`.
 */

const base = (language: string | null | undefined) => (language ?? "").toLowerCase().slice(0, 2);

/** Intl locale tag: "pl-PL", "hu-HU", otherwise the given English tag. */
export const intlLocaleTag = (language: string | null | undefined, en: "en-US" | "en-GB" = "en-US"): string => {
  const code = base(language);
  if (code === "pl") return "pl-PL";
  if (code === "hu") return "hu-HU";
  return en;
};

/** date-fns locale of an app language. */
export const dateFnsLocale = (language: string | null | undefined): Locale => {
  const code = base(language);
  if (code === "pl") return pl;
  if (code === "hu") return hu;
  return enUS;
};
