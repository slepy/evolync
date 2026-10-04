import type { ContextKey } from "@/core/theme/tokens";
import { HeroCard } from "./HeroCard";
import { addDays, dayToTimestamp, localToday, type NextUpItem } from "./nextUp";
import { useNextUp, type NextUpScope, type NextUpSource } from "./useNextUp";

export interface NextUpHeroProps {
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
  if (day === today) return t("heroToday");
  if (day === addDays(today, 1)) return t("heroTomorrow");
  return new Date(dayToTimestamp(day)).toLocaleDateString(t("locale") === "pl" ? "pl-PL" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Hero header that loads itself: the nearest day with an event and/or
 * training in the scope (from the local events / trainings tables), and every
 * item on that day (board 1C, "next up").
 */
export function NextUpHero({ scope, context, show, onCalendarPress, onItemPress }: NextUpHeroProps) {
  const { nextUp, isLoading } = useNextUp(scope, show);

  return (
    <HeroCard
      context={context ?? (scope ? CONTEXT_BY_SCOPE[scope.kind] : "organization")}
      eyebrow={t("heroNextUp")}
      title={nextUp ? formatNextUpDay(nextUp.day) : t("heroToday")}
      items={nextUp?.items}
      emptyText={t("heroNothingPlanned")}
      isLoading={isLoading}
      onCalendarPress={onCalendarPress}
      onItemPress={onItemPress}
    />
  );
}
