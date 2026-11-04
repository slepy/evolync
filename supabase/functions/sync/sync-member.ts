/**
 * Push and pull of a user's student side: the schools they are a member of and their
 * own rows there (payments, attendance, orders, events, planned trainings).
 *
 * Used by both sync modes: a regular user (syncUser) and an organization owner
 * who also trains as a student in another organization's school
 * (syncOrganization), whose own organization pull never reaches those schools.
 */

import { SyncContext } from "./types.ts";
import {
  chunkIds,
  convertToSupabaseRecord,
  convertToWatermelonRecord,
  describeError,
  fetchTableChangesIn,
  MEMBER_SCHOOL_TABLES,
  MEMBER_PUSH_TABLES,
  membershipChangedSince,
  ownMembershipPush,
  studentOrderPush,
  studentParticipantPush,
} from "./utils.ts";
import { pullTrainingsForMember } from "./sync-trainings.ts";
import { pullEventTypesForMember } from "./sync-event-types.ts";

type TableChanges = { created: any[]; updated: any[]; deleted: string[] };
export type FetchTableChanges = (
  tableName: string,
  filterFn?: (query: any) => any,
) => Promise<TableChanges>;

const EMPTY = (): TableChanges => ({ created: [], updated: [], deleted: [] });

/** The status a student places an order in and may still edit it in. */
const ORDER_PLACED = "placed";

/** What a student's push may touch: their memberships and the orders they may edit. */
interface StudentScope {
  /** school_members.id → school_id of the user's live memberships. */
  schoolByMember: Map<string, string>;
  /** Orders the push may add items to or change items of → their school_id. */
  editableOrders: Map<string, string>;
}

/** Server rows of `tableName` with the given ids (deleted ones too), by id. */
async function fetchServerRows(
  ctx: SyncContext,
  tableName: string,
  columns: string,
  ids: string[],
): Promise<Map<string, any>> {
  const rows = new Map<string, any>();
  for (const part of chunkIds([...new Set(ids)])) {
    const { data, error } = await ctx.supabaseClient.from(tableName).select(columns).in("id", part);
    if (error) throw new Error(`Failed to fetch ${tableName}: ${describeError(error)}`);
    for (const row of data || []) rows.set(row.id, row);
  }
  return rows;
}

/** Membership columns only the instructor sets (status, rank, role, fee). */
const INSTRUCTOR_MEMBER_COLUMNS = [
  "status",
  "role_id",
  "current_rank_id",
  "payment_amount",
  "payment_currency",
  "joined_at",
];

/**
 * A student's pushed school_members rows: only their own stored memberships
 * (the instructor creates one when approving a join request), never moved to
 * another school or user, without the columns the instructor sets.
 */
async function studentMemberships(ctx: SyncContext, records: any[]): Promise<any[]> {
  const own = ownMembershipPush(records, ctx.userId);
  const server = await fetchServerRows(ctx, "school_members", "id, user_id, school_id", own.map((r) => r.id));
  return own.flatMap((r: any) => {
    const existing = server.get(r.id);
    if (!existing || existing.user_id !== ctx.userId || existing.school_id !== r.school_id) return [];
    return [Object.fromEntries(Object.entries(r).filter(([column]) => !INSTRUCTOR_MEMBER_COLUMNS.includes(column)))];
  });
}

/**
 * A student's pushed orders: only on their own memberships, never someone
 * else's order. A new order starts as placed; an existing one changes only
 * while placed (the student's edit window) and keeps its server status.
 */
async function studentOrders(ctx: SyncContext, records: any[], scope: StudentScope): Promise<any[]> {
  const server = await fetchServerRows(ctx, "orders", "id, school_member_id, status", records.map((r) => r.id));
  const accepted = studentOrderPush(records).filter((r: any) => {
    if (scope.schoolByMember.get(r.school_member_id) !== r.school_id) return false;
    const existing = server.get(r.id);
    return !existing || (scope.schoolByMember.has(existing.school_member_id) && existing.status === ORDER_PLACED);
  });
  return accepted.map(({ status: _status, ...r }: any) => {
    scope.editableOrders.set(r.id, r.school_id);
    return server.has(r.id) ? r : { ...r, status: ORDER_PLACED };
  });
}

/**
 * A student's pushed order items: only in their own placed orders (stored or
 * pushed in this sync), never moved to another order. A new item takes the
 * price of a variant of the school's organization; a stored one keeps its
 * product and price snapshot (quantity and deletion change).
 */
async function studentOrderItems(ctx: SyncContext, records: any[], scope: StudentScope): Promise<any[]> {
  const server = await fetchServerRows(ctx, "order_items", "id, order_id", records.map((r) => r.id));
  const orderIds = records
    .map((r) => r.order_id)
    .concat([...server.values()].map((r) => r.order_id))
    .filter((id) => !scope.editableOrders.has(id));
  const orders = await fetchServerRows(ctx, "orders", "id, school_id, school_member_id, status", orderIds);
  for (const order of orders.values()) {
    if (scope.schoolByMember.has(order.school_member_id) && order.status === ORDER_PLACED) {
      scope.editableOrders.set(order.id, order.school_id);
    }
  }

  const inOwnOrder = records.filter((r: any) => {
    if (!scope.editableOrders.has(r.order_id)) return false;
    const existing = server.get(r.id);
    return !existing || existing.order_id === r.order_id;
  });
  const fresh = inOwnOrder.filter((r: any) => !server.has(r.id));
  const variants = await fetchServerRows(
    ctx,
    "product_variants",
    "id, product_id, price, currency",
    fresh.map((r) => r.product_variant_id),
  );
  const products = await fetchServerRows(
    ctx,
    "products",
    "id, organization_id",
    [...variants.values()].map((v) => v.product_id),
  );
  const schools = await fetchServerRows(
    ctx,
    "schools",
    "id, organization_id",
    fresh.map((r) => scope.editableOrders.get(r.order_id)!),
  );

  return inOwnOrder.flatMap((r: any) => {
    if (server.has(r.id)) {
      const { product_variant_id: _variant, unit_price: _price, currency: _currency, ...rest } = r;
      return [rest];
    }
    const variant = variants.get(r.product_variant_id);
    const organizationId = schools.get(scope.editableOrders.get(r.order_id)!)?.organization_id;
    if (!variant || !organizationId || products.get(variant.product_id)?.organization_id !== organizationId) {
      return [];
    }
    return [{ ...r, unit_price: variant.price, currency: variant.currency }];
  });
}

/**
 * A student's pushed event answers: only their own participant rows, which
 * the instructor created (a student never adds or moves one).
 */
async function studentParticipants(ctx: SyncContext, records: any[], scope: StudentScope): Promise<any[]> {
  const server = await fetchServerRows(
    ctx,
    "event_participants",
    "id, event_id, school_member_id",
    records.map((r) => r.id),
  );
  return studentParticipantPush(records).filter((r: any) => {
    const existing = server.get(r.id);
    return (
      !!existing &&
      scope.schoolByMember.has(existing.school_member_id) &&
      existing.school_member_id === r.school_member_id &&
      existing.event_id === r.event_id
    );
  });
}

/**
 * A student's pushed rows of `tableName`, limited to what a student may write.
 * Payments and attendance are read-only for a student (the instructor marks them).
 */
async function studentRows(
  ctx: SyncContext,
  tableName: string,
  records: any[],
  scope: StudentScope,
): Promise<any[]> {
  if (records.length === 0) return [];
  switch (tableName) {
    case "school_join_requests":
      return records.filter((r: any) => r.user_id === ctx.userId);
    case "school_members":
      return studentMemberships(ctx, records);
    case "orders":
      return studentOrders(ctx, records, scope);
    case "order_items":
      return studentOrderItems(ctx, records, scope);
    case "event_participants":
      return studentParticipants(ctx, records, scope);
    default:
      return [];
  }
}

/**
 * Push of a user's student side: join requests, their own membership, orders
 * and event answers (MEMBER_PUSH_TABLES), through the student filters
 * (checked against their memberships and the stored rows).
 * Deletes are skipped (a student withdraws by setting deleted_at, an update).
 * `throwOnError`: fail the push instead of logging and going on.
 */
export async function pushMemberChanges(
  ctx: SyncContext,
  changes: SyncContext["changes"],
  logPrefix: string,
  { throwOnError = false }: { throwOnError?: boolean } = {},
): Promise<void> {
  const { supabaseClient } = ctx;
  const fail =(message: string, error: any) => {
    if (throwOnError) throw new Error(`${message}: ${describeError(error)}`);
    console.error(`${logPrefix} ${message}:`, error);
  };

  const pushed = (table: string) =>
    (changes[table]?.created?.length ?? 0) + (changes[table]?.updated?.length ?? 0) > 0;
  const memberships = ["orders", "order_items", "event_participants"].some(pushed)
    ? await fetchMemberships(ctx)
    : [];
  const scope: StudentScope = {
    schoolByMember: new Map(memberships.map((m) => [m.id, m.school_id])),
    editableOrders: new Map(),
  };

  for (const tableName of MEMBER_PUSH_TABLES) {
    const tableChanges = changes[tableName];
    if (!tableChanges) continue;

    const created = await studentRows(ctx, tableName, tableChanges.created ?? [], scope);
    const updated = await studentRows(ctx, tableName, tableChanges.updated ?? [], scope);
    if (created.length > 0) {
      console.log(`${logPrefix} Processing ${created.length} created records for ${tableName}`);
      const { error } = await supabaseClient
        .from(tableName)
        .upsert(created.map((record) => convertToSupabaseRecord(record, tableName)));
      if (error) fail(`Failed to insert to ${tableName}`, error);
    }

    if (updated.length > 0) {
      console.log(`${logPrefix} Processing ${updated.length} updated records for ${tableName}`);
      for (const record of updated) {
        const { error } = await supabaseClient
          .from(tableName)
          .update(convertToSupabaseRecord(record, tableName))
          .eq("id", record.id);
        if (error) fail(`Failed to update ${tableName}`, error);
      }
    }

    if ((tableChanges.deleted ?? []).length > 0) {
      console.log(
        `${logPrefix} Skipping ${tableChanges.deleted.length} deletes for ${tableName} (users cannot delete)`,
      );
    }
  }
}

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
    throw new Error(`Failed to fetch memberships: ${describeError(error)}`);
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
