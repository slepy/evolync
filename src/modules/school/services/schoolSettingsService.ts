import { sync } from "@/database/sync";
import type { SchoolSettingsDto } from "../types/dto";
import { SchoolSettingsRepository } from "../repositories/schoolSettingsRepository";

/**
 * Service for managing school settings in offline-first architecture
 */

// ============================================================================
// Create or Update School Settings (Upsert)
// ============================================================================

/**
 * Creates or updates school settings (upsert pattern)
 *
 * @param schoolId - ID of the school
 * @param data - Settings data (defaultCurrency, defaultPaymentAmount)
 * @returns Promise<SchoolSettings> - Created or updated settings
 */
export const createOrUpdateSchoolSettings = async (
  schoolId: string,
  data: SchoolSettingsDto,
): Promise<any> => {
  const settings = await SchoolSettingsRepository.upsert(schoolId, data);
  sync().catch((err) => {
    console.error("[createOrUpdateSchoolSettings] Sync failed:", err);
  });
  return settings;
};

// ============================================================================
// Get School Settings
// ============================================================================

/**
 * Gets school settings from local database
 *
 * @param schoolId - ID of the school
 * @returns Promise<SchoolSettings | null> - Settings or null if not found
 */
export const getSchoolSettings = async (
  schoolId: string,
): Promise<any | null> => {
  return SchoolSettingsRepository.findBySchoolId(schoolId);
};
