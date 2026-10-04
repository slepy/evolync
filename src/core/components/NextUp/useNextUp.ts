import { EventRepository } from "@/modules/events/repositories";
import { SchoolRepository } from "@/modules/school/repositories";
import { TrainingRepository } from "@/modules/trainings/repositories";
import { useEffect, useState } from "react";
import { combineLatest, of, type Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  dayToTimestamp,
  localToday,
  pickNextUp,
  type NextUpDay,
  type NextUpEventSource,
  type NextUpTrainingSource,
} from "./pickNextUp";

/** Whose events and trainings the header shows. */
export type NextUpScope =
  | { kind: "organization"; organizationId: string }
  | { kind: "school"; schoolId: string }
  /** A student: their events (as participant) and their school's trainings. */
  | { kind: "student"; memberId: string; schoolId: string };

export type NextUpSource = "events" | "trainings";

const NONE = of([] as never[]);

function observeSources(
  scope: NextUpScope,
  show: NextUpSource[],
  fromTimestamp: number,
): Observable<[NextUpEventSource[], NextUpTrainingSource[]]> {
  const wantEvents = show.includes("events");
  const wantTrainings = show.includes("trainings");

  if (scope.kind === "organization") {
    return combineLatest([
      wantEvents
        ? EventRepository.observeActiveFromByOrganization(scope.organizationId, fromTimestamp)
        : NONE,
      wantTrainings
        ? TrainingRepository.observeUpcomingByOrganization(scope.organizationId, fromTimestamp)
        : NONE,
    ]);
  }

  return SchoolRepository.observeById(scope.schoolId).pipe(
    switchMap((school) =>
      combineLatest([
        !wantEvents
          ? NONE
          : scope.kind === "school"
            ? EventRepository.observeActiveFromForSchool(scope.schoolId, school.organizationId, fromTimestamp)
            : EventRepository.observeActiveFromForMember(scope.memberId, fromTimestamp),
        wantTrainings
          ? TrainingRepository.observeUpcomingForSchool(scope.schoolId, school.organizationId, fromTimestamp)
          : NONE,
      ]),
    ),
  );
}

const scopeKey = (scope: NextUpScope | undefined) =>
  !scope
    ? ""
    : scope.kind === "organization"
      ? `o:${scope.organizationId}`
      : scope.kind === "school"
        ? `s:${scope.schoolId}`
        : `m:${scope.memberId}:${scope.schoolId}`;

/**
 * Reactive "next up" for the header box: the nearest day with an active
 * event or training in the scope, and every item on that day. Reads the
 * local database (events, trainings tables) through the module repositories.
 */
export function useNextUp(
  scope: NextUpScope | undefined,
  show: NextUpSource[] = ["events", "trainings"],
) {
  const [nextUp, setNextUp] = useState<NextUpDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const key = scopeKey(scope);
  const showKey = show.join(",");

  useEffect(() => {
    if (!scope) {
      setNextUp(null);
      setIsLoading(false);
      return;
    }
    const today = localToday();
    setIsLoading(true);
    const subscription = observeSources(scope, show, dayToTimestamp(today))
      .pipe(map(([events, trainings]) => pickNextUp(events, trainings, today)))
      .subscribe({
        next: (value) => {
          setNextUp(value);
          setIsLoading(false);
        },
        error: (error: Error) => {
          console.error("[useNextUp] Observer error:", error);
          setNextUp(null);
          setIsLoading(false);
        },
      });
    return () => subscription.unsubscribe();
    // scope / show are compared by value through their keys
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, showKey]);

  return { nextUp, isLoading };
}
