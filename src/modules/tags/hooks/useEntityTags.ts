import { useEffect, useState } from "react";
import type Tag from "@/database/models/Tag";
import type Taggable from "@/database/models/Taggable";
import { database } from "@/database";
import { TaggableRepository } from "../repositories";
import type { TaggableType } from "../types";

export const useEntityTags = (taggableId: string | undefined, taggableType: TaggableType) => {
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!taggableId) {
      setTagIds([]);
      setTags([]);
      setIsLoading(false);
      return;
    }

    const subscription = TaggableRepository.observeTagIdsForEntity(taggableId, taggableType)
      .subscribe({
        next: async (taggables: Taggable[]) => {
          const ids = taggables.map((t) => t.tagId);
          setTagIds(ids);

          if (ids.length === 0) {
            setTags([]);
            setIsLoading(false);
            return;
          }

          const tagCollection = database.get<Tag>("tags");
          const fetched = await Promise.all(
            ids.map((id) => tagCollection.find(id).catch(() => null)),
          );
          setTags(fetched.filter((t): t is Tag => t !== null && !t.deletedAt));
          setIsLoading(false);
        },
        error: (err: Error) => {
          console.error("[useEntityTags] Error:", err);
          setIsLoading(false);
        },
      });

    return () => subscription.unsubscribe();
  }, [taggableId, taggableType]);

  return { tags, tagIds, isLoading };
};
