import { useEffect, useState } from "react";
import { EventParticipantRepository } from "../repositories";

/** Member ids taking part in an event (the edit form's selected members), with a loaded flag. */
export const useEventParticipantIds = (eventId: string | undefined) => {
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setMemberIds([]);
      setIsLoading(false);
      return;
    }
    const subscription = EventParticipantRepository.observeByEventId(eventId).subscribe({
      next: (participants) => {
        setMemberIds(participants.map((p) => p.schoolMemberId));
        setIsLoading(false);
      },
      error: (err) => {
        console.error("[useEventParticipantIds] Observer error:", err);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [eventId]);

  return { memberIds, isLoading };
};
