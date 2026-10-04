import { create } from "zustand";
import type { NavHome } from "./navItems";

interface NavState {
  /** Dashboard last shown; Home goes back to it from the tab screens. */
  home: NavHome | null;
  setHome: (home: NavHome) => void;
}

export const useNavStore = create<NavState>((set) => ({
  home: null,
  setHome: (home) => set((prev) => (prev.home === home ? prev : { home })),
}));
