import { useColorScheme } from "react-native";
import { useStore } from "zustand";
import { storage } from "../storage";
import { resolveTheme, type ResolvedTheme } from "./resolve";
import { createThemeStore } from "./themeStore";

export type { ResolvedTheme, ThemePreference } from "./resolve";

export const themeStore = createThemeStore(storage);

// Phase 1 of the dark-mode rollout: every screen renders light until the color
// migration lands. Set to null to honor the user's preference.
const FORCED_THEME: ResolvedTheme | null = "light";

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
  return FORCED_THEME ?? resolveTheme(preference, systemScheme);
}
