import { useEffect, useState } from "react";
import { combineLatest, from, of, type Observable } from "rxjs";
import { switchMap } from "rxjs/operators";
import type Order from "@/database/models/Order";
import type OrderItem from "@/database/models/OrderItem";
import { EventRepository } from "@/modules/events/repositories";
import { ProductRepository, ProductVariantRepository } from "@/modules/inventory/repositories";
import { SchoolRepository } from "@/modules/school/repositories";
import { StudentRepository } from "@/modules/students/repositories";
import type { OrdersScope } from "../components/orderAccess";
import type { ShoppingListSource } from "../components/orderListState";
import { cartItemCount, cartTotals } from "../components/orderCart";
import { OrderItemRepository, OrderRepository } from "../repositories";
import type { OrderStatus } from "../types";

/** One row of the Orders list (12A) with what the shopping list (12B) needs. */
export interface OrderListEntry {
  orderId: string;
  schoolId: string;
  schoolName?: string;
  status: OrderStatus;
  createdAt: Date;
  memberId: string;
  memberName: string;
  memberAvatarUrl?: string;
  memberRankId?: string;
  /** The event the order was placed for; no name when it is not on the device (deleted, not visible). */
  eventId?: string;
  eventName?: string;
  itemCount: number;
  totalsByCurrency: Record<string, number>;
  items: ShoppingListSource[];
}

/** Whose orders the list shows. */
export type OrdersListSource =
  | { scope: Extract<OrdersScope, "organization">; organizationId: string | undefined }
  | { scope: Extract<OrdersScope, "school">; schoolId: string | undefined }
  | { scope: Extract<OrdersScope, "student">; memberId: string | undefined };

const ordersOf = (source: OrdersListSource): Observable<Order[]> | null => {
  switch (source.scope) {
    case "organization":
      if (!source.organizationId) return null;
      return SchoolRepository.observeByOrganizationId(source.organizationId).pipe(
        switchMap((schools) =>
          schools.length === 0 ? of([]) : OrderRepository.observeListBySchoolIds(schools.map((s) => s.id)),
        ),
      );
    case "school":
      return source.schoolId ? OrderRepository.observeListBySchoolIds([source.schoolId]) : null;
    case "student":
      return source.memberId ? OrderRepository.observeListByMemberId(source.memberId) : null;
  }
};

/**
 * The event of an order for its row: the id always, the name only when the
 * event is on the device (a student who left the event no longer has it).
 */
export const orderEvent = (
  eventId: string | null | undefined,
  eventNameById: Map<string, string>,
): Pick<OrderListEntry, "eventId" | "eventName"> =>
  eventId ? { eventId, eventName: eventNameById.get(eventId) } : {};

/** Members, schools, products and events of the orders, each loaded once. */
export const toOrderListEntries = async (orders: Order[], items: OrderItem[]): Promise<OrderListEntry[]> => {
  const memberIds = [...new Set(orders.map((o) => o.schoolMemberId))];
  const schoolIds = [...new Set(orders.map((o) => o.schoolId))];
  const variantIds = [...new Set(items.map((i) => i.productVariantId))];
  const eventIds = [...new Set(orders.flatMap((o) => (o.eventId ? [o.eventId] : [])))];

  const [members, schools, variants, events] = await Promise.all([
    StudentRepository.findByIds(memberIds),
    Promise.all(schoolIds.map((id) => SchoolRepository.findById(id))),
    Promise.all(variantIds.map((id) => ProductVariantRepository.findById(id, true))),
    EventRepository.findByIds(eventIds),
  ]);
  const eventNameById = new Map(events.map((e) => [e.id, e.name]));
  const productIds = [...new Set(variants.flatMap((v) => (v ? [v.productId] : [])))];
  const products = await Promise.all(productIds.map((id) => ProductRepository.findById(id, true)));

  const memberById = new Map(members.map((m) => [m.id, m]));
  const schoolById = new Map(schools.flatMap((s) => (s ? [[s.id, s] as const] : [])));
  const variantById = new Map(variants.flatMap((v) => (v ? [[v.id, v] as const] : [])));
  const productById = new Map(products.flatMap((p) => (p ? [[p.id, p] as const] : [])));

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of items) {
    itemsByOrder.set(item.orderId, [...(itemsByOrder.get(item.orderId) ?? []), item]);
  }

  return orders.map((order) => {
    const member = memberById.get(order.schoolMemberId);
    const orderItems = itemsByOrder.get(order.id) ?? [];
    return {
      orderId: order.id,
      schoolId: order.schoolId,
      schoolName: schoolById.get(order.schoolId)?.name,
      status: order.status,
      createdAt: order.createdAt,
      memberId: order.schoolMemberId,
      memberName: member?.displayName || member?.email || t("unknownMember"),
      memberAvatarUrl: member?.avatarUrl,
      memberRankId: member?.currentRankId,
      ...orderEvent(order.eventId, eventNameById),
      itemCount: cartItemCount(orderItems),
      totalsByCurrency: cartTotals(orderItems),
      items: orderItems.map((item) => {
        const variant = variantById.get(item.productVariantId);
        const product = variant ? productById.get(variant.productId) : undefined;
        return {
          variantId: item.productVariantId,
          productId: variant?.productId ?? "",
          productName: product?.name ?? t("ordersUnknownProduct"),
          variantName: variant?.name ?? t("ordersUnknownVariant"),
          imageUrl: product?.imageUrl ?? null,
          quantity: item.quantity,
        };
      }),
    };
  });
};

/**
 * Orders of the organization (every school), one school or one member, with
 * member, school and product details. Re-emits on order, status and item changes.
 */
export const useOrdersList = (source: OrdersListSource) => {
  const [entries, setEntries] = useState<OrderListEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key =
    source.scope === "organization"
      ? source.organizationId
      : source.scope === "school"
        ? source.schoolId
        : source.memberId;

  useEffect(() => {
    const orders$ = ordersOf(source);
    if (!orders$) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const subscription = orders$
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
        next: (result) => {
          setEntries(result);
          setError(null);
          setIsLoading(false);
        },
        error: (err: Error) => {
          console.error("[useOrdersList] Observer error:", err);
          setError(t("errorLoadingFailed"));
          setIsLoading(false);
        },
      });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.scope, key]);

  return { entries, isLoading, error };
};
