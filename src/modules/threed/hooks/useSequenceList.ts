import type Sequence from "@/database/models/Sequence";
import type SequenceStep from "@/database/models/SequenceStep";
import type Tag from "@/database/models/Tag";
import type Taggable from "@/database/models/Taggable";
import { TagRepository, TaggableRepository, tagsByEntity } from "@/modules/tags";
import { useStore } from "@/store";
import { useEffect, useState } from "react";
import { combineLatest } from "rxjs";
import { countStepsBySequence, type SequenceListItem } from "../library";
import { SequenceRepository, SequenceStepRepository } from "../repositories";

/** The user's 3D sequences with their step counts and tags (D2); reactive. */
export const useSequenceList = () => {
  const userId = useStore((s) => s.user?.id);
  const [sequences, setSequences] = useState<SequenceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSequences([]);
      setIsLoading(false);
      return;
    }

    const subscription = combineLatest([
      SequenceRepository.observeByUserId(userId),
      SequenceStepRepository.observeAll(),
      TagRepository.observeByUserId(userId),
      TaggableRepository.observeByType("threed_sequence"),
    ]).subscribe({
      next: ([records, steps, tagRecords, links]: [Sequence[], SequenceStep[], Tag[], Taggable[]]) => {
        const counts = countStepsBySequence(steps);
        const bySequence = tagsByEntity(links, tagRecords.map((tag) => ({ id: tag.id, name: tag.name })));
        setSequences(
          records.map((seq) => ({
            id: seq.id,
            title: seq.title,
            createdAt: seq.createdAt,
            stepCount: counts.get(seq.id) ?? 0,
            tags: bySequence.get(seq.id) ?? [],
          })),
        );
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useSequenceList] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [userId]);

  return { sequences, isLoading };
};
