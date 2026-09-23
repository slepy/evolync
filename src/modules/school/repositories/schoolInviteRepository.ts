import { database } from "@/database";
import SchoolInvite from "@/database/models/SchoolInvite";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const SchoolInviteRepository = {
  async create(data: Partial<SchoolInvite>): Promise<SchoolInvite> {
    const invitesCollection = database.get<SchoolInvite>("school_invites");
    return await database.write(async () => {
      return await invitesCollection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string): Promise<SchoolInvite | null> {
    const invitesCollection = database.get<SchoolInvite>("school_invites");
    try {
      const invite = await invitesCollection.find(id);
      if (invite.deletedAt) {
        return null;
      }
      return invite;
    } catch {
      return null;
    }
  },

  async findByCode(code: string): Promise<SchoolInvite | null> {
    const invitesCollection = database.get<SchoolInvite>("school_invites");
    const now = Date.now();
    const invites = await invitesCollection
      .query(
        Q.where("code", code),
        Q.where("expires_at", Q.gt(now)),
        Q.where("deleted_at", null)
      )
      .fetch();

    if (invites.length === 0) {
      return null;
    }

    return invites[0];
  },

  async findActiveBySchoolId(schoolId: string): Promise<SchoolInvite[]> {
    const invitesCollection = database.get<SchoolInvite>("school_invites");
    return await invitesCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("expires_at", Q.gt(Date.now())),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async invalidateActiveInvites(schoolId: string): Promise<void> {
    const activeInvites = await this.findActiveBySchoolId(schoolId);

    if (activeInvites.length === 0) return;

    await database.write(async () => {
      const operations = activeInvites.map((invite) =>
        invite.prepareUpdate((record) => {
          record.deletedAt = Date.now();
        })
      );
      await database.batch(operations);
    });
  },

  async softDelete(id: string): Promise<void> {
    const invitesCollection = database.get<SchoolInvite>("school_invites");
    const invite = await invitesCollection.find(id);
    await database.write(async () => {
      await invite.update((record) => {
        record.deletedAt = Date.now();
      });
    });
  },

  // Observable methods for reactive UI
  observeActiveBySchoolId(schoolId: string) {
    const invitesCollection = database.get<SchoolInvite>("school_invites");
    return invitesCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("expires_at", Q.gt(Date.now())),
        Q.where("deleted_at", null)
      )
      .observe();
  },
};
