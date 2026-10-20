import type { LucideIcon } from "lucide-react-native";

export interface ListSectionAction {
  /** "Add new", "Mark all as read", "Copy"… */
  label: string;
  onPress: () => void;
  /** Default: plus. */
  icon?: LucideIcon;
}
