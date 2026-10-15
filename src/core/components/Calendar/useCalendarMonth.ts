import { EventRepository, EventTypeRepository } from "@/modules/events/repositories";
import { SchoolRepository } from "@/modules/school/repositories";
import { TrainingRepository, TrainingSeriesRepository } from "@/modules/trainings/repositories";
import { useEffect, useState } from "react";
import { combineLatest, of, type Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import type { NextUpScope, NextUpSource } from "../NextUp/useNextUp";
import {
  monthRange,
  seriesFrequencyLabel,
  type CalendarEventSource,
  type CalendarTrainingSource,
  type SeriesFrequencyLabel,
} from "./calendarMonth";

/** Whose events and trainings the calendar shows (same scopes as the hero). */
export type CalendarScope = NextUpScope;
export type CalendarSource = NextUpSource;

export interface CalendarMonthData {
  events: CalendarEventSource[];
  trainings: CalendarTrainingSource[];
  /** Series id → frequency, for the recurring badge. */
  seriesFrequency: Map<string, SeriesFrequencyLabel>;
  /** School id → name, for the training meta line. */
  schoolNames: Map<string, string>;
  /** Event type id → name, for the event meta line. */
  typeNames: Map<string, string>;
}

const EMPTY: CalendarMonthData = {
  events: [],
  trainings: [],
  seriesFrequency: new Map(),
  schoolNames: new Map(),
  typeNames: new Map(),
};

const NONE = of([] as never[]);

function observeMonth(
  scope: CalendarScope,
  show: CalendarSource[],
  from: number,
  to: number,
): Observable<CalendarMonthData> {
  const wantEvents = show.includes("events");
  const wantTrainings = show.includes("trainings");

  const sources: Observable<[CalendarEventSource[], CalendarTrainingSource[], { id: string; name: string }[]]> =
    scope.kind === "organization"
      ? combineLatest([
          wantEvents ? EventRepository.observeInRangeByOrganization(scope.organizationId, from, to) : NONE,
          wantTrainings ? TrainingRepository.observeInRangeByOrganization(scope.organizationId, from, to) : NONE,
          SchoolRepository.observeByOrganizationId(scope.organizationId),
        ])
      : SchoolRepository.observeById(scope.schoolId).pipe(
          switchMap((school) =>
            combineLatest([
              wantEvents && scope.kind === "student"
                ? EventRepository.observeInRangeForMember(scope.memberId, from, to)
                : NONE,
              wantTrainings
                ? TrainingRepository.observeInRangeForSchool(scope.schoolId, school.organizationId, from, to)
                : NONE,
              of([school]),
            ]),
          ),
        );

  return sources.pipe(
    switchMap(([events, trainings, schools]) => {
      const seriesIds = [...new Set(trainings.map((t) => t.seriesId).filter((id): id is string => !!id))];
      const series = seriesIds.length > 0 ? TrainingSeriesRepository.observeByIds(seriesIds) : NONE;
      const typeIds = [...new Set(events.map((e) => e.typeId).filter((id): id is string => !!id))];
      const types = typeIds.length > 0 ? EventTypeRepository.observeByIds(typeIds) : NONE;
      return combineLatest([series, types]).pipe(
        map(([seriesRows, typeRows]) => ({
          events,
          trainings,
          seriesFrequency: new Map(seriesRows.map((row) => [row.id, seriesFrequencyLabel(row.rules)])),
          schoolNames: new Map(schools.map((school) => [school.id, school.name])),
          typeNames: new Map(typeRows.map((row) => [row.id, row.name])),
        })),
      );
    }),
  );
}

const scopeKey = (scope: CalendarScope | undefined) =>
  !scope
    ? ""
    : scope.kind === "organization"
      ? `o:${scope.organizationId}`
      : scope.kind === "school"
        ? `s:${scope.schoolId}`
        : `m:${scope.memberId}:${scope.schoolId}`;

/**
 * Reactive events and trainings of one month in the scope, read from the
 * local database through the module repositories. The school scope never
 * loads events (a school calendar is trainings only). `month` is 0-based.
 */
export function useCalendarMonth(
  scope: CalendarScope | undefined,
  year: number,
  month: number,
  show: CalendarSource[] = ["events", "trainings"],
) {
  const [data, setData] = useState<CalendarMonthData>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const key = scopeKey(scope);
  const showKey = show.join(",");

  useEffect(() => {
    if (!scope) {
      setData(EMPTY);
      setIsLoading(false);
      return;
    }
    const { from, to } = monthRange(year, month);
    setIsLoading(true);
    const subscription = observeMonth(scope, show, from, to).subscribe({
      next: (value) => {
        setData(value);
        setIsLoading(false);
      },
      error: (error: Error) => {
        console.error("[useCalendarMonth] Observer error:", error);
        setData(EMPTY);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
    // scope / show are compared by value through their keys
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, showKey, year, month]);

  return { ...data, isLoading };
}
