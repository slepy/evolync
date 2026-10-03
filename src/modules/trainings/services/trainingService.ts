import { sync } from "@/database/sync";
import Training, {
  TRAINING_STATUS,
  TRAINING_VISIBILITY,
  type TrainingStatus,
  type TrainingVisibility,
} from "@/database/models/Training";
import type TrainingSeries from "@/database/models/TrainingSeries";
import type { Model } from "@nozbe/watermelondb";
import { ZodError } from "zod";

import {
  TrainingInviteeRepository,
  TrainingRepository,
  TrainingSeriesRepository,
} from "../repositories";
import type {
  SeriesInput,
  SeriesOccurrence,
  SeriesRule,
  SingleTrainingInput,
  TrainingPatch,
} from "../types/dto";
import { TRAINING_MODE } from "../types/enums";
import {
  addDays,
  dayToTimestamp,
  expandSeriesRules,
  localToday,
  maxSeriesEnd,
  parseJsonArray,
  timestampToDay,
} from "../types/helpers";
import { trainingSchema } from "../validation";

// ============================================================================
// Internals
// ============================================================================

const syncInBackground = (scope: string) => {
  sync().catch((err) => {
    console.error(`[${scope}] Sync failed:`, err);
  });
};

/** Runs the form schema so the service rejects anything the form would. */
const validate = (input: unknown) => {
  try {
    trainingSchema.parse(input);
  } catch (err) {
    if (err instanceof ZodError) throw new Error(err.issues[0].message);
    throw err;
  }
};

const audienceOf = (input: {
  visibility: TrainingVisibility;
  schoolId?: string;
  inviteeIds?: string[];
}) => ({
  visibility: input.visibility,
  schoolId: input.visibility === TRAINING_VISIBILITY.SCHOOL ? input.schoolId : undefined,
  inviteeIds:
    input.visibility === TRAINING_VISIBILITY.WHITELIST
      ? [...new Set(input.inviteeIds ?? [])]
      : [],
});

const cleanLocation = (location?: string) => location?.trim() || undefined;

/** Past trainings are read-only. */
const assertEditable = (training: Training) => {
  if (timestampToDay(training.date) < localToday()) {
    throw new Error("trainingsErrorPastReadOnly");
  }
};

const requireTraining = async (id: string): Promise<Training> => {
  const training = await TrainingRepository.findById(id);
  if (!training) throw new Error("trainingsErrorNotFound");
  return training;
};

/** Prepared rows for one training plus its invitees. */
const prepareTrainingWithInvitees = (
  data: Partial<Training>,
  inviteeIds: string[],
): { training: Training; operations: Model[] } => {
  const training = TrainingRepository.prepareCreate(data);
  const operations: Model[] = [training];
  for (const memberId of inviteeIds) {
    operations.push(TrainingInviteeRepository.prepareCreate(training.id, memberId));
  }
  return { training, operations };
};

interface SeriesValues {
  organizationId: string;
  createdBy: string;
  name: string;
  location?: string;
  visibility: TrainingVisibility;
  schoolId?: string;
  inviteeIds: string[];
}

const prepareOccurrences = (
  values: SeriesValues,
  seriesId: string,
  occurrences: SeriesOccurrence[],
  cancelledDays: Set<string> = new Set(),
) => {
  const trainings: Training[] = [];
  const operations: Model[] = [];
  for (const occurrence of occurrences) {
    const prepared = prepareTrainingWithInvitees(
      {
        organizationId: values.organizationId,
        schoolId: values.schoolId,
        seriesId,
        name: values.name,
        date: new Date(dayToTimestamp(occurrence.day)),
        startTime: occurrence.startTime,
        endTime: occurrence.endTime,
        location: values.location,
        visibility: values.visibility,
        status: cancelledDays.has(occurrence.day)
          ? TRAINING_STATUS.CANCELLED
          : TRAINING_STATUS.ACTIVE,
        createdBy: values.createdBy,
      },
      values.inviteeIds,
    );
    trainings.push(prepared.training);
    operations.push(...prepared.operations);
  }
  return { trainings, operations };
};

const prepareSeries = (
  values: SeriesValues,
  startDate: string,
  endDate: string,
  rules: SeriesRule[],
  previousSeriesId?: string,
) =>
  TrainingSeriesRepository.prepareCreate({
    organizationId: values.organizationId,
    schoolId: values.schoolId,
    name: values.name,
    location: values.location,
    visibility: values.visibility,
    inviteeIds: JSON.stringify(values.inviteeIds),
    startDate: new Date(dayToTimestamp(startDate)),
    endDate: new Date(dayToTimestamp(endDate)),
    rules: JSON.stringify(rules),
    previousSeriesId,
    createdBy: values.createdBy,
  });

/** Soft-deletes trainings and their invitees. */
const prepareDeleteTrainings = async (trainings: Training[]): Promise<Model[]> => {
  const invitees = await TrainingInviteeRepository.findByTrainingIds(trainings.map((t) => t.id));
  return [
    ...trainings.map((t) => TrainingRepository.prepareSoftDelete(t)),
    ...invitees.map((i) => TrainingInviteeRepository.prepareSoftDelete(i)),
  ];
};

/**
 * Ends a series the day before `fromDay`, or removes it when nothing of it
 * remains before that day.
 */
const prepareEndSeriesBefore = (series: TrainingSeries, fromDay: string): Model => {
  const newEnd = addDays(fromDay, -1);
  return newEnd < timestampToDay(series.startDate)
    ? TrainingSeriesRepository.prepareUpdate(series, { deletedAt: new Date() })
    : TrainingSeriesRepository.prepareUpdate(series, {
        endDate: new Date(dayToTimestamp(newEnd)),
      });
};

/** Every series continuing `series`, directly or through other continuations. */
const findDescendants = async (series: TrainingSeries): Promise<TrainingSeries[]> => {
  const found: TrainingSeries[] = [];
  const seen = new Set([series.id]);
  let level = [series];
  while (level.length > 0) {
    const next: TrainingSeries[] = [];
    for (const parent of level) {
      for (const child of await TrainingSeriesRepository.findSuccessors(parent.id)) {
        if (seen.has(child.id)) continue;
        seen.add(child.id);
        next.push(child);
      }
    }
    found.push(...next);
    level = next;
  }
  return found;
};

/** The newest series of a lineage: the latest-ending continuation, if any. */
const findLatestContinuation = async (series: TrainingSeries): Promise<TrainingSeries> => {
  const descendants = await findDescendants(series);
  return descendants.reduce(
    (latest, s) => (s.endDate.getTime() > latest.endDate.getTime() ? s : latest),
    series,
  );
};

/**
 * Ends a series the day before `fromDay` and removes its trainings from that
 * day on, together with every continuation of it (which all lie after the
 * series' own end), so "this and following" reaches them too.
 */
const prepareCutLineageFrom = async (
  series: TrainingSeries,
  fromDay: string,
): Promise<{ operations: Model[]; removed: Training[] }> => {
  const lineage = [series, ...(await findDescendants(series))];
  const removed: Training[] = [];
  for (const s of lineage) {
    removed.push(...(await TrainingRepository.findBySeriesFrom(s.id, dayToTimestamp(fromDay))));
  }
  return {
    operations: [
      ...lineage.map((s) => prepareEndSeriesBefore(s, fromDay)),
      ...(await prepareDeleteTrainings(removed)),
    ],
    removed,
  };
};

// ============================================================================
// Create
// ============================================================================

/** Single mode: N chosen days → N trainings (+ invitees), atomically. */
export const createSingleTrainings = async (
  input: SingleTrainingInput,
): Promise<Training[]> => {
  validate({ ...input, mode: TRAINING_MODE.SINGLE });
  const audience = audienceOf(input);

  const trainings: Training[] = [];
  const operations: Model[] = [];
  for (const day of [...input.dates].sort()) {
    const prepared = prepareTrainingWithInvitees(
      {
        organizationId: input.organizationId,
        schoolId: audience.schoolId,
        name: input.name.trim(),
        date: new Date(dayToTimestamp(day)),
        startTime: input.startTime,
        endTime: input.endTime,
        location: cleanLocation(input.location),
        visibility: audience.visibility,
        status: TRAINING_STATUS.ACTIVE,
        createdBy: input.createdBy,
      },
      audience.inviteeIds,
    );
    trainings.push(prepared.training);
    operations.push(...prepared.operations);
  }

  await TrainingRepository.commit(operations);
  syncInBackground("createSingleTrainings");
  return trainings;
};

/** Recurring mode: the series and all its occurrences, atomically. */
export const createTrainingSeries = async (
  input: SeriesInput,
): Promise<{ series: TrainingSeries; trainings: Training[] }> => {
  validate({ ...input, mode: TRAINING_MODE.RECURRING });
  const occurrences = expandSeriesRules(input.rules, input.startDate, input.endDate);
  if (occurrences.length === 0) throw new Error("trainingsValidationNoOccurrences");

  const values: SeriesValues = {
    ...audienceOf(input),
    organizationId: input.organizationId,
    createdBy: input.createdBy,
    name: input.name.trim(),
    location: cleanLocation(input.location),
  };
  const series = prepareSeries(values, input.startDate, input.endDate, input.rules);
  const { trainings, operations } = prepareOccurrences(values, series.id, occurrences);

  await TrainingRepository.commit([series, ...operations]);
  syncInBackground("createTrainingSeries");
  return { series, trainings };
};

// ============================================================================
// Update
// ============================================================================

/** "This training only": edits one (upcoming) training and its invitees. */
export const updateTraining = async (
  id: string,
  patch: TrainingPatch,
): Promise<Training> => {
  const training = await requireTraining(id);
  assertEditable(training);

  const currentInvitees = await TrainingInviteeRepository.findByTrainingId(id);
  const merged = {
    name: patch.name ?? training.name,
    location: patch.location ?? training.location ?? undefined,
    visibility: patch.visibility ?? training.visibility,
    schoolId: patch.schoolId ?? training.schoolId ?? undefined,
    inviteeIds: patch.inviteeIds ?? currentInvitees.map((i) => i.schoolMemberId),
    dates: [patch.date ?? timestampToDay(training.date)],
    startTime: patch.startTime ?? training.startTime,
    endTime: patch.endTime ?? training.endTime,
  };
  validate({ ...merged, mode: TRAINING_MODE.SINGLE });
  const audience = audienceOf(merged);

  const operations: Model[] = [
    TrainingRepository.prepareUpdate(training, {
      name: merged.name.trim(),
      location: cleanLocation(merged.location),
      visibility: audience.visibility,
      schoolId: audience.schoolId,
      date: new Date(dayToTimestamp(merged.dates[0])),
      startTime: merged.startTime,
      endTime: merged.endTime,
    }),
  ];

  const wanted = new Set(audience.inviteeIds);
  const existing = new Set(currentInvitees.map((i) => i.schoolMemberId));
  for (const invitee of currentInvitees) {
    if (!wanted.has(invitee.schoolMemberId)) {
      operations.push(TrainingInviteeRepository.prepareSoftDelete(invitee));
    }
  }
  for (const memberId of wanted) {
    if (!existing.has(memberId)) {
      operations.push(TrainingInviteeRepository.prepareCreate(id, memberId));
    }
  }

  await TrainingRepository.commit(operations);
  syncInBackground("updateTraining");
  return training;
};

/**
 * "This and following": the original series ends the day before the
 * selected training, its trainings from that day on (continuations included)
 * are replaced by a new series built from `input`, which continues the
 * original one. Days that were cancelled stay cancelled. Earlier trainings
 * are never touched.
 */
export const updateSeriesFrom = async (
  trainingId: string,
  input: SeriesInput,
): Promise<TrainingSeries> => {
  const training = await requireTraining(trainingId);
  assertEditable(training);
  if (!training.seriesId) throw new Error("trainingsErrorNotInSeries");
  const series = await TrainingSeriesRepository.findById(training.seriesId);
  if (!series) throw new Error("trainingsErrorNotFound");

  const fromDay = timestampToDay(training.date);
  if (input.startDate < fromDay) throw new Error("trainingsErrorBeforeSelected");
  validate({ ...input, mode: TRAINING_MODE.RECURRING });
  const occurrences = expandSeriesRules(input.rules, input.startDate, input.endDate);
  if (occurrences.length === 0) throw new Error("trainingsValidationNoOccurrences");

  const cut = await prepareCutLineageFrom(series, fromDay);
  const cancelledDays = new Set(
    cut.removed
      .filter((t) => t.status === TRAINING_STATUS.CANCELLED)
      .map((t) => timestampToDay(t.date)),
  );
  const values: SeriesValues = {
    ...audienceOf(input),
    organizationId: series.organizationId,
    createdBy: input.createdBy,
    name: input.name.trim(),
    location: cleanLocation(input.location),
  };
  const next = prepareSeries(values, input.startDate, input.endDate, input.rules, series.id);
  const created = prepareOccurrences(values, next.id, occurrences, cancelledDays);

  await TrainingRepository.commit([...cut.operations, next, ...created.operations]);
  syncInBackground("updateSeriesFrom");
  return next;
};

/** Last day ("YYYY-MM-DD") of a series' lineage — where Extend continues from. */
export const getExtendableSeriesEnd = async (seriesId: string): Promise<string> => {
  const series = await TrainingSeriesRepository.findById(seriesId);
  if (!series) throw new Error("trainingsErrorNotFound");
  return timestampToDay((await findLatestContinuation(series)).endDate);
};

/**
 * Adds occurrences after a series' current end. The newest series of the
 * lineage is the one extended, so an older part of an edited series never
 * regenerates days its continuation already covers. Within that series'
 * 6-month window the series itself is extended; beyond it a continuation
 * series with the same rules and audience is started, so every series stays
 * ≤ 6 months.
 */
export const extendSeries = async (
  seriesId: string,
  newEndDate: string,
): Promise<Training[]> => {
  const selected = await TrainingSeriesRepository.findById(seriesId);
  if (!selected) throw new Error("trainingsErrorNotFound");
  const series = await findLatestContinuation(selected);

  const currentEnd = timestampToDay(series.endDate);
  const today = localToday();
  const from = addDays(currentEnd, 1) > today ? addDays(currentEnd, 1) : today;
  if (newEndDate <= currentEnd || newEndDate < from) {
    throw new Error("trainingsValidationExtendAfterEnd");
  }
  if (newEndDate > maxSeriesEnd(from)) throw new Error("trainingsValidationSeriesTooLong");

  const rules = parseJsonArray<SeriesRule>(series.rules);
  const occurrences = expandSeriesRules(rules, from, newEndDate);
  if (occurrences.length === 0) throw new Error("trainingsValidationNoOccurrences");

  const values: SeriesValues = {
    organizationId: series.organizationId,
    createdBy: series.createdBy,
    name: series.name,
    location: series.location,
    visibility: series.visibility,
    schoolId: series.schoolId,
    inviteeIds: parseJsonArray(series.inviteeIds),
  };

  const withinWindow = newEndDate <= maxSeriesEnd(timestampToDay(series.startDate));
  const target = withinWindow
    ? TrainingSeriesRepository.prepareUpdate(series, {
        endDate: new Date(dayToTimestamp(newEndDate)),
      })
    : prepareSeries(values, from, newEndDate, rules, series.id);
  const created = prepareOccurrences(values, target.id, occurrences);

  await TrainingRepository.commit([target, ...created.operations]);
  syncInBackground("extendSeries");
  return created.trainings;
};

/** Cancel / restore one upcoming training. */
export const setTrainingStatus = async (
  id: string,
  status: TrainingStatus,
): Promise<Training> => {
  const training = await requireTraining(id);
  assertEditable(training);
  await TrainingRepository.commit([TrainingRepository.prepareUpdate(training, { status })]);
  syncInBackground("setTrainingStatus");
  return training;
};

// ============================================================================
// Delete
// ============================================================================

/** Soft-deletes one upcoming training and its invitees. */
export const deleteTraining = async (id: string): Promise<void> => {
  const training = await requireTraining(id);
  assertEditable(training);
  await TrainingRepository.commit(await prepareDeleteTrainings([training]));
  syncInBackground("deleteTraining");
};

/**
 * Soft-deletes a series' trainings from the selected one on, continuations
 * included; earlier ones stay.
 */
export const deleteSeriesFrom = async (trainingId: string): Promise<void> => {
  const training = await requireTraining(trainingId);
  assertEditable(training);
  if (!training.seriesId) throw new Error("trainingsErrorNotInSeries");
  const series = await TrainingSeriesRepository.findById(training.seriesId);
  if (!series) throw new Error("trainingsErrorNotFound");

  const cut = await prepareCutLineageFrom(series, timestampToDay(training.date));
  await TrainingRepository.commit(cut.operations);
  syncInBackground("deleteSeriesFrom");
};
