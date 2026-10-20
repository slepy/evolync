import type { LucideIcon } from "lucide-react-native";

export interface BottomNavItem {
  key: string;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  /** Red dot on the icon (unread alerts). */
  dot?: boolean;
}
