import { withAlpha } from "@/core/components/List/accent";
import { neutral, success, warning } from "@/core/theme/tokens";

/** Colors of the status pill of a student (16A row, 16E profile) by `studentStatusPill` tone. */
export const STUDENT_PILL_COLOR = {
  active: { tint: success.text, fill: success.fill },
  neutral: { tint: neutral.tint, fill: neutral.tintFill },
  warning: { tint: warning.text, fill: warning.fill },
  muted: { tint: neutral.placeholder, fill: withAlpha(neutral.tint, 0.1) },
} as const;
