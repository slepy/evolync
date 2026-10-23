import { useEffect, useState } from "react";
import { combineLatest, from, of } from "rxjs";
import { switchMap } from "rxjs/operators";
import { OrderItemRepository, OrderRepository } from "../repositories";
import { toOrderListEntries, type OrderListEntry } from "./useOrdersList";

/**
 * Stored orders placed for an event (10D), with products and totals.
 * Re-emits on new orders, status and item changes; null until the first load.
 */
export const useEventOrders = (eventId: string | undefined) => {
  const [entries, setEntries] = useState<OrderListEntry[] | null>(null);

  useEffect(() => {
    setEntries(null);
    if (!eventId) return;
    const subscription = OrderRepository.observeByEventId(eventId)
      .pipe(
        switchMap((orders) =>
          orders.length === 0
            ? of([] as OrderListEntry[])
            : combineLatest([of(orders), OrderItemRepository.observeByOrderIds(orders.map((o) => o.id))]).pipe(
                switchMap(([list, items]) => from(toOrderListEntries(list, items))),
              ),
        ),
      )
      .subscribe({
        next: setEntries,
        error: (err: Error) => console.error("[useEventOrders] Observer error:", err),
      });
    return () => subscription.unsubscribe();
  }, [eventId]);

  return entries;
};
