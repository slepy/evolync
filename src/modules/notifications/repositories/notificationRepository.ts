import { database } from "@/database";
import Notification from "@/database/models/Notification";
import { Q } from "@nozbe/watermelondb";

const collection = () => database.get<Notification>("notifications");

const liveForRecipient = (recipientId: string) => [
  Q.where("recipient_id", recipientId),
  Q.where("deleted_at", null),
];

/**
 * Notifications are created by the server and arrive through sync, so this
 * repository only reads them and sets `read_at`.
 */
export const NotificationRepository = {
  async findById(id: string): Promise<Notification | null> {
    try {
      return await collection().find(id);
    } catch {
      return null;
    }
  },

  /** Newest first; re-emits when a row is marked read or its payload changes. */
  observeByRecipient(recipientId: string) {
    return collection()
      .query(...liveForRecipient(recipientId), Q.sortBy("created_at", Q.desc))
      .observeWithColumns(["read_at", "payload", "updated_at"]);
  },

  observeUnreadCount(recipientId: string) {
    return collection()
      .query(...liveForRecipient(recipientId), Q.where("read_at", null))
      .observeCount();
  },

  async markRead(id: string): Promise<void> {
    const record = await collection().find(id);
    if (record.readAt) return;
    await database.write(async () => {
      await record.update((r) => {
        r.readAt = new Date();
      });
    });
  },

  /** Returns how many notifications were marked read. */
  async markAllRead(recipientId: string): Promise<number> {
    const unread = await collection()
      .query(...liveForRecipient(recipientId), Q.where("read_at", null))
      .fetch();
    if (unread.length === 0) return 0;

    const now = new Date();
    await database.write(async () => {
      await database.batch(
        unread.map((record) =>
          record.prepareUpdate((r) => {
            r.readAt = now;
          }),
        ),
      );
    });
    return unread.length;
  },
};
