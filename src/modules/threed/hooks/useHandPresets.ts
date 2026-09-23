import { useEffect, useState } from "react";
import type BodyPosePreset from "@/database/models/BodyPosePreset";
import { BodyPosePresetRepository } from "../repositories";

export const useHandPresets = () => {
  const [presets, setPresets] = useState<BodyPosePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const subscription = BodyPosePresetRepository.observeByBodyPartType(
      "hand"
    ).subscribe({
      next: (result: BodyPosePreset[]) => {
        setPresets(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useHandPresets] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  return { presets, isLoading };
};
