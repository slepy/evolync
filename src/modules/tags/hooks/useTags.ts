import { useStore } from "@/store";
import { useEffect, useState } from "react";
import type Tag from "@/database/models/Tag";
import { TagRepository } from "../repositories";

export const useTags = () => {
  const { user } = useStore();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTags([]);
      setIsLoading(false);
      return;
    }

    const subscription = TagRepository.observeByUserId(user.id).subscribe({
      next: (result: Tag[]) => {
        setTags(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useTags] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  return { tags, isLoading };
};
