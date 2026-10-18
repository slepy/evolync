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
        // A capital L / R marks the side in both bone namings: DEF-f_index01R
        // now, DEF-fingerRIndex1 in older presets (so not endsWith).
        const filtered = result.filter((preset) => {
          try {
            return Object.keys(preset.presetData).some((bone) => bone.includes(handSide));
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
