export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "@evolync:theme";
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

/** Missing, corrupt or unknown stored values fall back to "system". */
export function parseThemePreference(raw: unknown): ThemePreference {
  return raw === "light" || raw === "dark" || raw === "system"
    ? raw
    : DEFAULT_THEME_PREFERENCE;
}

/** "system" follows the OS; an unknown/null OS scheme is treated as light. */
export function resolveTheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined
): ResolvedTheme {
  if (preference !== "system") return preference;
  return systemScheme === "dark" ? "dark" : "light";
}
