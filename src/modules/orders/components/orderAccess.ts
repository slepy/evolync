import { OrderStatus } from "../types/enums";

/**
 * Where the Orders screens were opened from:
 * - organization: orders of every school, no Add new, full edit;
 * - school: that school's orders, Add new, full edit;
 * - student: the member's own orders, Add new, edit only while placed.
 */
export type OrdersScope = "organization" | "school" | "student";

/** Add new on the list (12A): never from the organization. */
export const canAddOrder = (scope: OrdersScope): boolean => scope !== "organization";

/** Products of an order can be changed (12D): staff always, the student only while placed. */
export const canEditOrder = (scope: OrdersScope, status: OrderStatus): boolean =>
  scope !== "student" || status === OrderStatus.PLACED;

/** Delete follows the edit rule. */
export const canDeleteOrder = canEditOrder;

/** Status is changed by staff only (12C). */
export const canChangeOrderStatus = (scope: OrdersScope): boolean => scope !== "student";

/** New order (12E) asks for the student only when staff creates it. */
export const choosesStudent = (scope: OrdersScope): boolean => scope !== "student";

/**
 * The STUDENT field of New order (12E): staff choose the student, unless the
 * student is fixed (10D Add order: locked field); a student orders for
 * themselves (no field).
 */
export const studentFieldMode = (
  scope: OrdersScope,
  fixedStudentId: string | undefined,
): "choose" | "fixed" | "none" => {
  if (!choosesStudent(scope)) return "none";
  return fixedStudentId ? "fixed" : "choose";
};
