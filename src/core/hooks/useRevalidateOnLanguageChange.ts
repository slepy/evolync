import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * Re-validates the form fields that show an error when the language changes,
 * so their messages (built by `localizedSchema`) switch with the rest of the
 * screen — e.g. after the sign-in corner's language picker. Pass React Hook
 * Form's `formState.errors` and `trigger`.
 */
export function useRevalidateOnLanguageChange(errors: object, trigger: (names: any) => unknown) {
  const { i18n } = useTranslation();
  const language = i18n.language;
  const shownLanguage = useRef(language);
  const latest = useRef({ errors, trigger });
  latest.current = { errors, trigger };

  useEffect(() => {
    if (shownLanguage.current === language) return;
    shownLanguage.current = language;
    const fields = Object.keys(latest.current.errors).filter((name) => name !== "root");
    if (fields.length > 0) latest.current.trigger(fields);
  }, [language]);
}
