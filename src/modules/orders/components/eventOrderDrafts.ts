import type { OrderListEntry } from "../hooks/useOrdersList";
import type { EventOrderChanges, EventOrderDraft, EventOrderRowData } from "../types/dto";
import type { OrderStatus } from "../types/enums";
import { cartItemCount, cartTotals } from "./orderCart";

/**
 * Pure state of the event orders on the participants screen (10D): drafts of
 * new orders and status changes of stored ones, kept until Save.
 */

export const emptyEventOrderChanges = (): EventOrderChanges => ({ drafts: [], statuses: {} });

/** Adds a draft or replaces it (same id); a draft without products is removed. */
export const withDraftOrder = (changes: EventOrderChanges, draft: EventOrderDraft): EventOrderChanges => {
  const rest = changes.drafts.filter((d) => d.id !== draft.id);
  const index = changes.drafts.findIndex((d) => d.id === draft.id);
  if (draft.items.length === 0) return { ...changes, drafts: rest };
  const drafts = [...rest];
  drafts.splice(index === -1 ? drafts.length : index, 0, draft);
  return { ...changes, drafts };
};

/**
 * Changes the status of a row: a draft keeps it on the draft, a stored order
 * gets a pending change (dropped again when it returns to the stored status).
 */
export const withOrderStatus = (
  changes: EventOrderChanges,
  row: Pick<EventOrderRowData, "id" | "draft" | "storedStatus">,
  status: OrderStatus,
): EventOrderChanges => {
  if (row.draft) {
    return { ...changes, drafts: changes.drafts.map((d) => (d.id === row.id ? { ...d, status } : d)) };
  }
  const statuses = { ...changes.statuses };
  if (status === row.storedStatus) delete statuses[row.id];
  else statuses[row.id] = status;
  return { ...changes, statuses };
};

export const hasEventOrderChanges = (changes: EventOrderChanges | undefined): boolean =>
  !!changes && (changes.drafts.length > 0 || Object.keys(changes.statuses).length > 0);

/** Status changes of orders that are gone or already stored with that status are dropped. */
export const pruneOrderStatuses = (
  changes: EventOrderChanges,
  stored: Array<{ orderId: string; status: OrderStatus }>,
): EventOrderChanges => {
  const byId = new Map(stored.map((o) => [o.orderId, o.status]));
  const statuses: Record<string, OrderStatus> = {};
  for (const [id, status] of Object.entries(changes.statuses)) {
    if (byId.has(id) && byId.get(id) !== status) statuses[id] = status;
  }
  return { ...changes, statuses };
};

const storedRow = (entry: OrderListEntry, changes: EventOrderChanges): EventOrderRowData => ({
  id: entry.orderId,
  memberId: entry.memberId,
  draft: false,
  productName: entry.items.length === 1 ? entry.items[0].productName : null,
  itemCount: entry.itemCount,
  totalsByCurrency: entry.totalsByCurrency,
  status: changes.statuses[entry.orderId] ?? entry.status,
  storedStatus: entry.status,
  createdAt: entry.createdAt,
});

const draftRow = (draft: EventOrderDraft): EventOrderRowData => ({
  id: draft.id,
  memberId: draft.memberId,
  draft: true,
  productName: draft.items.length === 1 ? draft.items[0].productName : null,
  itemCount: cartItemCount(draft.items),
  totalsByCurrency: cartTotals(draft.items),
  status: draft.status,
  storedStatus: draft.status,
  createdAt: new Date(draft.createdAt),
});

/**
 * Orders of every participant: stored orders of the event (newest first) with
 * their pending status, then the member's drafts in the order they were added.
 */
export const eventOrdersByMember = (
  stored: OrderListEntry[],
  changes: EventOrderChanges,
): Map<string, EventOrderRowData[]> => {
  const byMember = new Map<string, EventOrderRowData[]>();
  const push = (row: EventOrderRowData) => byMember.set(row.memberId, [...(byMember.get(row.memberId) ?? []), row]);
  for (const entry of stored) push(storedRow(entry, changes));
  for (const draft of changes.drafts) push(draftRow(draft));
  return byMember;
};

/** Add order: only an exam taker of an event with exams planned (Q2). */
export const showsAddOrder = (examsPlanned: boolean, takesExam: boolean): boolean => examsPlanned && takesExam;
