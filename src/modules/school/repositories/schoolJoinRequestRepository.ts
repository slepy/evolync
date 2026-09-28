import { database } from "@/database";
import SchoolJoinRequest, {
  JoinRequestStatus,
} from "@/database/models/SchoolJoinRequest";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const SchoolJoinRequestRepository = {
  async create(data: {
    schoolId: string;
    userId: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    phoneNumber?: string;
  }): Promise<SchoolJoinRequest> {
    const collection = database.get<SchoolJoinRequest>("school_join_requests");
    return await database.write(async () => {
      return await collection.create((record) => {
        const now = Date.now();
        record._raw.id = uuidv4();
        record.schoolId = data.schoolId;
        record.userId = data.userId;
        record.displayName = data.displayName;
        record.email = data.email;
        record.status = JoinRequestStatus.PENDING;
        if (data.avatarUrl !== undefined) record.avatarUrl = data.avatarUrl;
        if (data.phoneNumber !== undefined) record.phoneNumber = data.phoneNumber;
        (record._raw as any).created_at = now;
        (record._raw as any).updated_at = now;
      });
    });
  },

  async findByUserIdAndSchoolId(
    userId: string,
    schoolId: string,
  ): Promise<SchoolJoinRequest | null> {
    const collection = database.get<SchoolJoinRequest>("school_join_requests");
    const results = await collection
      .query(
        Q.where("user_id", userId),
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
      )
      .fetch();
    return results[0] ?? null;
  },

  async markRejected(id: string): Promise<void> {
    const collection = database.get<SchoolJoinRequest>("school_join_requests");
    const record = await collection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.status = JoinRequestStatus.REJECTED;
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<SchoolJoinRequest>("school_join_requests");
    const record = await collection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  /** Pending-only — rejected requests are no longer actionable by the instructor. */
  observeBySchoolId(schoolId: string) {
    const collection = database.get<SchoolJoinRequest>("school_join_requests");
    return collection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.where("status", Q.notEq(JoinRequestStatus.REJECTED)),
      )
      .observe();
  },

  /** All statuses — the student's own dashboard shows both pending and rejected. */
  observeByUserId(userId: string) {
    const collection = database.get<SchoolJoinRequest>("school_join_requests");
    return collection
      .query(Q.where("user_id", userId), Q.where("deleted_at", null))
      .observe();
  },

  observeCountBySchoolId(schoolId: string) {
    const collection = database.get<SchoolJoinRequest>("school_join_requests");
    return collection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.where("status", Q.notEq(JoinRequestStatus.REJECTED)),
      )
      .observeCount();
  },
};
