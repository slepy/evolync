import { EventParticipantsScreen } from "@/modules/events";
import {
  EventParticipantOrders,
  OrderStatusSheet,
  showsAddOrder,
  useEventParticipantOrders,
  type EventOrderRowData,
} from "@/modules/orders";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

/**
 * Event participants (10D / 10D1), opened from Manage on the details. With
 * exams planned, exam takers get Add order and their event orders; new
 * orders and order status changes wait in memory and are stored with the
 * participation statuses on Save, which returns to the details. Back without
 * Save drops them.
 *
 * Route: /organization/events/[eventId]/participants
 */
export default function EventParticipantsRoute() {
  useRequireOrganizationOwner();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const orders = useEventParticipantOrders(eventId);
  const [statusOrder, setStatusOrder] = useState<{ order: EventOrderRowData; name: string } | null>(null);
  const { clear } = orders;

  // Unsaved event orders live only while the screen is open.
  useEffect(() => clear, [clear]);

  const openOrder = (order: EventOrderRowData) =>
    order.draft
      ? router.push({
          pathname: "/organization/events/[eventId]/orders/create",
          params: { eventId, memberId: order.memberId, draftId: order.id },
        })
      : router.push({ pathname: "/organization/orders/[orderId]", params: { orderId: order.id } });

  return (
    <>
      <EventParticipantsScreen
        eventId={eventId}
        onSaved={() => router.back()}
        extraChanges={orders.hasChanges}
        onSaveExtra={orders.save}
        renderParticipantContent={({ schoolMemberId, name, takesExam, examsPlanned }) => {
          const rows = orders.byMember.get(schoolMemberId) ?? [];
          const showAdd = showsAddOrder(examsPlanned, takesExam);
          if (rows.length === 0 && !showAdd) return null;
          return (
            <EventParticipantOrders
              name={name}
              orders={rows}
              showAdd={showAdd}
              onAddOrder={() =>
                router.push({
                  pathname: "/organization/events/[eventId]/orders/create",
                  params: { eventId, memberId: schoolMemberId },
                })
              }
              onOpenOrder={openOrder}
              onChangeStatus={examsPlanned ? (order) => setStatusOrder({ order, name }) : undefined}
            />
          );
        }}
      />
      {statusOrder ? (
        <OrderStatusSheet
          open
          onOpenChange={(open) => {
            if (!open) setStatusOrder(null);
          }}
          subtitle={statusOrder.name}
          value={statusOrder.order.status}
          onSelect={(status) => orders.setStatus(statusOrder.order, status)}
        />
      ) : null}
    </>
  );
}
