import { useEffect, useState } from "react";
import { useStore } from "@/store";
import type Technique from "@/database/models/Technique";
import { TechniqueRepository } from "../repositories";

export const useStartingPositions = () => {
  const { user } = useStore();
  const [positions, setPositions] = useState<Technique[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPositions([]);
      setIsLoading(false);
      return;
    }

    const subscription = TechniqueRepository.observeStartingPositionsByUserId(
      user.id
    ).subscribe({
      next: (result: Technique[]) => {
        setPositions(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useStartingPositions] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  return { positions, isLoading };
};
