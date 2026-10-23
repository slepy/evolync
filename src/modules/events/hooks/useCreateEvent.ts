import { useCallback, useState } from "react";
import Event from "@/database/models/Event";
import { useStore } from "@/store";
import { createEvent, addParticipantsToEvent } from "../services";
import { SchoolRepository } from "@/modules/school/repositories";
import { StudentRepository } from "@/modules/students/repositories";
import type { CreateEventDto } from "../types/dto";
import type { CreateEventFormValues } from "../validation";

/**
 * Hook for creating a new event
 *
 * Features:
 * - Creates event with validation
 * - Optionally adds initial participants (whitelist)
 * - Returns created event
 */
export const useCreateEvent = (organizationId: string | undefined) => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useStore();

  const handleCreate = useCallback(
    async (
      formData: CreateEventFormValues,
      whitelistMemberIds?: string[]
    ): Promise<Event> => {
      if (!organizationId) {
        throw new Error("eventsErrorNoOrganization");
      }

      if (!user?.id) {
        throw new Error("eventsErrorNoUser");
      }

      try {
        setIsCreating(true);
        setError(null);

        const dto: CreateEventDto = {
          organizationId,
          schoolId: formData.schoolId,
          name: formData.name,
          typeId: formData.typeId,
          shortNote: formData.shortNote,
          address: formData.address,
          startDate: formData.startDate,
          endDate: formData.endDate,
          price: formData.price,
          currency: formData.currency,
          visibility: formData.visibility,
          createdBy: user.id,
          examsPlanned: formData.examsPlanned,
        };

        const event = await createEvent(dto);

        // Add participants based on visibility type
        let participantMemberIds: string[] = [];

        if (formData.visibility === "organization") {
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
          await addParticipantsToEvent(event.id, participantMemberIds);
        }

        return event;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errorCreateFailed");
        setError(message);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [organizationId, user?.id]
  );

  return {
    create: handleCreate,
    isCreating,
    error,
  };
};
