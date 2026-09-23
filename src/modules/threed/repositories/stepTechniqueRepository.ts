import { database } from "@/database";
import StepTechnique from "@/database/models/StepTechnique";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const StepTechniqueRepository = {
  async create(data: Partial<StepTechnique>): Promise<StepTechnique> {
    const collection = database.get<StepTechnique>("step_techniques");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findByStepId(stepId: string): Promise<StepTechnique[]> {
    const collection = database.get<StepTechnique>("step_techniques");
    return await collection
      .query(
        Q.where("step_id", stepId),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async update(
    id: string,
    data: Partial<StepTechnique>
  ): Promise<StepTechnique> {
    const collection = database.get<StepTechnique>("step_techniques");
    const record = await collection.find(id);
    return await database.write(async () => {
      return await record.update((r) => {
        Object.assign(r, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<StepTechnique>("step_techniques");
    const record = await collection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  async softDeleteByStepId(stepId: string): Promise<void> {
    const collection = database.get<StepTechnique>("step_techniques");
    const records = await collection
      .query(Q.where("step_id", stepId))
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
};
