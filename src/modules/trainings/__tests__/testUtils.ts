import { database } from "@/database";

let seq = 0;

/** Inserts a raw row (snake_case columns) into a table and returns its id. */
export async function seedRow(table: string, row: Record<string, unknown>): Promise<string> {
  seq += 1;
  const id = (row.id as string) ?? `${table}-${seq}`;
  const now = Date.now();
  await database.write(async () => {
    await database.get(table).create((record) => {
      record._raw = {
        ...record._raw,
        id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        ...row,
      } as any;
    });
  });
  return id;
}

export const seedTraining = (row: Record<string, unknown>) =>
  seedRow("trainings", {
    organization_id: "org-1",
    school_id: null,
    series_id: null,
    name: "Training",
    date: Date.UTC(2099, 0, 5),
    start_time: "18:00",
    end_time: "19:00",
    location: null,
    visibility: "organization",
    status: "active",
    created_by: "owner",
    ...row,
  });

export const seedMember = (id: string, schoolId: string) =>
  seedRow("school_members", { id, school_id: schoolId, display_name: id, status: "active" });

/** Collects observable emissions. */
export function record<T>(observable: { subscribe: (fn: (v: T) => void) => { unsubscribe: () => void } }) {
  const values: T[] = [];
  const subscription = observable.subscribe((v) => values.push(v));
  return { values, last: () => values.at(-1) as T, stop: () => subscription.unsubscribe() };
}

export const flush = () => new Promise((resolve) => setTimeout(resolve, 50));

export const resetDatabase = () => database.write(() => database.unsafeResetDatabase());
