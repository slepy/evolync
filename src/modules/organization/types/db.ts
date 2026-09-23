/**
 * Database types for Organization module
 * Mirrors Supabase schema structure
 */

/**
 * Organization record from Supabase database
 */
export interface OrganizationRecord {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
