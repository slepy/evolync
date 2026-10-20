import type { ContextKey } from "@/core/theme/tokens";

export interface ContextOption {
  id: string;
  /** Context the option opens: organization (Manage) or student (Train as student). */
  context: ContextKey;
  title: string;
  /** "Organization · 3 schools", "Student · Poznań"… */
  subtitle?: string;
}
