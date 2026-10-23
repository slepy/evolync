import { create } from "zustand";
import {
  emptyEventOrderChanges,
  hasEventOrderChanges,
  pruneOrderStatuses,
  withDraftOrder,
  withOrderStatus,
} from "../components/eventOrderDrafts";
import type { EventOrderChanges, EventOrderDraft, EventOrderRowData, OrderStatus } from "../types";

/**
 * Unsaved event orders per event (10D): Add order and status changes wait
 * here, in memory, until the participants Save writes them to the database
 * (and sync to Supabase). Shared between the participants screen and the
 * New order screen it opens; cleared when the participants screen closes.
 */
interface EventOrderDraftState {
  byEvent: Record<string, EventOrderChanges>;
  saveDraft: (draft: EventOrderDraft) => void;
  setStatus: (eventId: string, row: Pick<EventOrderRowData, "id" | "draft" | "storedStatus">, status: OrderStatus) => void;
  pruneStatuses: (eventId: string, stored: Array<{ orderId: string; status: OrderStatus }>) => void;
  clear: (eventId: string) => void;
}

const changesOf = (state: EventOrderDraftState, eventId: string) => state.byEvent[eventId] ?? emptyEventOrderChanges();

export const useEventOrderDraftStore = create<EventOrderDraftState>((set) => ({
  byEvent: {},
  saveDraft: (draft) =>
    set((state) => ({
      byEvent: { ...state.byEvent, [draft.eventId]: withDraftOrder(changesOf(state, draft.eventId), draft) },
    })),
  setStatus: (eventId, row, status) =>
    set((state) => ({
      byEvent: { ...state.byEvent, [eventId]: withOrderStatus(changesOf(state, eventId), row, status) },
    })),
  pruneStatuses: (eventId, stored) =>
    set((state) => {
      const current = state.byEvent[eventId];
      if (!current || Object.keys(current.statuses).length === 0) return state;
      return { byEvent: { ...state.byEvent, [eventId]: pruneOrderStatuses(current, stored) } };
    }),
  clear: (eventId) =>
    set((state) => {
      if (!state.byEvent[eventId]) return state;
      const { [eventId]: _cleared, ...rest } = state.byEvent;
      return { byEvent: rest };
    }),
}));

const EMPTY = emptyEventOrderChanges();

/** The event's unsaved order changes and whether there are any. */
export const useEventOrderChanges = (eventId: string | undefined) => {
  const changes = useEventOrderDraftStore((state) => (eventId ? state.byEvent[eventId] : undefined)) ?? EMPTY;
  return { changes, hasChanges: hasEventOrderChanges(changes) };
};

/** A draft of the event by id (editing it again from 10D). */
export const useEventOrderDraft = (eventId: string | undefined, draftId: string | undefined) =>
  useEventOrderDraftStore((state) =>
    eventId && draftId ? state.byEvent[eventId]?.drafts.find((d) => d.id === draftId) : undefined,
  );
