import type Training from "@/database/models/Training";
import type TrainingInvitee from "@/database/models/TrainingInvitee";
import type TrainingSeries from "@/database/models/TrainingSeries";
import { of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import {
  TrainingInviteeRepository,
  TrainingRepository,
  TrainingSeriesRepository,
} from "../repositories";
import { useObservableValue } from "./useObservableList";

interface TrainingWithSeries {
  training: Training | null;
  series: TrainingSeries | null;
}

const NONE: TrainingWithSeries = { training: null, series: null };
const NO_INVITEES: TrainingInvitee[] = [];

/** One training (null when missing or deleted) and its series, if any. */
export const useTraining = (trainingId: string | undefined) => {
  const { value, isLoading, error } = useObservableValue<TrainingWithSeries>(
    () =>
      trainingId
        ? TrainingRepository.observeById(trainingId).pipe(
            switchMap((training) => {
              if (training.deletedAt) return of(NONE);
              if (!training.seriesId) return of({ training, series: null });
              return TrainingSeriesRepository.observeById(training.seriesId).pipe(
                map((series) => ({ training, series: series.deletedAt ? null : series })),
                catchError(() => of({ training, series: null })),
              );
            }),
            catchError(() => of(NONE)),
          )
        : null,
    NONE,
    [trainingId],
    "useTraining",
  );
  return { ...value, isLoading, error };
};

/** Live invitees of a training. */
export const useTrainingInvitees = (trainingId: string | undefined) => {
  const { value, isLoading, error } = useObservableValue(
    () => (trainingId ? TrainingInviteeRepository.observeByTrainingId(trainingId) : null),
    NO_INVITEES,
    [trainingId],
    "useTrainingInvitees",
  );
  return { invitees: value, isLoading, error };
};
