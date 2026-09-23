import { useEffect, useState } from "react";
import Event from "@/database/models/Event";
import { EventRepository } from "../repositories";

/**
 * Hook for observing a single event by ID
 *
 * Features:
 * - Reactive to local database changes
 * - Returns null if event not found or deleted
 */
export const useEvent = (eventId: string | undefined) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setIsLoading(false);
      return;
    }

    const subscription = EventRepository.observeById(eventId).subscribe({
      next: (result: Event) => {
        // Check if event is soft-deleted
        if (result.deletedAt) {
          setEvent(null);
        } else {
          setEvent(result);
        }
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useEvent] Observer error:", err);
        setError(t("errorLoadingFailed"));
        setEvent(null);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [eventId]);

  return {
    event,
    isLoading,
    error,
  };
};
