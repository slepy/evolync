import { sync } from "@/database/sync";
import type EventType from "@/database/models/EventType";
import { EventTypeRepository } from "../repositories/eventTypeRepository";
import type { CreateEventTypeDto } from "../types/dto";
import { eventTypeSchema, isEventTypeNameTaken } from "../validation/eventTypeSchema";

/** Thrown when a type that events still use is deleted ("This type is used by N events"). */
export class EventTypeInUseError extends Error {
  constructor(readonly count: number) {
    super("eventTypeInUse");
    this.name = "EventTypeInUseError";
  }
}

/** Trimmed, valid and unique name; throws the translation key of the problem. */
const checkedName = async (organizationId: string, name: string, exceptId?: string): Promise<string> => {
  const parsed = eventTypeSchema.safeParse({ name });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "nameRequired");
  const types = await EventTypeRepository.findByOrganizationId(organizationId);
  if (isEventTypeNameTaken(parsed.data.name, types, exceptId)) throw new Error("eventTypeValidationNameTaken");
  return parsed.data.name;
};

export const createEventType = async (data: CreateEventTypeDto): Promise<EventType> => {
  const name = await checkedName(data.organizationId, data.name);
  const type = await EventTypeRepository.create({ ...data, name });
  sync().catch((err) => console.error("[createEventType] Sync failed:", err));
  return type;
};

export const renameEventType = async (id: string, name: string): Promise<EventType> => {
  const current = await EventTypeRepository.findById(id);
  if (!current || current.deletedAt) throw new Error("eventTypeNotFound");
  const checked = await checkedName(current.organizationId, name, id);
  const type = await EventTypeRepository.update(id, { name: checked });
  sync().catch((err) => console.error("[renameEventType] Sync failed:", err));
  return type;
};

/** Soft delete; a type still used by an event is kept (throws `EventTypeInUseError`). */
export const deleteEventType = async (id: string): Promise<void> => {
  const count = await EventTypeRepository.countActiveEvents(id);
  if (count > 0) throw new EventTypeInUseError(count);
  await EventTypeRepository.softDelete(id);
  sync().catch((err) => console.error("[deleteEventType] Sync failed:", err));
};
