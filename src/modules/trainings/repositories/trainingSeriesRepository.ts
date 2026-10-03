import { database } from "@/database";
import TrainingSeries from "@/database/models/TrainingSeries";
import { v4 as uuidv4 } from "uuid";

const series = () => database.get<TrainingSeries>("training_series");

export const TrainingSeriesRepository = {
  prepareCreate(data: Partial<TrainingSeries>): TrainingSeries {
    return series().prepareCreate((record) => {
      record._raw.id = uuidv4();
      Object.assign(record, data);
    });
  },

  prepareUpdate(record: TrainingSeries, data: Partial<TrainingSeries>): TrainingSeries {
    return record.prepareUpdate((r) => {
      Object.assign(r, data);
    });
  },

  async findById(id: string): Promise<TrainingSeries | null> {
    try {
      const record = await series().find(id);
      return record.deletedAt ? null : record;
    } catch {
      return null;
    }
  },

  observeById(id: string) {
    return series().findAndObserve(id);
  },
};
