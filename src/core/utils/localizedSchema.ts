import i18n from "i18next";
import { z } from "zod";

/**
 * A Zod schema whose messages follow the current language. `build` calls t()
 * and runs again after a language change, instead of once at import (which
 * froze messages in the language the app started in). Use it for any schema
 * whose messages are translated text rather than translation keys.
 */
export function localizedSchema<T extends z.ZodTypeAny>(build: () => T): z.ZodLazy<T> {
  let cached: { language: string | undefined; schema: T } | null = null;
  return z.lazy(() => {
    const language = i18n.language;
    if (!cached || cached.language !== language) {
      cached = { language, schema: build() };
    }
    return cached.schema;
  });
}
