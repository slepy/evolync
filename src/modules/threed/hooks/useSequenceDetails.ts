import type Sequence from "@/database/models/Sequence";
import { useEntityTags } from "@/modules/tags";
import { useEffect, useState } from "react";
import { SequenceRepository } from "../repositories";
import { useSequenceSteps } from "./useSequenceSteps";

/** One sequence with its tags and steps (D6); reactive. `sequence` is null once deleted or missing. */
export const useSequenceDetails = (sequenceId: string | undefined) => {
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [sequenceLoading, setSequenceLoading] = useState(true);
  const { tags, tagIds, isLoading: tagsLoading } = useEntityTags(sequenceId, "threed_sequence");
  const { steps, isLoading: stepsLoading } = useSequenceSteps(sequenceId);

  useEffect(() => {
    if (!sequenceId) {
      setSequence(null);
      setSequenceLoading(false);
      return;
    }
    const subscription = SequenceRepository.observeById(sequenceId).subscribe({
      next: (record: Sequence) => {
        setSequence(record.deletedAt ? null : record);
        setSequenceLoading(false);
      },
      error: (err: Error) => {
        console.error("[useSequenceDetails] Error:", err);
        setSequence(null);
        setSequenceLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [sequenceId]);

  return { sequence, tags, tagIds, steps, isLoading: sequenceLoading || tagsLoading || stepsLoading };
};
