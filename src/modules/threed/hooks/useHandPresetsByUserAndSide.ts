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
        // Hand and finger bones end in their side: DEF-handR, DEF-f_index01R…
        const filtered = result.filter((preset) => {
          try {
            return Object.keys(preset.presetData).some((bone) => bone.endsWith(handSide));
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
