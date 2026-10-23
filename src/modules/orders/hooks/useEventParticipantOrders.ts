import { useCallback, useEffect, useMemo } from "react";
import { eventOrdersByMember } from "../components/eventOrderDrafts";
import { commitEventOrderChanges } from "../services";
import type { EventOrderRowData, OrderStatus } from "../types";
import { useEventOrderChanges, useEventOrderDraftStore } from "./useEventOrderDrafts";
import { useEventOrders } from "./useEventOrders";

/**
 * Event orders of the participants screen (10D): stored orders merged with the
 * unsaved drafts and status changes, grouped by member; `save` writes the
 * changes (participants Save), `clear` drops them (screen closed).
 */
export const useEventParticipantOrders = (eventId: string | undefined) => {
  const stored = useEventOrders(eventId);
  const { changes, hasChanges } = useEventOrderChanges(eventId);
  const pruneStatuses = useEventOrderDraftStore((s) => s.pruneStatuses);
  const setStoreStatus = useEventOrderDraftStore((s) => s.setStatus);
  const clearStore = useEventOrderDraftStore((s) => s.clear);

  // A pending status of an order deleted or changed elsewhere is dropped.
  useEffect(() => {
    if (eventId && stored) pruneStatuses(eventId, stored);
  }, [eventId, stored, pruneStatuses]);

  const byMember = useMemo(() => eventOrdersByMember(stored ?? [], changes), [stored, changes]);

  const setStatus = useCallback(
    (row: EventOrderRowData, status: OrderStatus) => {
      if (eventId) setStoreStatus(eventId, row, status);
    },
    [eventId, setStoreStatus],
  );

  const save = useCallback(async () => {
    if (!eventId) return;
    const current = useEventOrderDraftStore.getState().byEvent[eventId];
    if (!current) return;
    await commitEventOrderChanges(eventId, current);
    clearStore(eventId);
  }, [eventId, clearStore]);

  const clear = useCallback(() => {
    if (eventId) clearStore(eventId);
  }, [eventId, clearStore]);

  return { byMember, hasChanges, setStatus, save, clear };
};
