import type { ContextKey } from "@/core/theme/tokens";
import { NextUpCard } from "./NextUpCard";
import { addDays, dayToTimestamp, localToday, type NextUpItem } from "./pickNextUp";
import { useNextUp, type NextUpScope, type NextUpSource } from "./useNextUp";

export interface NextUpProps {
  scope: NextUpScope | undefined;
  /** Defaults to the scope: organization → amber, school → red, student → blue. */
  context?: ContextKey;
  /** What to look for; e.g. ["trainings"] on the school dashboard. Default: both. */
  show?: NextUpSource[];
  onCalendarPress?: () => void;
  onItemPress?: (item: NextUpItem) => void;
}

const CONTEXT_BY_SCOPE: Record<NextUpScope["kind"], ContextKey> = {
  organization: "organization",
  school: "school",
  student: "student",
};

/** "Today", "Tomorrow", or e.g. "Sat, 10 Oct" in the app language. */
export function formatNextUpDay(day: string, today: string = localToday()): string {
  if (day === today) return t("nextUpToday");
  if (day === addDays(today, 1)) return t("nextUpTomorrow");
  return new Date(dayToTimestamp(day)).toLocaleDateString(t("locale") === "pl" ? "pl-PL" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Header box that loads itself: the nearest day with an event and/or
 * training in the scope (from the local events / trainings tables), and every
 * item on that day (board 1C, "next up").
 */
export function NextUp({ scope, context, show, onCalendarPress, onItemPress }: NextUpProps) {
  const { nextUp, isLoading } = useNextUp(scope, show);

  return (
    <NextUpCard
      context={context ?? (scope ? CONTEXT_BY_SCOPE[scope.kind] : "organization")}
      eyebrow={t("nextUpEyebrow")}
      title={nextUp ? formatNextUpDay(nextUp.day) : t("nextUpToday")}
      items={nextUp?.items}
      emptyText={t("nextUpNothingPlanned")}
      isLoading={isLoading}
      onCalendarPress={onCalendarPress}
      onItemPress={onItemPress}
    />
  );
}
