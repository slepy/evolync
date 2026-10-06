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
