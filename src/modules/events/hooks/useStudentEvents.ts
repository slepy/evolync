import { useEffect, useState } from "react";
import Event from "@/database/models/Event";
import { EVENT_STATUS } from "@/database/models/Event";
import EventParticipant from "@/database/models/EventParticipant";
import { EventParticipantRepository } from "../repositories";
import { EventRepository } from "../repositories";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";

/**
 * Event with participant status for a specific student
 */
export interface StudentEvent {
  event: Event;
  participantStatus: EventParticipantStatus;
  participantId: string;
}

/**
 * Hook for loading events that a specific student is assigned to
 *
 * Features:
 * - Reactive to local database changes (an instructor changing this student's
 *   participation status elsewhere updates this list live, no remount needed)
 * - Returns events with participant status
 * - Optional filtering of cancelled events
 * - Sorted by start date (most recent first)
 * - Component should handle upcoming/historical filtering
 */
export const useStudentEvents = (
  studentId: string | undefined,
  options?: { includeCancelled?: boolean }
) => {
  const [events, setEvents] = useState<StudentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const subscription = EventParticipantRepository.observeByMemberId(
      studentId,
    ).subscribe(async (participants: EventParticipant[]) => {
      try {
        if (participants.length === 0) {
          setEvents([]);
          setIsLoading(false);
          return;
        }

        // Load all events for these participants
        const eventIds = participants.map((p) => p.eventId);
        const loadedEvents = await EventRepository.findByIds(eventIds);

        // Create map for quick lookup
        const eventById = new Map(loadedEvents.map((e) => [e.id, e]));

        // Combine participant data with events
        const studentEvents: StudentEvent[] = participants
          .map((participant) => {
            const event = eventById.get(participant.eventId);
            if (!event) return null;

            // Filter out cancelled events unless explicitly included
            if (!options?.includeCancelled && event.status === EVENT_STATUS.CANCELLED) {
              return null;
            }

            return {
              event,
              participantStatus: participant.status,
              participantId: participant.id,
            };
          })
          .filter((item): item is StudentEvent => item !== null);

        // Sort by start date (most recent first)
        studentEvents.sort(
          (a, b) => b.event.startDate.getTime() - a.event.startDate.getTime()
        );

        setEvents(studentEvents);
      } catch (error) {
        console.error("[useStudentEvents] Error loading events:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [studentId, options?.includeCancelled]);

  return {
    events,
    isLoading,
  };
};
