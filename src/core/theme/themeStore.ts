import { createStore } from "zustand/vanilla";
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_STORAGE_KEY,
  parseThemePreference,
  type ThemePreference,
} from "./resolve";

export interface ThemeStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  load: () => Promise<void>;
}

/**
 * Device-local theme preference. `setPreference` updates synchronously and
 * persists fire-and-forget; `load` never throws (falls back to "system").
 */
export function createThemeStore(storage: ThemeStorage) {
  return createStore<ThemeState>()((set) => ({
    preference: DEFAULT_THEME_PREFERENCE,
    setPreference: (preference) => {
      set({ preference });
      storage.setItem(THEME_STORAGE_KEY, preference).catch((error) => {
        console.warn("Failed to persist theme preference:", error);
      });
    },
    load: async () => {
      try {
        const stored = await storage.getItem(THEME_STORAGE_KEY);
        set({ preference: parseThemePreference(stored) });
      } catch (error) {
        console.warn("Failed to load theme preference:", error);
        set({ preference: DEFAULT_THEME_PREFERENCE });
      }
    },
  }));
}
