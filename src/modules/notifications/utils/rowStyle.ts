import type { ListAccent } from "@/core/components/List/accent";
import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  CreditCard,
  School,
  ShoppingBag,
  UserPlus,
  type LucideIcon,
} from "lucide-react-native";
import { NOTIFICATION_TYPE } from "../types";

// Not re-exported from utils/index: lucide icons do not load under node tests.
export interface NotificationRowStyle {
  icon: LucideIcon;
  /** The module the notification comes from colors its icon (N1 / N2). */
  accent: ListAccent;
}

const STYLES: Record<string, NotificationRowStyle> = {
  [NOTIFICATION_TYPE.ORDER_CREATED]: { icon: ShoppingBag, accent: "orders" },
  [NOTIFICATION_TYPE.JOIN_REQUEST_CREATED]: { icon: UserPlus, accent: "students" },
  [NOTIFICATION_TYPE.EVENT_RSVP_ATTENDING]: { icon: CalendarCheck, accent: "events" },
  [NOTIFICATION_TYPE.PAYMENT_CREATED]: { icon: CreditCard, accent: "payments" },
  [NOTIFICATION_TYPE.EVENT_ASSIGNED]: { icon: CalendarPlus, accent: "events" },
  [NOTIFICATION_TYPE.JOIN_REQUEST_APPROVED]: { icon: School, accent: "school" },
};

const FALLBACK: NotificationRowStyle = { icon: Bell, accent: "neutral" };

export const notificationRowStyle = (type: string): NotificationRowStyle => STYLES[type] ?? FALLBACK;
