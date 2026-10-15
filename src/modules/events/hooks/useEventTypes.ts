import type EventType from "@/database/models/EventType";
import { useStore } from "@/store";
import { useEffect, useState } from "react";
import { EventTypeRepository } from "../repositories";

/** The organization's event types by name; defaults to the signed-in owner's organization. */
export const useEventTypes = (organizationId?: string) => {
  const ownOrganizationId = useStore((s) => s.organization?.id);
  const orgId = organizationId ?? ownOrganizationId;
  const [types, setTypes] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setTypes([]);
      setIsLoading(false);
      return;
    }
    const subscription = EventTypeRepository.observeByOrganizationId(orgId).subscribe({
      next: (rows) => {
        setTypes(rows);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useEventTypes] Observer error:", err);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [orgId]);

  return { types, isLoading };
};

/** Name of one type for display (deleted types included); undefined while unknown. */
export const useEventTypeName = (typeId: string | undefined | null) => {
  const [name, setName] = useState<string | undefined>();

  useEffect(() => {
    if (!typeId) {
      setName(undefined);
      return;
    }
    const subscription = EventTypeRepository.observeByIds([typeId]).subscribe({
      next: (rows) => setName(rows[0]?.name),
      error: (err: Error) => console.error("[useEventTypeName] Observer error:", err),
    });
    return () => subscription.unsubscribe();
  }, [typeId]);

  return name;
};
