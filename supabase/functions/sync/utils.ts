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
  // updated_at is server-owned (DEFAULT now() on insert, trigger on update):
  // pulls select rows by it, so a device clock (or a record made offline and
  // pushed later) would hide a new row from every other user's next pull.
  delete supabaseRecord.updated_at;
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

type TableChanges = { created: any[]; updated: any[]; deleted: string[] };

/**
 * Ids per `.in()` filter. PostgREST takes filters in the URL, so a filter
 * over every session / cycle / order of an organization outgrows the URL
 * limit as data accumulates and the pull fails (after the push was applied).
 */
export const IN_FILTER_CHUNK = 100;

/** `ids` split into parts of at most `size`. */
export function chunkIds<T>(ids: T[], size: number = IN_FILTER_CHUNK): T[][] {
  const parts: T[][] = [];
  for (let i = 0; i < ids.length; i += size) parts.push(ids.slice(i, i + size));
  return parts;
}

/** One table's pull changes from the changes of its id chunks. */
export function mergeTableChanges(parts: TableChanges[]): TableChanges {
  return {
    created: parts.flatMap((p) => p.created),
    updated: parts.flatMap((p) => p.updated),
    deleted: parts.flatMap((p) => p.deleted),
  };
}

/**
 * `fetchTableChanges` for the rows whose `column` is one of `ids`, one
 * request per chunk of ids; `filterFn` adds the table's other filters.
 */
export async function fetchTableChangesIn(
  fetchTableChanges: (tableName: string, filterFn?: (query: any) => any) => Promise<TableChanges>,
  tableName: string,
  column: string,
  ids: string[],
  filterFn?: (query: any) => any,
): Promise<TableChanges> {
  const parts: TableChanges[] = [];
  for (const part of chunkIds(ids)) {
    parts.push(
      await fetchTableChanges(tableName, (q) => {
        const filtered = q.in(column, part);
        return filterFn ? filterFn(filtered) : filtered;
      }),
    );
  }
  return mergeTableChanges(parts);
}

/**
 * A user's pushed school_members rows: only their own membership records,
 * without the payment amount columns (the fee is set by the instructor).
 */
export function ownMembershipPush(records: any[], userId: string): any[] {
  return records
    .filter((r: any) => r.user_id === userId)
    .map(({ payment_amount: _amount, payment_currency: _currency, ...r }: any) => r);
}

/**
 * A student's pushed event_participants rows without takes_exam: only the
 * owner marks who takes the exam (10D), a student keeps the server value.
 */
export function studentParticipantPush(records: any[]): any[] {
  return records.map(({ takes_exam: _takesExam, ...r }: any) => r);
}

/**
 * A student's pushed orders without event_id: only orders created by the
 * owner from an event (10D Add order) belong to it.
 */
export function studentOrderPush(records: any[]): any[] {
  return records.map(({ event_id: _eventId, ...r }: any) => r);
}

/**
 * Push order of an organization owner's tables, parents before the rows that
 * reference them (orders.event_id → events → event_types).
 */
export const ORGANIZATION_PUSH_TABLES = [
  "organizations",
  "organization_gradings",
  "schools",
  "school_settings",
  "school_invites",
  "school_join_requests",
  "school_members",
  "products",
  "product_variants",
  "event_types",
  "events",
  "event_participants",
  "orders",
  "order_items",
  "payment_cycles",
  "payment_records",
  "training_sessions",
  "attendance_records",
];

/**
 * Tables to pull in full: a client that gained a column through a schema
 * migration (e.g. events.type_id at v22) holds its rows without that column,
 * so unchanged rows are sent again (as updates) to fill it in.
 */
export function columnMigratedTables(
  migration: { columns?: { table: string; columns: string[] }[] } | null | undefined,
): string[] {
  return [...new Set((migration?.columns ?? []).filter((c) => c.columns.length > 0).map((c) => c.table))];
}

/**
 * Margin taken off the returned pull timestamp: a row is stamped with its
 * transaction's start time (now()), so one committed while a pull runs can
 * carry a time before it. Re-pulling a few seconds is harmless.
 */
export const PULL_TIMESTAMP_MARGIN_MS = 10_000;

/** Tables a member pulls for the schools they belong to. */
export const MEMBER_SCHOOL_TABLES = [
  "schools",
  "school_settings",
  "school_members",
  "payment_cycles",
  "payment_records",
  "training_sessions",
  "attendance_records",
  "orders",
  "order_items",
  "products",
  "product_variants",
  "events",
  "event_participants",
];

/**
 * The user's own membership was created or changed since the last pull
 * (join request approved, offline member activated, re-activated): a newly
 * visible school's existing rows (the school, its settings, cycles, members,
 * events) are older than lastPulledAt, so MEMBER_SCHOOL_TABLES are pulled in
 * full once. A first pull is already full.
 */
export function membershipChangedSince(
  memberships: { created_at?: string | null; updated_at?: string | null }[],
  lastPulledAt: number | null | undefined,
): boolean {
  if (!lastPulledAt) return false;
  return memberships.some((m) =>
    [m.created_at, m.updated_at].some((value) => !!value && new Date(value).getTime() > lastPulledAt),
  );
}

/**
 * Pull changes of an owner's organization joined with those of the schools
 * they train in as a student (another organization). A row both pulls send
 * stays once (created wins over updated); an id one pull deletes is not
 * deleted while the other still sends it live.
 */
export function mergePullChanges(
  base: Record<string, TableChanges>,
  extra: Record<string, TableChanges>,
): Record<string, TableChanges> {
  const merged: Record<string, TableChanges> = { ...base };
  for (const [table, add] of Object.entries(extra)) {
    const own = merged[table] ?? { created: [], updated: [], deleted: [] };
    const created = [...own.created];
    const createdIds = new Set(created.map((r) => r.id));
    for (const r of add.created) {
      if (!createdIds.has(r.id)) {
        created.push(r);
        createdIds.add(r.id);
      }
    }
    const updated: any[] = [];
    const updatedIds = new Set<string>();
    for (const r of [...own.updated, ...add.updated]) {
      if (createdIds.has(r.id) || updatedIds.has(r.id)) continue;
      updated.push(r);
      updatedIds.add(r.id);
    }
    const deleted = [...new Set([...own.deleted, ...add.deleted])].filter(
      (id) => !createdIds.has(id) && !updatedIds.has(id),
    );
    merged[table] = { created, updated, deleted };
  }
  return merged;
}

/** Tables a student pushes (their side of a school they belong to). */
export const MEMBER_PUSH_TABLES = [
  "school_join_requests",
  "school_members",
  "orders",
  "order_items",
  "payment_records",
  "attendance_records",
  "event_participants",
];

/** What an organization owner's own organization holds. */
export interface OwnedScope {
  schoolIds: Set<string>;
  orderIds: Set<string>;
  eventIds: Set<string>;
}

/** Whether a pushed row of `table` belongs to another organization's school. */
function isStudentRow(table: string, row: any, owned: OwnedScope): boolean {
  switch (table) {
    case "school_join_requests":
    case "school_members":
    case "orders":
      return !owned.schoolIds.has(row.school_id);
    case "order_items":
      return !owned.orderIds.has(row.order_id);
    case "event_participants":
      return !owned.eventIds.has(row.event_id);
    default:
      return false;
  }
}

/**
 * An organization owner's push split in two: rows of their own organization
 * (`own`, applied as the owner) and the rows they wrote as a student of
 * another organization's school (`student`: join requests, membership,
 * orders and their items, event answers), applied through the student
 * filters. Deletes stay with `own`.
 */
export function splitStudentChanges(
  changes: Record<string, TableChanges>,
  owned: OwnedScope,
): { own: Record<string, TableChanges>; student: Record<string, TableChanges> } {
  const own: Record<string, TableChanges> = {};
  const student: Record<string, TableChanges> = {};
  for (const [table, tableChanges] of Object.entries(changes)) {
    if (!MEMBER_PUSH_TABLES.includes(table)) {
      own[table] = tableChanges;
      continue;
    }
    const split = (rows: any[] = []) => [
      rows.filter((r) => !isStudentRow(table, r, owned)),
      rows.filter((r) => isStudentRow(table, r, owned)),
    ];
    const [ownCreated, studentCreated] = split(tableChanges.created);
    const [ownUpdated, studentUpdated] = split(tableChanges.updated);
    own[table] = { created: ownCreated, updated: ownUpdated, deleted: tableChanges.deleted ?? [] };
    if (studentCreated.length > 0 || studentUpdated.length > 0) {
      student[table] = { created: studentCreated, updated: studentUpdated, deleted: [] };
    }
  }
  return { own, student };
}

/**
 * A Postgres error as one line: message plus its details and hint, which name
 * the failing key (e.g. `Key (school_id)=(…) is not present in table "schools"`),
 * so a client that shows the sync error points at the record that blocks it.
 */
export function describeError(error: { message?: string; details?: string | null; hint?: string | null }): string {
  return [error.message, error.details, error.hint].filter(Boolean).join(" — ");
}
