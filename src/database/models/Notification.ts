import { Model } from "@nozbe/watermelondb";
import { date, field, json, readonly } from "@nozbe/watermelondb/decorators";

const sanitizePayload = (raw: unknown): Record<string, unknown> =>
  raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};

export default class Notification extends Model {
  static table = "notifications";

  @field("recipient_id") recipientId!: string;
  @field("school_id") schoolId?: string;
  @field("type") type!: string;
  @field("entity_type") entityType!: string;
  @field("entity_id") entityId!: string;
  @json("payload", sanitizePayload) payload!: Record<string, unknown>;
  @date("read_at") readAt?: Date | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;

  get isRead(): boolean {
    return !!this.readAt;
  }
}
