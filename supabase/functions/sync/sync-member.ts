/**
 * Pull of a user's student side: the schools they are a member of and their
 * own rows there (payments, attendance, orders, events, planned trainings).
 *
 * Used by both sync modes: a regular user (syncUser) and an organization owner
 * who also trains as a student in another organization's school
 * (syncOrganization), whose own organization pull never reaches those schools.
 */

import { SyncContext } from "./types.ts";
import {
  convertToWatermelonRecord,
  fetchTableChangesIn,
  MEMBER_SCHOOL_TABLES,
  membershipChangedSince,
} from "./utils.ts";
import { pullTrainingsForMember } from "./sync-trainings.ts";
import { pullEventTypesForMember } from "./sync-event-types.ts";

type TableChanges = { created: any[]; updated: any[]; deleted: string[] };
export type FetchTableChanges = (
  tableName: string,
  filterFn?: (query: any) => any,
) => Promise<TableChanges>;

const EMPTY = (): TableChanges => ({ created: [], updated: [], deleted: [] });

/**
 * `fetchTableChanges` of a sync pull: rows created / updated / deleted since
 * lastPulledAt, every live row of the tables `isFullPull` names (as updates).
 * A failed query logs and yields no changes for that table.
 */
export function createFetchTableChanges(
  ctx: SyncContext,
  isFullPull: (tableName: string) => boolean,
  logPrefix: string,
): FetchTableChanges {
  const { supabaseClient, lastPulledAt } = ctx;
  const lastPulledDate = new Date(lastPulledAt).toISOString();

  return async (tableName, filterFn) => {
    const fullPull = isFullPull(tableName);
    let query = supabaseClient.from(tableName).select("*").is("deleted_at", null);
    if (!fullPull) {
      query = query.or(`created_at.gte.${lastPulledDate},updated_at.gte.${lastPulledDate}`);
    }
    if (filterFn) query = filterFn(query);

    const { data: records, error } = await query;
    if (error) {
      console.error(`${logPrefix} Error fetching ${tableName}:`, error);
      return EMPTY();
    }

    const created: any[] = [];
    const updated: any[] = [];
    for (const record of records || []) {
      const createdAt = new Date(record.created_at).getTime();
      const updatedAt = new Date(record.updated_at).getTime();
      const watermelonRecord = convertToWatermelonRecord(record, tableName);

      if (createdAt > lastPulledAt) {
        created.push(watermelonRecord);
      } else if (updatedAt > lastPulledAt || fullPull) {
        updated.push(watermelonRecord);
      }
    }

    let deletedQuery = supabaseClient
      .from(tableName)
      .select("id")
      .gte("deleted_at", lastPulledDate)
      .not("deleted_at", "is", null);
    if (filterFn) deletedQuery = filterFn(deletedQuery);

    const { data: deletedRecords, error: deletedError } = await deletedQuery;
    if (deletedError) {
      console.error(`${logPrefix} Error fetching deleted ${tableName}:`, deletedError);
      return { created, updated, deleted: [] };
    }

    return { created, updated, deleted: (deletedRecords || []).map((r: any) => r.id) };
  };
}

export interface Membership {
  id: string;
  school_id: string;
  status?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * The user's live school_members rows. `excludeSchoolIds`: schools the caller
 * already pulls in full (an owner's own schools).
 */
export async function fetchMemberships(
  ctx: SyncContext,
  excludeSchoolIds: string[] = [],
): Promise<Membership[]> {
  const { data, error } = await ctx.supabaseClient
    .from("school_members")
    .select("school_id, id, status, created_at, updated_at")
    .eq("user_id", ctx.userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Failed to fetch memberships: ${error.message}`);
  }

  const excluded = new Set(excludeSchoolIds);
  return (data || []).filter((m: Membership) => !excluded.has(m.school_id));
}

/**
 * Pull changes of the member tables for `memberships`. Their school's
 * existing rows are pulled in full when a membership changed since the last
 * pull or the client asked for it once (`fullMemberPull`).
 */
export async function pullMemberChanges(
  ctx: SyncContext,
  memberships: Membership[],
  logPrefix: string,
): Promise<Record<string, TableChanges>> {
  const { supabaseClient, userId } = ctx;
  const pullChanges: Record<string, TableChanges> = {};

  const schoolIds = memberships.map((m) => m.school_id);
  const memberIds = memberships.map((m) => m.id);
  if (schoolIds.length === 0) return pullChanges;

  const fullMemberPull =
    membershipChangedSince(memberships, ctx.lastPulledAt) || (!!ctx.fullMemberPull && !!ctx.lastPulledAt);
  const fetchTableChanges = createFetchTableChanges(
    ctx,
    (tableName) =>
      (ctx.columnMigratedTables ?? []).includes(tableName) ||
      (fullMemberPull && MEMBER_SCHOOL_TABLES.includes(tableName)),
    logPrefix,
  );

  // Organizations of the schools (to fetch products)
  const { data: schools } = await supabaseClient
    .from("schools")
    .select("id, name, organization_id")
    .in("id", schoolIds)
    .is("deleted_at", null);
  const organizationIds: string[] = [...new Set<string>((schools || []).map((s: any) => s.organization_id))];

  pullChanges.schools = await fetchTableChanges("schools", (q) => q.in("id", schoolIds));
  pullChanges.school_settings = await fetchTableChanges("school_settings", (q) =>
    q.in("school_id", schoolIds),
  );

  // ALL members of the schools (so they can see other students)
  pullChanges.school_members = await fetchTableChanges("school_members", (q) =>
    q.in("school_id", schoolIds),
  );

  pullChanges.payment_cycles = await fetchTableChanges("payment_cycles", (q) =>
    q.in("school_id", schoolIds),
  );
  const { data: paymentCycles } = await supabaseClient
    .from("payment_cycles")
    .select("id")
    .in("school_id", schoolIds)
    .is("deleted_at", null);
  const paymentCycleIds = (paymentCycles || []).map((c: any) => c.id);

  // Only their own payment records
  pullChanges.payment_records = paymentCycleIds.length > 0
    ? await fetchTableChangesIn(fetchTableChanges, "payment_records", "payment_cycle_id", paymentCycleIds, (q) =>
      q.in("school_member_id", memberIds),
    )
    : EMPTY();

  pullChanges.training_sessions = await fetchTableChanges("training_sessions", (q) =>
    q.in("school_id", schoolIds),
  );
  const { data: trainingSessions } = await supabaseClient
    .from("training_sessions")
    .select("id")
    .in("school_id", schoolIds)
    .is("deleted_at", null);
  const sessionIds = (trainingSessions || []).map((s: any) => s.id);

  // Only their own attendance
  pullChanges.attendance_records = sessionIds.length > 0
    ? await fetchTableChangesIn(fetchTableChanges, "attendance_records", "training_session_id", sessionIds, (q) =>
      q.in("school_member_id", memberIds),
    )
    : EMPTY();

  // Their own orders and the items in them
  pullChanges.orders = await fetchTableChanges("orders", (q) =>
    q.in("school_member_id", memberIds).in("school_id", schoolIds),
  );
  const { data: orders } = await supabaseClient
    .from("orders")
    .select("id")
    .in("school_member_id", memberIds)
    .in("school_id", schoolIds)
    .is("deleted_at", null);
  const orderIds = (orders || []).map((o: any) => o.id);
  pullChanges.order_items = orderIds.length > 0
    ? await fetchTableChangesIn(fetchTableChanges, "order_items", "order_id", orderIds)
    : EMPTY();

  // Products of the schools' organizations (read-only)
  if (organizationIds.length > 0) {
    pullChanges.products = await fetchTableChanges("products", (q) =>
      q.in("organization_id", organizationIds),
    );
    const { data: products } = await supabaseClient
      .from("products")
      .select("id")
      .in("organization_id", organizationIds)
      .is("deleted_at", null);
    const productIds = (products || []).map((p: any) => p.id);
    pullChanges.product_variants = productIds.length > 0
      ? await fetchTableChangesIn(fetchTableChanges, "product_variants", "product_id", productIds)
      : EMPTY();
  } else {
    pullChanges.products = EMPTY();
    pullChanges.product_variants = EMPTY();
  }

  // Events they take part in: their participant rows first, then the events
  const { data: participantRecords } = await supabaseClient
    .from("event_participants")
    .select("event_id, school_member_id")
    .in("school_member_id", memberIds)
    .is("deleted_at", null);
  const eventIds: string[] = [...new Set<string>((participantRecords || []).map((p: any) => p.event_id))];

  if (eventIds.length > 0) {
    pullChanges.events = await fetchTableChanges("events", (q) => q.in("id", eventIds));
    // Only this user's participant records
    pullChanges.event_participants = await fetchTableChanges("event_participants", (q) =>
      q.in("event_id", eventIds).in("school_member_id", memberIds),
    );
    // Types of those events (read-only), so the rows show the type name
    pullChanges.event_types = await pullEventTypesForMember(ctx, eventIds, [
      ...pullChanges.events.created,
      ...pullChanges.events.updated,
    ]);
  } else {
    pullChanges.events = EMPTY();
    pullChanges.event_participants = EMPTY();
    pullChanges.event_types = EMPTY();
  }

  // Planned trainings the member is in the audience of (read-only)
  Object.assign(
    pullChanges,
    await pullTrainingsForMember(ctx, {
      memberIds,
      schoolIds,
      organizationIds,
      newMembership: fullMemberPull,
    }),
  );

  // Their own join requests (pending, approved or withdrawn)
  pullChanges.school_join_requests = await fetchTableChanges("school_join_requests", (q) =>
    q.eq("user_id", userId),
  );

  console.log(
    `${logPrefix} Member pull: ${schoolIds.length} school(s), full=${fullMemberPull}`,
  );

  return pullChanges;
}
