import type { ContextKey } from "@/core/theme/tokens";
import { LayoutGrid, List } from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import { localToday } from "../NextUp/pickNextUp";
import { SubScreenPage } from "../SubScreen/SubScreenPage";
import { ViewSwitch } from "../ViewSwitch/ViewSwitch";
import { CalendarAddSheet } from "./CalendarAddSheet";
import { formatDayTitle, formatMonth, formatShortDay, weekdayLabels } from "./calendarFormat";
import {
  buildMonthCells,
  defaultSelectedDay,
  eventRowMeta,
  itemsForDay,
  monthDays,
  shiftMonth,
  type CalendarFilter,
  type CalendarItem,
} from "./calendarMonth";
import { CalendarView } from "./CalendarView";
import type { CalendarRow } from "./types";
import {
  useCalendarMonth,
  type CalendarMonthData,
  type CalendarScope,
  type CalendarSource,
} from "./useCalendarMonth";

export interface CalendarProps {
  scope: CalendarScope | undefined;
  /** Defaults to the scope: organization → amber, school → red, student → blue. */
  context?: ContextKey;
  /** What the calendar shows; the school calendar passes ["trainings"]. Default: both. */
  show?: CalendarSource[];
  /** What "Add new" offers (one kind opens it directly, two open the 6B sheet). Empty: read-only. */
  canAdd?: CalendarSource[];
  /** `day` is the selected "YYYY-MM-DD", filled in as the start date. */
  onAdd?: (kind: CalendarSource, day: string) => void;
  /** Without it the rows are not tappable. */
  onItemPress?: (item: CalendarItem) => void;
  /** Rows of this kind are tappable (default: both when `onItemPress` is set). */
  pressable?: CalendarSource[];
  /**
   * Alternative List view behind a Month / List switch (organization calendar).
   * Rendered with the month shown in Month view as its default range; without
   * it there is no switch.
   */
  listView?: (range: { from: string; to: string }) => ReactNode;
}

const CONTEXT_BY_SCOPE: Record<CalendarScope["kind"], ContextKey> = {
  organization: "organization",
  school: "school",
  student: "student",
};

const kindSource = (kind: CalendarItem["kind"]): CalendarSource => (kind === "event" ? "events" : "trainings");

/** Row meta, badge and tap target of one calendar item. */
function toRow(
  item: CalendarItem,
  data: CalendarMonthData,
  locale: string,
  onPress?: () => void,
): CalendarRow {
  const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" · ");

  if (item.kind === "event") {
    const multi = item.dayCount > 1;
    return {
      key: `event-${item.id}`,
      kind: "event",
      title: item.title,
      meta: eventRowMeta({
        dateRange: multi
          ? `${formatShortDay(item.startDay, locale)} – ${formatShortDay(item.endDay, locale)}`
          : undefined,
        typeName: item.typeId ? data.typeNames.get(item.typeId) : undefined,
        place: item.place,
        fallback: t("calendarKindEvent"),
      }),
      badge: item.cancelled
        ? { label: t("statusCancelled"), accent: "danger" }
        : multi
          ? { label: t("calendarEventDay", { index: item.dayIndex, count: item.dayCount }), accent: "events" }
          : undefined,
      cancelled: item.cancelled,
      onPress,
    };
  }

  const frequency = item.seriesId ? data.seriesFrequency.get(item.seriesId) : undefined;
  const frequencyLabel =
    frequency === "weekly"
      ? t("trainingsWeekly")
      : frequency === "monthly"
        ? t("trainingsMonthly")
        : t("trainingsModeRecurring");
  return {
    key: `training-${item.id}`,
    kind: "training",
    title: item.title,
    meta: join(
      `${item.startTime}–${item.endTime}`,
      (item.schoolId && data.schoolNames.get(item.schoolId)) || item.location,
    ),
    badge: item.cancelled
      ? { label: t("statusCancelled"), accent: "danger" }
      : item.seriesId
        ? { label: `↻ ${frequencyLabel}`, accent: "trainings" }
        : undefined,
    cancelled: item.cancelled,
    onPress,
  };
}

/**
 * Calendar screen (boards 6 / 6A / 6B), opened from a dashboard hero: events
 * and trainings of the scope in one month grid, the selected day's items,
 * and Add new for the kinds the context may create. Loads its own data from
 * the local database.
 */
export function Calendar({
  scope,
  context,
  show = ["events", "trainings"],
  canAdd = [],
  onAdd,
  onItemPress,
  pressable = ["events", "trainings"],
  listView,
}: CalendarProps) {
  const today = localToday();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)) - 1);
  const [selected, setSelected] = useState(today);
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [view, setView] = useState<"month" | "list">("month");

  const data = useCalendarMonth(scope, year, month, show);
  const locale = t("locale");
  const ctx = context ?? (scope ? CONTEXT_BY_SCOPE[scope.kind] : "organization");
  const bothKinds = show.includes("events") && show.includes("trainings");
  const activeFilter: CalendarFilter = bothKinds ? filter : "all";

  const cells = useMemo(
    () => buildMonthCells(year, month, data.events, data.trainings, activeFilter, today, selected),
    [year, month, data.events, data.trainings, activeFilter, today, selected],
  );

  const rows = useMemo(
    () =>
      itemsForDay(selected, data.events, data.trainings, activeFilter).map((item) =>
        toRow(
          item,
          data,
          locale,
          onItemPress && pressable.includes(kindSource(item.kind)) ? () => onItemPress(item) : undefined,
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, data, activeFilter, locale, onItemPress, pressable.join(",")],
  );

  const goToMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    setSelected(defaultSelectedDay(next.year, next.month, today));
  };

  const addable = onAdd ? canAdd.filter((kind) => show.includes(kind)) : [];
  const handleAdd =
    addable.length === 0
      ? undefined
      : addable.length === 1
        ? () => onAdd?.(addable[0], selected)
        : () => setSheetOpen(true);

  const schoolName = scope && scope.kind !== "organization" ? data.schoolNames.get(scope.schoolId) : undefined;
  const subtitle =
    scope?.kind === "organization"
      ? t("calendarScopeAllSchools")
      : schoolName
        ? t(bothKinds ? "calendarScopeSchool" : "calendarScopeSchoolTrainings", { school: schoolName })
        : undefined;

  const selectedTitle = formatDayTitle(selected, locale);

  return (
    <SubScreenPage title={t("calendarTitle")} subtitle={subtitle} context={ctx}>
      {listView ? (
        <ViewSwitch
          accent="events"
          aria-label={t("calendarTitle")}
          first={{ icon: LayoutGrid, label: t("calendarViewMonth"), onPress: () => setView("month") }}
          second={{ icon: List, label: t("calendarViewList"), onPress: () => setView("list") }}
          active={view === "month" ? "first" : "second"}
        />
      ) : null}
      {listView && view === "list" ? (
        listView(monthDays(year, month))
      ) : (
        <CalendarView
          context={ctx}
          filter={bothKinds ? filter : undefined}
          onFilterChange={bothKinds ? setFilter : undefined}
          monthLabel={formatMonth(year, month, locale)}
          weekdayLabels={weekdayLabels(locale)}
          onPrevMonth={() => goToMonth(-1)}
          onNextMonth={() => goToMonth(1)}
          cells={cells}
          onSelectDay={setSelected}
          dayLabel={(cell) => t("calendarDayItems", { count: cell.count, day: formatDayTitle(cell.day, locale) })}
          selectedTitle={selectedTitle}
          selectedSubtitle={rows.length === 0 ? t("calendarNothingPlanned") : t("calendarItemsCount", { count: rows.length })}
          rows={rows}
          emptyText={t("calendarEmptyDay")}
          onAdd={handleAdd}
          isLoading={data.isLoading}
        />
      )}
      {addable.length > 1 ? (
        <CalendarAddSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          dayLabel={selectedTitle}
          onPick={(kind) => {
            setSheetOpen(false);
            onAdd?.(kind, selected);
          }}
        />
      ) : null}
    </SubScreenPage>
  );
}
