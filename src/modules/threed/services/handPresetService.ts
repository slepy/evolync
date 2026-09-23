import { sync } from "@/database/sync";
import { BodyPosePresetRepository } from "../repositories";
import type { BoneTransformMap } from "../types/fk";
import { FK_BODY_GROUPS } from "../types/fk";

/**
 * Save hand preset (all finger bones from a specific hand)
 */
export const saveHandPreset = async (
  userId: string,
  presetName: string,
  boneTransforms: BoneTransformMap,
  handSide: "L" | "R"
): Promise<void> => {
  try {
    if (!presetName.trim()) {
      throw new Error("handPresetNameEmpty");
    }

    // Get all bones for the hand (includes main hand bone and all fingers)
    const handBones =
      handSide === "L" ? FK_BODY_GROUPS.leftHand : FK_BODY_GROUPS.rightHand;

    // Extract transforms for these bones
    // Include all hand bones: those with transforms AND those at identity
    const handData: BoneTransformMap = {};
    for (const boneName of handBones) {
      if (boneName in boneTransforms) {
        handData[boneName] = boneTransforms[boneName];
      } else {
        // Include bone with identity transform even if not modified
        // This ensures preset captures complete hand structure
        handData[boneName] = {
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        };
      }
    }

    // Save to database
    await BodyPosePresetRepository.create({
      userId,
      name: presetName,
      bodyPartType: "hand",
      data: JSON.stringify(handData),
    });

    // Trigger sync
    sync().catch(console.error);
  } catch (err) {
    console.error("[handPresetService] Error saving preset:", err);
    throw err;
  }
};
