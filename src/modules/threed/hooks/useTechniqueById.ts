import { useEffect, useState } from "react";
import type Technique from "@/database/models/Technique";
import { TechniqueRepository } from "../repositories";

export const useTechniqueById = (id: string) => {
  const [technique, setTechnique] = useState<Technique | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    TechniqueRepository.findById(id)
      .then((result) => {
        setTechnique(result);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("[useTechniqueById] Error:", err);
        setIsLoading(false);
      });
  }, [id]);

  return { technique, isLoading };
};
