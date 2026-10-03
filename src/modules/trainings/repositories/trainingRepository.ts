import { database } from "@/database";
import SchoolMember from "@/database/models/SchoolMember";
import Training, { TRAINING_VISIBILITY } from "@/database/models/Training";
import TrainingInvitee from "@/database/models/TrainingInvitee";
import { Q, type Model } from "@nozbe/watermelondb";
import { switchMap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

/** Columns whose edits must re-render lists (not only add/remove). */
const LIST_COLUMNS = [
  "name",
  "date",
  "start_time",
  "end_time",
  "location",
  "status",
  "visibility",
  "school_id",
  "series_id",
];

const trainings = () => database.get<Training>("trainings");

const upcomingClauses = (fromTimestamp: number) => [
  Q.where("deleted_at", null),
  Q.where("date", Q.gte(fromTimestamp)),
  Q.sortBy("date", Q.asc),
  Q.sortBy("start_time", Q.asc),
];

export const TrainingRepository = {
  prepareCreate(data: Partial<Training>): Training {
    return trainings().prepareCreate((record) => {
      record._raw.id = uuidv4();
      Object.assign(record, data);
    });
  },

  prepareUpdate(training: Training, data: Partial<Training>): Training {
    return training.prepareUpdate((record) => {
      Object.assign(record, data);
    });
  },

  prepareSoftDelete(training: Training): Training {
    return training.prepareUpdate((record) => {
      record.deletedAt = new Date();
    });
  },

  /** Commits prepared operations (any trainings table) atomically. */
  async commit(operations: Model[]): Promise<void> {
    if (operations.length === 0) return;
    await database.write(async () => {
      await database.batch(operations);
    });
  },

  async findById(id: string): Promise<Training | null> {
    try {
      const training = await trainings().find(id);
      return training.deletedAt ? null : training;
    } catch {
      return null;
    }
  },

  /** Live occurrences of a series dated on/after `fromTimestamp`. */
  async findBySeriesFrom(seriesId: string, fromTimestamp: number): Promise<Training[]> {
    return trainings()
      .query(
        Q.where("series_id", seriesId),
        Q.where("deleted_at", null),
        Q.where("date", Q.gte(fromTimestamp)),
        Q.sortBy("date", Q.asc),
      )
      .fetch();
  },

  async findBySeriesId(seriesId: string): Promise<Training[]> {
    return trainings()
      .query(Q.where("series_id", seriesId), Q.where("deleted_at", null), Q.sortBy("date", Q.asc))
      .fetch();
  },

  observeById(id: string) {
    return trainings().findAndObserve(id);
  },

  /** All upcoming trainings in the organization (incl. cancelled). */
  observeUpcomingByOrganization(organizationId: string, fromTimestamp: number) {
    return trainings()
      .query(Q.where("organization_id", organizationId), ...upcomingClauses(fromTimestamp))
      .observeWithColumns(LIST_COLUMNS);
  },

  /**
   * Upcoming trainings that concern a school's students: its own
   * school-visibility trainings, organization trainings, and whitelist
   * trainings with at least one invitee who is a member of the school.
   */
  observeUpcomingForSchool(schoolId: string, organizationId: string, fromTimestamp: number) {
    return database
      .get<SchoolMember>("school_members")
      .query(Q.where("school_id", schoolId), Q.where("deleted_at", null))
      .observe()
      .pipe(
        switchMap((members) =>
          database
            .get<TrainingInvitee>("training_invitees")
            .query(
              Q.where("school_member_id", Q.oneOf(members.map((m) => m.id))),
              Q.where("deleted_at", null),
            )
            .observe(),
        ),
        switchMap((invitees) =>
          trainings()
            .query(
              Q.where("organization_id", organizationId),
              Q.or(
                Q.where("visibility", TRAINING_VISIBILITY.ORGANIZATION),
                Q.and(
                  Q.where("visibility", TRAINING_VISIBILITY.SCHOOL),
                  Q.where("school_id", schoolId),
                ),
                Q.and(
                  Q.where("visibility", TRAINING_VISIBILITY.WHITELIST),
                  Q.where("id", Q.oneOf([...new Set(invitees.map((i) => i.trainingId))])),
                ),
              ),
              ...upcomingClauses(fromTimestamp),
            )
            .observeWithColumns(LIST_COLUMNS),
        ),
      );
  },
};
