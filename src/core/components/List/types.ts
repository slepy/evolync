import type { LucideIcon } from "lucide-react-native";

export interface ListSectionAction {
  /** "Add new", "Mark all as read", "Copy"… */
  label: string;
  onPress: () => void;
  /** Default: plus. */
  icon?: LucideIcon;
  /** Accessible label when the visible one is not enough ("Add order, Anna Kowalska"). */
  ariaLabel?: string;
}
