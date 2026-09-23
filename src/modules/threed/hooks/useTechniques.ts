import { useEffect, useState } from "react";
import { useStore } from "@/store";
import type Technique from "@/database/models/Technique";
import { TechniqueRepository } from "../repositories";

export const useTechniques = () => {
  const { user } = useStore();
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTechniques([]);
      setIsLoading(false);
      return;
    }

    const subscription = TechniqueRepository.observeTechniquesByUserIdExcludingFullbody(
      user.id
    ).subscribe({
      next: (result: Technique[]) => {
        setTechniques(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useTechniques] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  return { techniques, isLoading };
};
