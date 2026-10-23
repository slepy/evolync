import { useEvent } from "@/modules/events";
import {
  OrderFormScreen,
  OrderStatus,
  useEventOrderDraft,
  useEventOrderDraftStore,
  useOrderMember,
} from "@/modules/orders";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { LoadingScreen } from "@/core/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * New order for an event (10D Add order → 12E): the STUDENT is the
 * participant, locked, "For the event {name}" under it. Create does not
 * store the order: it becomes a draft on the participants screen, stored
 * with its Save. `?draftId=` edits such a draft again (Save; no products
 * left removes it).
 *
 * Route: /organization/events/[eventId]/orders/create?memberId=…[&draftId=…]
 */
export default function EventOrderCreateScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const { eventId, memberId, draftId } = useLocalSearchParams<{
    eventId: string;
    memberId: string;
    draftId?: string;
  }>();
  const { event } = useEvent(eventId);
  const member = useOrderMember(memberId);
  const draft = useEventOrderDraft(eventId, draftId);
  const saveDraft = useEventOrderDraftStore((s) => s.saveDraft);
  // A new draft gets its id (the future order id) once.
  const newDraftId = useMemo(() => uuidv4(), []);

  const draftGone = !!draftId && !draft;
  // The draft was saved or dropped meanwhile: nothing left to edit here.
  useEffect(() => {
    if (draftGone) router.back();
  }, [draftGone, router]);

  if (!member || !event || draftGone) return <LoadingScreen />;

  return (
    <OrderFormScreen
      scope="school"
      schoolId={member.schoolId}
      fixedStudent={{ id: member.id, name: member.name }}
      event={{ id: event.id, name: event.name }}
      initialCart={draft?.items}
      onSubmitDraft={(studentId, cart) =>
        saveDraft({
          id: draft?.id ?? newDraftId,
          eventId: event.id,
          schoolId: member.schoolId,
          memberId: studentId,
          items: cart,
          status: draft?.status ?? OrderStatus.PLACED,
          createdAt: draft?.createdAt ?? Date.now(),
        })
      }
      onCreated={() => router.back()}
    />
  );
}
