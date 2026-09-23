import { useEffect, useState } from "react";
import { useStore } from "@/store";
import type Sequence from "@/database/models/Sequence";
import { SequenceRepository } from "../repositories";

export const useSequences = () => {
  const { user } = useStore();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSequences([]);
      setIsLoading(false);
      return;
    }

    const subscription = SequenceRepository.observeByUserId(
      user.id
    ).subscribe({
      next: (result: Sequence[]) => {
        setSequences(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useSequences] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  return { sequences, isLoading };
};
