import { useEffect, useState } from "react";
import type SequenceStep from "@/database/models/SequenceStep";
import { SequenceStepRepository } from "../repositories";

export const useSequenceSteps = (sequenceId: string | undefined) => {
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sequenceId) {
      setSteps([]);
      setIsLoading(false);
      return;
    }

    const subscription = SequenceStepRepository.observeBySequenceId(
      sequenceId
    ).subscribe({
      next: (result: SequenceStep[]) => {
        setSteps(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useSequenceSteps] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [sequenceId]);

  return { steps, isLoading };
};
