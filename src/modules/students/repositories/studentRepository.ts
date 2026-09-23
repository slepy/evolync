import { database } from "@/database";
import SchoolMember from "@/database/models/SchoolMember";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";
import { MemberStatus } from "../types";

export const StudentRepository = {
  async create(data: Partial<SchoolMember>): Promise<SchoolMember> {
    const membersCollection = database.get<SchoolMember>("school_members");
    const result = await database.write(async () => {
      return await membersCollection.create((record) => {
        const now = Date.now();

        // Set ID
        record._raw.id = data.id || uuidv4();

        // Set regular fields (type-safe)
        if (data.schoolId) record.schoolId = data.schoolId;
        if (data.userId !== undefined) record.userId = data.userId;
        if (data.roleId !== undefined) record.roleId = data.roleId;
        if (data.displayName !== undefined)
          record.displayName = data.displayName;
        if (data.email !== undefined) record.email = data.email;
        if (data.avatarUrl !== undefined) record.avatarUrl = data.avatarUrl;
        if (data.phoneNumber !== undefined)
          record.phoneNumber = data.phoneNumber;
        if (data.status) record.status = data.status;
        if (data.currentRankId !== undefined)
          record.currentRankId = data.currentRankId;

        // Initialize required date fields (cast to any to bypass readonly restriction)
        (record._raw as any).joined_at = now;
        (record._raw as any).created_at = now;
        (record._raw as any).updated_at = now;
      });
    });

    return result;
  },

  async findById(id: string): Promise<SchoolMember | null> {
    const membersCollection = database.get<SchoolMember>("school_members");
    try {
      const member = await membersCollection.find(id);
      if (member.deletedAt) {
        return null;
      }
      return member;
    } catch {
      return null;
    }
  },

  async findBySchoolId(schoolId: string): Promise<SchoolMember[]> {
    const membersCollection = database.get<SchoolMember>("school_members");
    return await membersCollection
      .query(Q.where("school_id", schoolId), Q.where("deleted_at", null))
      .fetch();
  },

  async findByEmailAndSchoolId(
    email: string,
    schoolId: string,
  ): Promise<SchoolMember | null> {
    const membersCollection = database.get<SchoolMember>("school_members");
    const members = await membersCollection
      .query(
        Q.where("email", email),
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
      )
      .fetch();

    if (members.length === 0) {
      return null;
    }

    return members[0];
  },

  async findByIds(ids: string[]): Promise<SchoolMember[]> {
    if (ids.length === 0) return [];
    const membersCollection = database.get<SchoolMember>("school_members");
    return await membersCollection
      .query(Q.where("id", Q.oneOf(ids)), Q.where("deleted_at", null))
      .fetch();
  },

  async findActiveBySchoolId(schoolId: string): Promise<SchoolMember[]> {
    const membersCollection = database.get<SchoolMember>("school_members");
    return await membersCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("status", Q.oneOf([MemberStatus.ACTIVE, MemberStatus.OFFLINE])),
        Q.where("deleted_at", null),
      )
      .fetch();
  },

  async findActiveBySchoolIds(schoolIds: string[]): Promise<SchoolMember[]> {
    if (schoolIds.length === 0) return [];
    const membersCollection = database.get<SchoolMember>("school_members");
    return await membersCollection
      .query(
        Q.where("school_id", Q.oneOf(schoolIds)),
        Q.where("status", Q.oneOf([MemberStatus.ACTIVE, MemberStatus.OFFLINE])),
        Q.where("deleted_at", null),
      )
      .fetch();
  },

  async update(id: string, data: Partial<SchoolMember>): Promise<SchoolMember> {
    const membersCollection = database.get<SchoolMember>("school_members");
    const member = await membersCollection.find(id);
    const result = await database.write(async () => {
      return await member.update((record) => {
        Object.assign(record, data);
      });
    });

    return result;
  },

  async softDelete(id: string): Promise<void> {
    const membersCollection = database.get<SchoolMember>("school_members");
    const member = await membersCollection.find(id);
    await database.write(async () => {
      await member.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  observeCount(schoolId: string) {
    const membersCollection = database.get<SchoolMember>("school_members");
    return membersCollection
      .query(Q.where("school_id", schoolId), Q.where("deleted_at", null))
      .observeCount();
  },

  // Observable methods for reactive UI
  observeBySchoolId(schoolId: string) {
    const membersCollection = database.get<SchoolMember>("school_members");
    return membersCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.where("status", Q.notEq(MemberStatus.ARCHIVED)),
      )
      .observe();
  },

  observeActiveBySchoolId(schoolId: string) {
    const membersCollection = database.get<SchoolMember>("school_members");
    return membersCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("status", Q.oneOf([MemberStatus.ACTIVE, MemberStatus.OFFLINE])),
        Q.where("deleted_at", null),
      )
      .observe();
  },

  observeById(id: string) {
    const membersCollection = database.get<SchoolMember>("school_members");
    return membersCollection.findAndObserve(id);
  },

  observeBySchoolIds(schoolIds: string[]) {
    const membersCollection = database.get<SchoolMember>("school_members");
    if (schoolIds.length === 0) {
      return membersCollection.query(Q.where("id", null)).observe();
    }
    return membersCollection
      .query(
        Q.where("school_id", Q.oneOf(schoolIds)),
        Q.where("status", Q.oneOf([MemberStatus.ACTIVE, MemberStatus.OFFLINE])),
        Q.where("deleted_at", null),
      )
      .observe();
  },
};
