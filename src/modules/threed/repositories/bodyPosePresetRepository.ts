import { database } from "@/database";
import BodyPosePreset from "@/database/models/BodyPosePreset";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const BodyPosePresetRepository = {
  async create(data: {
    userId: string;
    name: string;
    bodyPartType: string;
    data: string;
  }): Promise<BodyPosePreset> {
    const collection = database.get<BodyPosePreset>("body_pose_presets");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        record.userId = data.userId;
        record.name = data.name;
        record.bodyPartType = data.bodyPartType;
        record.data = data.data;
      });
    });
  },

  async findByUserId(userId: string): Promise<BodyPosePreset[]> {
    const collection = database.get<BodyPosePreset>("body_pose_presets");
    return await collection
      .query(
        Q.where("user_id", userId),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async findByBodyPartType(bodyPartType: string): Promise<BodyPosePreset[]> {
    const collection = database.get<BodyPosePreset>("body_pose_presets");
    return await collection
      .query(
        Q.where("body_part_type", bodyPartType),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async findByUserIdAndBodyPartType(
    userId: string,
    bodyPartType: string
  ): Promise<BodyPosePreset[]> {
    const collection = database.get<BodyPosePreset>("body_pose_presets");
    return await collection
      .query(
        Q.where("user_id", userId),
        Q.where("body_part_type", bodyPartType),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  observeByUserId(userId: string) {
    const collection = database.get<BodyPosePreset>("body_pose_presets");
    return collection
      .query(
        Q.where("user_id", userId),
        Q.where("deleted_at", null)
      )
      .observe();
  },

  observeByBodyPartType(bodyPartType: string) {
    const collection = database.get<BodyPosePreset>("body_pose_presets");
    return collection
      .query(
        Q.where("body_part_type", bodyPartType),
        Q.where("deleted_at", null)
      )
      .observe();
  },

  observeByUserIdAndBodyPartType(userId: string, bodyPartType: string) {
    const collection = database.get<BodyPosePreset>("body_pose_presets");
    return collection
      .query(
        Q.where("user_id", userId),
        Q.where("body_part_type", bodyPartType),
        Q.where("deleted_at", null)
      )
      .observe();
  },
};
