import { database } from "@/database";
import SequenceStep from "@/database/models/SequenceStep";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const SequenceStepRepository = {
  async create(data: Partial<SequenceStep>): Promise<SequenceStep> {
    const collection = database.get<SequenceStep>("sequence_steps");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string): Promise<SequenceStep | null> {
    const collection = database.get<SequenceStep>("sequence_steps");
    try {
      const record = await collection.find(id);
      if (record.deletedAt) return null;
      return record;
    } catch {
      return null;
    }
  },

  async findBySequenceId(sequenceId: string): Promise<SequenceStep[]> {
    const collection = database.get<SequenceStep>("sequence_steps");
    return await collection
      .query(
        Q.where("sequence_id", sequenceId),
        Q.where("deleted_at", null),
        Q.sortBy("order_index", Q.asc)
      )
      .fetch();
  },

  async update(
    id: string,
    data: Partial<SequenceStep>
  ): Promise<SequenceStep> {
    const collection = database.get<SequenceStep>("sequence_steps");
    const record = await collection.find(id);
    return await database.write(async () => {
      return await record.update((r) => {
        Object.assign(r, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<SequenceStep>("sequence_steps");
    const record = await collection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  async softDeleteBySequenceId(sequenceId: string): Promise<void> {
    const collection = database.get<SequenceStep>("sequence_steps");
    const records = await collection
      .query(Q.where("sequence_id", sequenceId))
      .fetch();

    await database.write(async () => {
      const operations = records.map((record) =>
        record.prepareUpdate((r) => {
          r.deletedAt = new Date();
        })
      );
      if (operations.length > 0) {
        await database.batch(operations);
      }
    });
  },

  observeBySequenceId(sequenceId: string) {
    const collection = database.get<SequenceStep>("sequence_steps");
    return collection
      .query(
        Q.where("sequence_id", sequenceId),
        Q.where("deleted_at", null),
        Q.sortBy("order_index", Q.asc)
      )
      .observe();
  },

  /** Every live step (the local database holds only the user's own sequences); for step counts. */
  observeAll() {
    const collection = database.get<SequenceStep>("sequence_steps");
    return collection.query(Q.where("deleted_at", null)).observeWithColumns(["sequence_id"]);
  },

  async getNextOrderIndex(sequenceId: string): Promise<number> {
    const steps = await this.findBySequenceId(sequenceId);
    if (steps.length === 0) return 0;
    return steps[steps.length - 1].orderIndex + 1;
  },
};
