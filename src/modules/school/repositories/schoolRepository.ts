import { database } from "@/database";
import School from "@/database/models/School";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

// Import supabase using require to avoid Metro bundler issues
const { supabase } = require("@/config/supabase");

export const SchoolRepository = {
  async create(data: Partial<School> & { id?: string }): Promise<School> {
    const schoolsCollection = database.get<School>("schools");
    return await database.write(async () => {
      return await schoolsCollection.create((record) => {
        // Allow custom ID (for syncing from Supabase) or generate new one
        record._raw.id = data.id || uuidv4();

        // Exclude 'id' from Object.assign since it's read-only
        const { id, ...dataWithoutId } = data;
        Object.assign(record, dataWithoutId);
      });
    });
  },

  async findById(id: string): Promise<School | null> {
    const schoolsCollection = database.get<School>("schools");
    try {
      const school = await schoolsCollection.find(id);
      if (school.deletedAt) {
        return null;
      }
      return school;
    } catch {
      return null;
    }
  },

  /**
   * Find school by ID, with fallback to Supabase if not found locally
   * If found in Supabase, saves it locally before returning
   */
  async findByIdOrFetchFromSupabase(id: string): Promise<School | null> {
    // First try to find locally
    let school = await this.findById(id);
    if (school) {
      return school;
    }

    try {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        return null;
      }

      // Try to save school locally, but handle UNIQUE constraint error
      try {
        school = await this.create({
          id: data.id,
          organizationId: data.organization_id,
          name: data.name,
          description: data.description,
          logoUrl: data.logo_url,
        } as any);
      } catch (createError: any) {
        // If UNIQUE constraint error, the school was created between our checks
        // Just fetch it again
        if (createError?.message?.includes("UNIQUE constraint failed")) {
          school = await this.findById(id);
        } else {
          throw createError;
        }
      }

      return school;
    } catch (error) {
      console.error(
        "[SchoolRepository] Error fetching school from Supabase:",
        error,
      );
      return null;
    }
  },

  async findByOrganizationId(organizationId: string): Promise<School[]> {
    const schoolsCollection = database.get<School>("schools");
    return await schoolsCollection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null),
      )
      .fetch();
  },

  async update(id: string, data: Partial<School>): Promise<School> {
    const schoolsCollection = database.get<School>("schools");
    const existing = await schoolsCollection.find(id);
    return await database.write(async () => {
      return await existing.update((record) => {
        Object.assign(record, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const schoolsCollection = database.get<School>("schools");
    const school = await schoolsCollection.find(id);
    await database.write(async () => {
      await school.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  // Observable methods for reactive UI
  observeAll() {
    const schoolsCollection = database.get<School>("schools");
    return schoolsCollection.query(Q.where("deleted_at", null)).observe();
  },

  observeByOrganizationId(organizationId: string) {
    const schoolsCollection = database.get<School>("schools");
    return schoolsCollection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null),
      )
      .observe();
  },

  observeById(id: string) {
    const schoolsCollection = database.get<School>("schools");
    return schoolsCollection.findAndObserve(id);
  },
};
