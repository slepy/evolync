import { sync } from "@/database/sync";
import School from "@/database/models/School";
import { useStore } from "@/store";
import { v4 as uuidv4 } from "uuid";
import type { CreateSchoolDto, UpdateSchoolDto } from "../types/dto";
import { SchoolRepository } from "../repositories/schoolRepository";

/**
 * Service for managing schools in offline-first architecture
 *
 * Key principles:
 * 1. All operations write to local WatermelonDB first
 * 2. Background sync propagates changes to Supabase
 * 3. UI is reactive to local database changes
 */

// ============================================================================
// Create School
// ============================================================================

/**
 * Creates a new school in the local database
 *
 * Flow:
 * 1. Validates user has an organization (throws if not owner)
 * 2. Generates UUID v4 for the school
 * 3. Writes to WatermelonDB
 * 4. Returns created school model
 * 5. Background sync will push to Supabase (handled by WatermelonDB Sync Adapter)
 *
 * @param data - School creation data (name only)
 * @returns Promise<School> - Created school model from WatermelonDB
 * @throws Error if user is not an organization owner
 * @throws Error if database write fails
 */
export const createSchool = async (data: CreateSchoolDto): Promise<School> => {
  const { organization } = useStore.getState();
  if (!organization) {
    throw new Error("User is not an organization owner. Cannot create school.");
  }
  const schoolId = uuidv4();
  const school = await SchoolRepository.create({
    _raw: { id: schoolId },
    organizationId: organization.id,
    name: data.name,
  } as Partial<School>);
  sync().catch((err) => {
    console.error("[createSchool] Sync failed:", err);
  });
  return school;
};

// ============================================================================
// Update School
// ============================================================================

/**
 * Updates an existing school in the local database
 *
 * @param schoolId - ID of the school to update
 * @param data - Update data (name, address)
 * @returns Promise<School> - Updated school model from WatermelonDB
 */
export const updateSchool = async (
  schoolId: string,
  data: UpdateSchoolDto,
): Promise<School> => {
  const school = await SchoolRepository.update(schoolId, data);
  sync().catch((err) => {
    console.error("[updateSchool] Sync failed:", err);
  });
  return school;
};
