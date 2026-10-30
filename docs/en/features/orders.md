---
layout: page
feature: orders
title: Orders
group: school
accent: orders
icon: shopping-bag
order: 14
summary: "Equipment orders (gis, gloves, T-shirts): the instructor or the student orders products of the organization in their sizes, the instructor moves each order from Placed to Completed and gets a shopping list of what to buy."
purpose: "Collects what students need, so the instructor orders it from the supplier in one go and knows who has paid and picked up what."
who:
  - role: "Instructor (organization owner)"
    outcome: "Orders for a student, sees the orders of one school or of the whole organization, changes status and products, copies the shopping list"
  - role: "Student"
    outcome: "Orders for themselves and follows the status; changes or deletes the order only while it is *Placed*"
rules:
  - "An order belongs to **one student** of one school and holds products of the organization, each in a **size** (variant) and quantity."
  - "Price and currency are **copied into the order** when it is created; a later price change in Products does not change existing orders. Totals are per currency."
  - "Status: **Placed → Paid → Processing → Ready for pickup → Completed**; only the instructor changes it, to any status."
  - "The instructor changes products in any status; the student only while the order is *Placed*. Delete follows the same rule."
  - "Stock is shown in the product sheet for information; ordering does not change it."
  - "The organization list has no *Add new*: an order is always made in a school (or by the student)."
  - "The **shopping list** sums the products of the orders by size: *To order* (Placed and Paid), *Processing*, *Ready*. *Copy* puts it on the clipboard as text."
  - "An order made for an event belongs to one of its exam takers (see [Events](./events))."
messages:
  - situation: "Delete an order"
    title: "Delete Order"
    message: "Are you sure you want to delete this order? This action cannot be undone."
  - situation: "No order yet"
    message: "No orders yet"
  - situation: "Instructor: a student ordered"
    title: "New order"
    message: "Anna Kowalska · 2 items"
  - situation: "Event order for someone who does not take the exam"
    message: "This student doesn't take the exam at this event."
flows:
  - id: create
    title: "New order"
    steps:
      - title: "Orders"
        text: "Status chips with counts filter the list; rows show the student, the number of items, the event and the total per currency. *Add new* opens a new order."
        screen: OrdersOrg
      - title: "Student"
        text: "In a school the instructor picks the STUDENT (search above 8 students); a student ordering for themselves has no such field."
        screen: OrderStudentSelect
      - title: "Add product"
        text: "The organization's products with search; a tap shows the sizes with price and stock, − and + set the quantity, the footer counts items and the total."
        screen: OrderProductPicker
      - title: "Create"
        text: "*Create* is active with a student and at least one product. The order and its items are written in one transaction, status *Placed*, and synced."
        screen: OrderCreateFilled
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Instructor notified"
        text: "When a student orders, the database writes *New order* for the school owner and sends a push; the owner ordering for themselves is not notified."
        screen: NotificationsOrg
        api:
          - { id: send-push, x: 85, y: 22 }
    diagram: |
      sequenceDiagram
        actor U as Instructor or student
        participant A as App
        participant L as Local DB
        participant Sync as Edge Function sync
        participant DB as Supabase DB
        U->>A: Student, products, Create
        A->>L: Order (Placed) + items with price snapshots
        A-->>U: Back to the orders
        A-)Sync: Push order and items
        Sync->>DB: Insert
        DB->>DB: New order notification for the school owner
  - id: manage
    title: "Status and details"
    steps:
      - title: "Order"
        text: "Student, event, status with *Change*, created and updated; then the products with the total. A tap on a product changes its size or quantity, the trash removes it; *Save* appears after a change."
        screen: OrderDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Change status"
        text: "Five statuses with what each means; *· current* marks the status the order has. *Save* applies it."
        screen: OrdersStatusSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: shopping
    title: "Shopping list"
    steps:
      - title: "Shopping list"
        text: "The second view of Orders: every product of the chosen orders with the quantity per size. *Copy* puts the list on the clipboard to send to the supplier."
        screen: OrdersShoppingList
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Orders and shopping list (routes `/organization/orders`, `/school/{schoolId}/orders`, `/user/orders`) | `src/modules/orders/components/OrdersScreen.tsx`, `hooks/useOrdersList.ts`, `components/orderListState.ts` |
| New order (routes `…/orders/create`) | `OrderFormScreen.tsx`, `StudentSelectSheet.tsx`, `AddProductSheet.tsx`, `createOrderWithItems` in `services/orderService.ts` |
| Order details (routes `…/orders/{orderId}`) | `OrderDetailsScreen.tsx`, `OrderStatusSheet.tsx`, `updateOrderItems`, `updateOrderStatus`, `deleteOrder` |
| Who may do what | `components/orderAccess.ts` |
| Notification | `notify_order_created` in `supabase/migrations/20261001000000_notifications.sql` |

## Data

| Table | Columns |
| --- | --- |
| `orders` | `school_id`, `school_member_id`, `status`, `event_id` |
| `order_items` | `order_id`, `product_variant_id`, `quantity`, `unit_price`, `currency` |

## Sync

- The organization owner pushes and pulls the orders of all their schools.
- A student pulls and pushes their own orders; the server drops `event_id` from a student's order.

</FeatureView>
