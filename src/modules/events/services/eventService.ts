import { database } from "@/database";
import { sync } from "@/database/sync";
import Event, {
  EVENT_STATUS,
  EVENT_VISIBILITY,
} from "@/database/models/Event";
import EventParticipant, {
  EVENT_PARTICIPANT_STATUS,
} from "@/database/models/EventParticipant";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";

import type {
  CreateEventDto,
  UpdateEventDto,
  UpsertEventParticipantDto,
} from "../types/dto";
import { EventRepository, EventParticipantRepository } from "../repositories";

// ============================================================================
// Events
// ============================================================================

/**
 * Creates a new event
 *
 * @param data - Event data
 * @returns Created Event
 */
export const createEvent = async (data: CreateEventDto): Promise<Event> => {
  // Validate school_id is set when visibility is 'school'
  if (data.visibility === EVENT_VISIBILITY.SCHOOL && !data.schoolId) {
    throw new Error("schoolIdRequiredForSchoolVisibility");
  }

  const event = await EventRepository.create({
    organizationId: data.organizationId,
    schoolId: data.schoolId,
    name: data.name,
    shortNote: data.shortNote,
    address: data.address,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    price: data.price,
    currency: data.currency,
    visibility: data.visibility,
    status: EVENT_STATUS.ACTIVE,
    createdBy: data.createdBy,
  });

  // Trigger background sync
  sync().catch((err) => {
    console.error("[createEvent] Sync failed:", err);
  });

  return event;
};

/**
 * Gets an event by ID
 */
export const getEventById = async (eventId: string): Promise<Event | null> => {
  return EventRepository.findById(eventId);
};

/**
 * Gets all events for an organization
 */
export const getEventsForOrganization = async (
  organizationId: string
): Promise<Event[]> => {
  return EventRepository.findByOrganizationId(organizationId);
};

/**
 * Gets upcoming events for an organization
 */
export const getUpcomingEvents = async (
  organizationId: string
): Promise<Event[]> => {
  return EventRepository.findUpcoming(organizationId);
};

/**
 * Gets historical (past) events for an organization
 */
export const getHistoricalEvents = async (
  organizationId: string
): Promise<Event[]> => {
  return EventRepository.findHistorical(organizationId);
};

/**
 * Updates an event
 */
export const updateEvent = async (
  eventId: string,
  data: UpdateEventDto
): Promise<Event> => {
  // Validate school_id is set when visibility is 'school'
  if (data.visibility === EVENT_VISIBILITY.SCHOOL && data.schoolId === undefined) {
    const event = await EventRepository.findById(eventId);
    if (!event?.schoolId) {
      throw new Error("schoolIdRequiredForSchoolVisibility");
    }
  }

  const updateData: Partial<Event> = {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.shortNote !== undefined && { shortNote: data.shortNote }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
    ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
    ...(data.price !== undefined && { price: data.price }),
    ...(data.currency !== undefined && { currency: data.currency }),
    ...(data.visibility !== undefined && { visibility: data.visibility }),
    ...(data.schoolId !== undefined && { schoolId: data.schoolId }),
    ...(data.status !== undefined && { status: data.status }),
  };

  const updated = await EventRepository.update(eventId, updateData);

  sync().catch((err) => {
    console.error("[updateEvent] Sync failed:", err);
  });

  return updated;
};

/**
 * Cancels an event (sets status to 'cancelled')
 * Use this instead of delete when event has paid participants
 */
export const cancelEvent = async (eventId: string): Promise<Event> => {
  const cancelled = await EventRepository.cancel(eventId);

  sync().catch((err) => {
    console.error("[cancelEvent] Sync failed:", err);
  });

  return cancelled;
};

/**
 * Deletes an event (soft delete)
 * Will throw an error if event has paid participants
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  // Check if event has paid participants
  const hasPaid = await EventParticipantRepository.hasPaidParticipants(eventId);
  if (hasPaid) {
    throw new Error("cannotDeleteEventWithPaidParticipants");
  }

  // Soft delete all participants first
  const participants = await EventParticipantRepository.findByEventId(eventId);
  for (const participant of participants) {
    await EventParticipantRepository.softDelete(participant.id);
  }

  // Soft delete the event
  await EventRepository.softDelete(eventId);

  sync().catch((err) => {
    console.error("[deleteEvent] Sync failed:", err);
  });
};

// ============================================================================
// Event Participants
// ============================================================================

/**
 * Upserts an event participant (creates or updates)
 *
 * @param data - Participant data
 * @returns Created or updated EventParticipant
 */
export const upsertEventParticipant = async (
  data: UpsertEventParticipantDto
): Promise<EventParticipant> => {
  const existing = await EventParticipantRepository.findByEventAndMember(
    data.eventId,
    data.schoolMemberId
  );

  let participant: EventParticipant;

  if (existing) {
    participant = await EventParticipantRepository.updateStatus(
      existing.id,
      data.status,
      data.statusChangedBy || ""
    );
  } else {
    participant = await EventParticipantRepository.create({
      eventId: data.eventId,
      schoolMemberId: data.schoolMemberId,
      status: data.status,
      statusChangedBy: data.statusChangedBy,
    });
  }

  sync().catch((err) => {
    console.error("[upsertEventParticipant] Sync failed:", err);
  });

  return participant;
};

/**
 * Gets all participants for an event
 */
export const getParticipantsForEvent = async (
  eventId: string
): Promise<EventParticipant[]> => {
  return EventParticipantRepository.findByEventId(eventId);
};

/**
 * Gets participant record for a specific member in an event
 */
export const getParticipantByEventAndMember = async (
  eventId: string,
  schoolMemberId: string
): Promise<EventParticipant | null> => {
  return EventParticipantRepository.findByEventAndMember(
    eventId,
    schoolMemberId
  );
};

/**
 * Updates participant status
 * For students: Can only change between 'absent' and 'attending'
 * For instructors: Can set any status including 'paid'
 */
export const updateParticipantStatus = async (
  participantId: string,
  status: EventParticipantStatus,
  changedBy: string,
  isInstructor: boolean = false
): Promise<EventParticipant> => {
  const participant = await EventParticipantRepository.findById(participantId);

  if (!participant) {
    throw new Error("participantNotFound");
  }

  // Students cannot change status if it's 'paid'
  if (!isInstructor && participant.status === EVENT_PARTICIPANT_STATUS.PAID) {
    throw new Error("cannotChangeLockedStatus");
  }

  // Students cannot set status to 'paid'
  if (!isInstructor && status === EVENT_PARTICIPANT_STATUS.PAID) {
    throw new Error("onlyInstructorCanSetPaid");
  }

  const updated = await EventParticipantRepository.updateStatus(
    participantId,
    status,
    changedBy
  );

  sync().catch((err) => {
    console.error("[updateParticipantStatus] Sync failed:", err);
  });

  return updated;
};

/**
 * Adds multiple participants to an event (whitelist functionality)
 */
export const addParticipantsToEvent = async (
  eventId: string,
  schoolMemberIds: string[]
): Promise<EventParticipant[]> => {
  const created = await EventParticipantRepository.createBatch(
    eventId,
    schoolMemberIds,
    EVENT_PARTICIPANT_STATUS.ABSENT
  );

  sync().catch((err) => {
    console.error("[addParticipantsToEvent] Sync failed:", err);
  });

  return created;
};

/**
 * Removes a participant from an event (soft delete)
 */
export const removeParticipant = async (participantId: string): Promise<void> => {
  const participant = await EventParticipantRepository.findById(participantId);

  if (!participant) {
    throw new Error("participantNotFound");
  }

  // Cannot remove if status is 'paid'
  if (participant.status === EVENT_PARTICIPANT_STATUS.PAID) {
    throw new Error("cannotRemovePaidParticipant");
  }

  await EventParticipantRepository.softDelete(participantId);

  sync().catch((err) => {
    console.error("[removeParticipant] Sync failed:", err);
  });
};

/**
 * Gets count of participants by status for an event
 */
export const getParticipantCounts = async (
  eventId: string
): Promise<{ absent: number; attending: number; paid: number }> => {
  const [absent, attending, paid] = await Promise.all([
    EventParticipantRepository.countByEventIdAndStatus(
      eventId,
      EVENT_PARTICIPANT_STATUS.ABSENT
    ),
    EventParticipantRepository.countByEventIdAndStatus(
      eventId,
      EVENT_PARTICIPANT_STATUS.ATTENDING
    ),
    EventParticipantRepository.countByEventIdAndStatus(
      eventId,
      EVENT_PARTICIPANT_STATUS.PAID
    ),
  ]);

  return { absent, attending, paid };
};

/**
 * Bulk save participant statuses for an event
 * Similar to bulkSaveAttendanceList in attendance module
 *
 * Atomic: all participants commit in a single database.batch(), or none do.
 */
export const bulkSaveParticipantStatuses = async (
  eventId: string,
  participantList: Array<{ participantId: string; status: EventParticipantStatus }>,
  changedBy: string
): Promise<void> => {
  const collection = database.get<EventParticipant>("event_participants");
  const participants = await Promise.all(
    participantList.map((item) => collection.find(item.participantId))
  );
  const statusByParticipantId = new Map(
    participantList.map((item) => [item.participantId, item.status])
  );

  const operations = participants.map((participant) =>
    participant.prepareUpdate((r) => {
      r.status = statusByParticipantId.get(r.id)!;
      r.statusChangedBy = changedBy;
    })
  );

  await database.write(async () => {
    if (operations.length > 0) {
      await database.batch(operations);
    }
  });

  sync().catch((err) => {
    console.error("[bulkSaveParticipantStatuses] Sync failed:", err);
  });
};
