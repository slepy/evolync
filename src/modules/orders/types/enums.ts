export type OrderStatus =
  | "placed"
  | "paid"
  | "processing"
  | "ready_for_pickup"
  | "completed";

export const OrderStatus = {
  PLACED: "placed" as const,
  PAID: "paid" as const,
  PROCESSING: "processing" as const,
  READY_FOR_PICKUP: "ready_for_pickup" as const,
  COMPLETED: "completed" as const,
};

export const ORDER_TAB = {
  ORDERS: "orders",
  PRODUCTS: "products",
} as const;

export type OrderTabType = (typeof ORDER_TAB)[keyof typeof ORDER_TAB];

export const ORDER_STATUS_FILTER = {
  ALL: "all",
  PLACED: "placed",
  PAID: "paid",
  PROCESSING: "processing",
  READY_FOR_PICKUP: "ready_for_pickup",
  COMPLETED: "completed",
} as const;

export type OrderStatusFilterValue =
  (typeof ORDER_STATUS_FILTER)[keyof typeof ORDER_STATUS_FILTER];
