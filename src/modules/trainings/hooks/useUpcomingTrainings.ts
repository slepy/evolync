import type Training from "@/database/models/Training";
import { SchoolRepository } from "@/modules/school/repositories";
import { switchMap } from "rxjs/operators";
import { TrainingRepository } from "../repositories";
import { dayToTimestamp, localToday } from "../types/helpers";
import { useObservableValue } from "./useObservableList";

const EMPTY: Training[] = [];

/** All upcoming trainings (from today, incl. cancelled) in the organization. */
export const useUpcomingTrainings = (organizationId: string | undefined) => {
  const { value, isLoading, error } = useObservableValue(
    () =>
      organizationId
        ? TrainingRepository.observeUpcomingByOrganization(
            organizationId,
            dayToTimestamp(localToday()),
          )
        : null,
    EMPTY,
    [organizationId],
    "useUpcomingTrainings",
  );
  return { trainings: value, isLoading, error };
};

/** Upcoming trainings that concern a school's students. */
export const useSchoolUpcomingTrainings = (schoolId: string | undefined) => {
  const { value, isLoading, error } = useObservableValue(
    () =>
      schoolId
        ? SchoolRepository.observeById(schoolId).pipe(
            switchMap((school) =>
              TrainingRepository.observeUpcomingForSchool(
                schoolId,
                school.organizationId,
                dayToTimestamp(localToday()),
              ),
            ),
          )
        : null,
    EMPTY,
    [schoolId],
    "useSchoolUpcomingTrainings",
  );
  return { trainings: value, isLoading, error };
};
