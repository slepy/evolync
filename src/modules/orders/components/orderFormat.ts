const localeTag = (): string => (t("locale") === "pl" ? "pl-PL" : "en-US");

/** "12 Mar" (list rows). */
export const formatOrderDay = (date: Date): string =>
  date.toLocaleDateString(localeTag(), { day: "numeric", month: "short" });

/** "8 Nov 2025, 18:42" (details: Created / Updated). */
export const formatOrderDateTime = (date: Date): string =>
  `${date.toLocaleDateString(localeTag(), { day: "numeric", month: "short", year: "numeric" })}, ${date.toLocaleTimeString(localeTag(), { hour: "2-digit", minute: "2-digit" })}`;
