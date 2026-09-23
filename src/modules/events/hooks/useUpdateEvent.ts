import { useCallback, useState } from "react";
import Event from "@/database/models/Event";
import { updateEvent, cancelEvent, deleteEvent, addParticipantsToEvent } from "../services";
import { SchoolRepository } from "@/modules/school/repositories";
import { StudentRepository } from "@/modules/students/repositories";
import type { UpdateEventDto } from "../types/dto";
import type { UpdateEventFormValues } from "../validation";

/**
 * Hook for updating an existing event
 *
 * Features:
 * - Update event details
 * - Update participants based on visibility
 * - Cancel event (with paid participants)
 * - Delete event (without paid participants)
 */
export const useUpdateEvent = (eventId: string | undefined, organizationId?: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update event details
  const handleUpdate = useCallback(
    async (formData: UpdateEventFormValues, whitelistMemberIds?: string[]): Promise<Event> => {
      if (!eventId) {
        throw new Error("eventsErrorNoEvent");
      }

      try {
        setIsUpdating(true);
        setError(null);

        const dto: UpdateEventDto = {
          name: formData.name,
          shortNote: formData.shortNote,
          address: formData.address,
          startDate: formData.startDate,
          endDate: formData.endDate,
          price: formData.price,
          currency: formData.currency,
          visibility: formData.visibility,
          schoolId: formData.schoolId,
          status: formData.status,
        };

        const event = await updateEvent(eventId, dto);

        // Add participants based on visibility type (handles duplicates automatically)
        let participantMemberIds: string[] = [];

        if (formData.visibility === "organization" && organizationId) {
          // Add all members from all schools in the organization
          const schools = await SchoolRepository.findByOrganizationId(organizationId);
          const schoolIds = schools.map((s) => s.id);
          if (schoolIds.length > 0) {
            const members = await StudentRepository.findActiveBySchoolIds(schoolIds);
            participantMemberIds = members.map((m) => m.id);
          }
        } else if (formData.visibility === "school" && formData.schoolId) {
          // Add all members from the selected school
          const members = await StudentRepository.findActiveBySchoolId(formData.schoolId);
          participantMemberIds = members.map((m) => m.id);
        } else if (
          formData.visibility === "whitelist" &&
          whitelistMemberIds &&
          whitelistMemberIds.length > 0
        ) {
          // Add only whitelisted members
          participantMemberIds = whitelistMemberIds;
        }

        // Create participant records if there are any members to add
        if (participantMemberIds.length > 0) {
          await addParticipantsToEvent(eventId, participantMemberIds);
        }

        return event;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errorUpdateFailed");
        setError(message);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [eventId, organizationId]
  );

  // Cancel event (soft cancel - sets status to 'cancelled')
  const handleCancel = useCallback(async (): Promise<Event> => {
    if (!eventId) {
      throw new Error("eventsErrorNoEvent");
    }

    try {
      setIsUpdating(true);
      setError(null);
      return await cancelEvent(eventId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorUpdateFailed");
      setError(message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [eventId]);

  // Delete event (only if no paid participants)
  const handleDelete = useCallback(async (): Promise<void> => {
    if (!eventId) {
      throw new Error("eventsErrorNoEvent");
    }

    try {
      setIsUpdating(true);
      setError(null);
      await deleteEvent(eventId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorDeleteFailed");
      setError(message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [eventId]);

  return {
    update: handleUpdate,
    cancel: handleCancel,
    delete: handleDelete,
    isUpdating,
    error,
  };
};
