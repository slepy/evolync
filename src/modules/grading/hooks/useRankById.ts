import { useEffect, useState } from "react";
import { database } from "@/database";
import type GradingRank from "@/database/models/GradingRank";

export const useRankById = (rankId?: string | null) => {
  const [rank, setRank] = useState<GradingRank | null>(null);

  useEffect(() => {
    if (!rankId) {
      setRank(null);
      return;
    }

    const collection = database.get<GradingRank>("organization_gradings");
    const subscription = collection.findAndObserve(rankId).subscribe({
      next: (record) => {
        setRank(record.deletedAt ? null : record);
      },
      error: () => {
        setRank(null);
      },
    });

    return () => subscription.unsubscribe();
  }, [rankId]);

  return rank;
};
