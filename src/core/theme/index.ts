import { useColorScheme } from "react-native";
import { useStore } from "zustand";
import { storage } from "../storage";
import { resolveTheme, type ResolvedTheme } from "./resolve";
import { createThemeStore } from "./themeStore";

export type { ResolvedTheme, ThemePreference } from "./resolve";
export * from "./tokens";

export const themeStore = createThemeStore(storage);

/** Read the stored preference; call before hiding the splash screen. */
export const loadThemePreference = (): Promise<void> => themeStore.getState().load();

export function useThemePreference() {
  const preference = useStore(themeStore, (state) => state.preference);
  const setPreference = useStore(themeStore, (state) => state.setPreference);
  return { preference, setPreference };
}

export function useResolvedTheme(): ResolvedTheme {
  const preference = useStore(themeStore, (state) => state.preference);
  const systemScheme = useColorScheme();
  return resolveTheme(preference, systemScheme);
}
