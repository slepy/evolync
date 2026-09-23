import type { LucideIcon } from "lucide-react-native";

// ============================================================================
// Enums
// ============================================================================

export enum THREED_TAB {
  SEQUENCES = "sequences",
  TECHNIQUES = "techniques",
  POSITIONS = "positions",
}

export type ThreeDTabValue = `${THREED_TAB}`;

// ============================================================================
// Tab definition
// ============================================================================

export interface ThreeDTab {
  value: THREED_TAB;
  label: string;
  icon: LucideIcon;
}
