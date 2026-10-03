import { database } from "@/database";
import TrainingInvitee from "@/database/models/TrainingInvitee";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

const invitees = () => database.get<TrainingInvitee>("training_invitees");

export const TrainingInviteeRepository = {
  prepareCreate(trainingId: string, schoolMemberId: string): TrainingInvitee {
    return invitees().prepareCreate((record) => {
      record._raw.id = uuidv4();
      record.trainingId = trainingId;
      record.schoolMemberId = schoolMemberId;
    });
  },

  prepareSoftDelete(invitee: TrainingInvitee): TrainingInvitee {
    return invitee.prepareUpdate((record) => {
      record.deletedAt = new Date();
    });
  },

  async findByTrainingId(trainingId: string): Promise<TrainingInvitee[]> {
    return invitees()
      .query(Q.where("training_id", trainingId), Q.where("deleted_at", null))
      .fetch();
  },

  async findByTrainingIds(trainingIds: string[]): Promise<TrainingInvitee[]> {
    if (trainingIds.length === 0) return [];
    return invitees()
      .query(Q.where("training_id", Q.oneOf(trainingIds)), Q.where("deleted_at", null))
      .fetch();
  },

  observeByTrainingId(trainingId: string) {
    return invitees()
      .query(Q.where("training_id", trainingId), Q.where("deleted_at", null))
      .observe();
  },

  observeByMemberIds(schoolMemberIds: string[]) {
    return invitees()
      .query(
        Q.where("school_member_id", Q.oneOf(schoolMemberIds)),
        Q.where("deleted_at", null),
      )
      .observe();
  },
};
