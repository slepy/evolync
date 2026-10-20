import type { ContextKey, PageContext } from "@/core/theme/tokens";
import { Building2, School, UserRound, type LucideIcon } from "lucide-react-native";

export type SwitcherContext = PageContext;

/** Organization = building, School (instructor) = school, Student = person (3 / 4 / 5). */
export const CONTEXT_ICONS: Record<SwitcherContext, LucideIcon> = {
  organization: Building2,
  school: School,
  student: UserRound,
  neutral: UserRound,
};

export const KICKER_KEYS: Record<ContextKey, string> = {
  organization: "organization",
  school: "contextSchool",
  student: "student",
};
