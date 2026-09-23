import { useCallback, useEffect, useState } from "react";
import Event from "@/database/models/Event";
import { useStore } from "@/store";
import { EventRepository } from "../repositories";
import type { EventFilter } from "../types/enums";

/**
 * Hook for managing events list for an organization
 *
 * Features:
 * - Reactive to local database changes via repository
 * - Filter between upcoming and historical events
 * - Background sync with Supabase
 */
export const useEvents = (
  organizationId: string | undefined,
  filter: EventFilter = "upcoming"
) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { performSync } = useStore();

  // Subscribe to local database changes via repository
  useEffect(() => {
    if (!organizationId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    // Use appropriate observable based on filter
    const observable =
      filter === "upcoming"
        ? EventRepository.observeUpcoming(organizationId)
        : EventRepository.observeByOrganizationId(organizationId);

    const subscription = observable.subscribe({
      next: (result: Event[]) => {
        // For historical, filter to only past events
        if (filter === "historical") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const historicalEvents = result.filter(
            (event) => event.endDate < today
          );
          setEvents(historicalEvents);
        } else {
          setEvents(result);
        }
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useEvents] Observer error:", err);
        setError(t("errorLoadingFailed"));
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [organizationId, filter]);

  // Manual refresh - triggers global sync
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await performSync(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorLoadingFailed");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [performSync]);

  return {
    events,
    isLoading,
    error,
    refresh,
  };
};
