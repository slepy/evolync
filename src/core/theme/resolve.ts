export type ResolvedTheme = "light" | "dark";

/** The app follows the OS; an unknown/null OS scheme is treated as light. */
export function resolveTheme(systemScheme: string | null | undefined): ResolvedTheme {
  return systemScheme === "dark" ? "dark" : "light";
}
