import { useEffect, useState } from "react";
import type BodyPosePreset from "@/database/models/BodyPosePreset";
import { BodyPosePresetRepository } from "../repositories";
import { useStore } from "@/store";

export const useHandPresetsByUserAndSide = (handSide: "L" | "R") => {
  const [presets, setPresets] = useState<BodyPosePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useStore();

  useEffect(() => {
    if (!user) {
      setPresets([]);
      setIsLoading(false);
      return;
    }

    const subscription = BodyPosePresetRepository.observeByUserIdAndBodyPartType(
      user.id,
      "hand"
    ).subscribe({
      next: (result: BodyPosePreset[]) => {
        // Filter presets by checking which hand bones are in the preset data
        const filtered = result.filter((preset) => {
          try {
            const data = preset.presetData;
            // Check if preset contains bones for the selected hand side
            // Hand bones follow pattern: DEF-handL, DEF-handR, DEF-fingerLIndex1, DEF-fingerRIndex1, etc.
            const bonesInPreset = Object.keys(data);
            const hasRightBones = bonesInPreset.some((bone) =>
              bone.includes("R")
            );
            const hasLeftBones = bonesInPreset.some((bone) =>
              bone.includes("L")
            );

            // If preset has right-side bones and we're looking for right side, include it
            if (handSide === "R" && hasRightBones) return true;
            // If preset has left-side bones and we're looking for left side, include it
            if (handSide === "L" && hasLeftBones) return true;

            return false;
          } catch {
            return false;
          }
        });

        setPresets(filtered);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useHandPresetsByUserAndSide] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user, handSide]);

  return { presets, isLoading };
};
