import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import Notification from "@/database/models/Notification";
import { NotificationRepository } from "../repositories";

const ME = "user-me";
const OTHER = "user-other";

let seq = 0;
async function seed(overrides: Partial<Record<string, unknown>> = {}) {
  seq += 1;
  const now = Date.now() + seq;
  await database.write(async () => {
    await database.get<Notification>("notifications").create((record) => {
      record._raw = {
        ...record._raw,
        id: `n${seq}`,
        recipient_id: ME,
        school_id: "school-1",
        type: "payment_created",
        entity_type: "payment_record",
        entity_id: `entity-${seq}`,
        payload: JSON.stringify({ amount: 150, currency: "PLN" }),
        read_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        ...overrides,
      } as any;
    });
  });
  return `n${seq}`;
}

/** Collects every value an observable emits until `stop()` is called. */
function record<T>(observable: { subscribe: (fn: (v: T) => void) => { unsubscribe: () => void } }) {
  const values: T[] = [];
  const subscription = observable.subscribe((v) => values.push(v));
  return { values, stop: () => subscription.unsubscribe() };
}

// observeCount() is throttled (~250ms), so give emissions time to land.
const flush = () => new Promise((resolve) => setTimeout(resolve, 300));

describe("NotificationRepository", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
  });

  afterEach(async () => {
    await flush();
  });

  it("counts only the recipient's live unread notifications", async () => {
    await seed();
    await seed();
    await seed({ read_at: Date.now() });
    await seed({ deleted_at: Date.now() });
    await seed({ recipient_id: OTHER });

    const count = record<number>(NotificationRepository.observeUnreadCount(ME));
    await flush();
    count.stop();

    assert.equal(count.values.at(-1), 2);
  });

  it("updates the unread count reactively on insert and markRead", async () => {
    const first = await seed();
    const count = record<number>(NotificationRepository.observeUnreadCount(ME));
    await flush();
    assert.equal(count.values.at(-1), 1);

    await seed();
    await flush();
    assert.equal(count.values.at(-1), 2);

    await NotificationRepository.markRead(first);
    await flush();
    count.stop();
    assert.equal(count.values.at(-1), 1);
  });

  it("markAllRead marks only the recipient's unread rows", async () => {
    await seed();
    await seed();
    const theirs = await seed({ recipient_id: OTHER });

    const marked = await NotificationRepository.markAllRead(ME);
    assert.equal(marked, 2);

    const other = await NotificationRepository.findById(theirs);
    assert.equal(other?.readAt ?? null, null);
    assert.equal(await NotificationRepository.markAllRead(ME), 0);
  });

  it("softDelete hides the row from the list and the unread count", async () => {
    const kept = await seed();
    const removed = await seed();

    const list = record<Notification[]>(NotificationRepository.observeByRecipient(ME));
    const count = record<number>(NotificationRepository.observeUnreadCount(ME));
    await flush();
    assert.equal(count.values.at(-1), 2);

    await NotificationRepository.softDelete(removed);
    await flush();
    list.stop();
    count.stop();

    assert.deepEqual(list.values.at(-1)!.map((n) => n.id), [kept]);
    assert.equal(count.values.at(-1), 1);

    const row = await NotificationRepository.findById(removed);
    assert.ok(row?.deletedAt, "soft delete keeps the row with deleted_at for sync");
    assert.notEqual(row?._raw._status, "deleted", "pushed as an update, not a deleted id");
  });

  it("softDelete keeps the first deletion time", async () => {
    const id = await seed({ deleted_at: 1_000 });
    await NotificationRepository.softDelete(id);
    const row = await NotificationRepository.findById(id);
    assert.equal(row?.deletedAt?.getTime(), 1_000);
  });

  it("softDeleteAll removes only the recipient's live rows", async () => {
    await seed();
    await seed({ read_at: Date.now() });
    const gone = await seed({ deleted_at: 1_000 });
    const theirs = await seed({ recipient_id: OTHER });

    assert.equal(await NotificationRepository.softDeleteAll(ME), 2);

    const list = record<Notification[]>(NotificationRepository.observeByRecipient(ME));
    await flush();
    list.stop();
    assert.deepEqual(list.values.at(-1), []);

    assert.equal((await NotificationRepository.findById(gone))?.deletedAt?.getTime(), 1_000);
    assert.equal((await NotificationRepository.findById(theirs))?.deletedAt ?? null, null);
    assert.equal(await NotificationRepository.softDeleteAll(ME), 0);
  });

  it("lists the recipient's notifications newest first with parsed payload", async () => {
    const older = await seed({ created_at: 1_000 });
    const newer = await seed({ created_at: 2_000 });
    await seed({ recipient_id: OTHER });

    const list = record<Notification[]>(NotificationRepository.observeByRecipient(ME));
    await flush();
    list.stop();

    const latest = list.values.at(-1)!;
    assert.deepEqual(latest.map((n) => n.id), [newer, older]);
    assert.deepEqual(latest[0].payload, { amount: 150, currency: "PLN" });
  });
});
