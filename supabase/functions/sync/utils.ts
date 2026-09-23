/**
 * Shared utility functions for sync
 */

/**
 * Convert WatermelonDB record to Supabase format
 * - Timestamps: Convert from ms to ISO string, or delete if 0/falsy to use DB defaults
 * - Field names: Convert snake_case to match Supabase schema
 * - Invalid values: Convert "undefined" string to null for nullable fields
 */
export function convertToSupabaseRecord(record: any, tableName: string): any {
  const supabaseRecord: any = { ...record };

  // Helper to convert timestamp - returns ISO string or deletes the field
  // If value is 0 or falsy, delete the field so PostgreSQL uses DEFAULT now()
  const convertOrDeleteTimestamp = (fieldName: string) => {
    const value = record[fieldName];
    if (value && value > 0) {
      supabaseRecord[fieldName] = new Date(value).toISOString();
    } else {
      // Delete field to let PostgreSQL use DEFAULT value
      delete supabaseRecord[fieldName];
    }
  };

  // Convert timestamps from milliseconds to ISO strings
  convertOrDeleteTimestamp("created_at");
  convertOrDeleteTimestamp("updated_at");
  convertOrDeleteTimestamp("deleted_at");
  convertOrDeleteTimestamp("joined_at");
  convertOrDeleteTimestamp("payment_date");
  convertOrDeleteTimestamp("period_start");
  convertOrDeleteTimestamp("period_end");
  convertOrDeleteTimestamp("expires_at");

  // Convert date fields (stored as timestamp in WatermelonDB, needs DATE format for PostgreSQL)
  // These are DATE type columns, not TIMESTAMP, so we only need YYYY-MM-DD
  if (record.date && typeof record.date === "number") {
    supabaseRecord.date = new Date(record.date).toISOString().split("T")[0];
  }
  if (record.start_date && typeof record.start_date === "number") {
    supabaseRecord.start_date = new Date(record.start_date).toISOString().split("T")[0];
  }
  if (record.end_date && typeof record.end_date === "number") {
    supabaseRecord.end_date = new Date(record.end_date).toISOString().split("T")[0];
  }

  // Convert "undefined" string to null for all fields
  // This happens when WatermelonDB serializes JavaScript undefined values
  for (const [key, value] of Object.entries(supabaseRecord)) {
    if (value === "undefined") {
      supabaseRecord[key] = null;
    }
  }

  // Remove WatermelonDB internal fields
  delete supabaseRecord._status;
  delete supabaseRecord._changed;

  return supabaseRecord;
}

/**
 * Convert Supabase record to WatermelonDB format
 * - Timestamps: Convert from ISO string to ms
 * - Field names: Already in snake_case (matches WatermelonDB schema)
 */
export function convertToWatermelonRecord(record: any, tableName: string): any {
  const watermelonRecord: any = { ...record };

  // Convert timestamps from ISO strings to milliseconds
  if (record.created_at) {
    watermelonRecord.created_at = new Date(record.created_at).getTime();
  }
  if (record.updated_at) {
    watermelonRecord.updated_at = new Date(record.updated_at).getTime();
  }
  if (record.deleted_at) {
    watermelonRecord.deleted_at = new Date(record.deleted_at).getTime();
  }
  if (record.joined_at) {
    watermelonRecord.joined_at = new Date(record.joined_at).getTime();
  }
  if (record.payment_date) {
    watermelonRecord.payment_date = new Date(record.payment_date).getTime();
  }
  if (record.period_start) {
    watermelonRecord.period_start = new Date(record.period_start).getTime();
  }
  if (record.period_end) {
    watermelonRecord.period_end = new Date(record.period_end).getTime();
  }
  if (record.expires_at) {
    watermelonRecord.expires_at = new Date(record.expires_at).getTime();
  }

  // Convert date fields (stored as DATE string in PostgreSQL, needs timestamp for WatermelonDB)
  if (record.date && typeof record.date === "string") {
    watermelonRecord.date = new Date(record.date).getTime();
  }
  if (record.start_date && typeof record.start_date === "string") {
    watermelonRecord.start_date = new Date(record.start_date).getTime();
  }
  if (record.end_date && typeof record.end_date === "string") {
    watermelonRecord.end_date = new Date(record.end_date).getTime();
  }

  return watermelonRecord;
}
