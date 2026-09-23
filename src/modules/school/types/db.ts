/**
 * Database types for School module
 * Mirrors Supabase schema structure
 */

/**
 * School record from Supabase database
 */
export interface SchoolRecord {
  id: string;
  organization_id: string;
  name: string;
  address?: string | null;
  created_at: string; // ISO timestamp from Supabase
  updated_at: string;
  deleted_at?: string | null;
}
