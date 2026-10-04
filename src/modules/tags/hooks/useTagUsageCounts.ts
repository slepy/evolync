import { useEffect, useState } from "react";
import type Taggable from "@/database/models/Taggable";
import { TaggableRepository } from "../repositories";

/** Number of notes and techniques carrying each tag, keyed by tag id. */
export const useTagUsageCounts = (tagIds: string[]) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = tagIds.join(",");

  useEffect(() => {
    if (tagIds.length === 0) {
      setCounts({});
      return;
    }

    const subscription = TaggableRepository.observeByTagIds(tagIds).subscribe({
      next: (records: Taggable[]) => {
        const next: Record<string, number> = {};
        for (const record of records) next[record.tagId] = (next[record.tagId] ?? 0) + 1;
        setCounts(next);
      },
      error: (err: Error) => console.error("[useTagUsageCounts] Error:", err),
    });

    return () => subscription.unsubscribe();
  }, [key]);

  return counts;
};
