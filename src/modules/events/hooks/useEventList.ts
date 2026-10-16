import type Event from "@/database/models/Event";
import { dayToTimestamp, isValidDay } from "@/modules/trainings/types/helpers";
import { useEffect, useMemo, useState } from "react";
import { EventRepository } from "../repositories";
import { useEventTypes } from "./useEventTypes";

/**
 * Events of the organization overlapping FROM–TO ("YYYY-MM-DD", cancelled
 * included) and the organization's types, for the calendar's List view.
 */
export const useEventList = (organizationId: string | undefined, from: string, to: string) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { types, isLoading: typesLoading } = useEventTypes(organizationId);

  useEffect(() => {
    if (!organizationId || !isValidDay(from) || !isValidDay(to)) {
      setEvents([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const subscription = EventRepository.observeInRangeByOrganization(
      organizationId,
      dayToTimestamp(from),
      dayToTimestamp(to),
    ).subscribe({
      next: (rows) => {
        setEvents(rows);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useEventList] Observer error:", err);
        setEvents([]);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [organizationId, from, to]);

  const typeNames = useMemo(() => new Map(types.map((type) => [type.id, type.name])), [types]);

  return { events, types, typeNames, isLoading: isLoading || typesLoading };
};
