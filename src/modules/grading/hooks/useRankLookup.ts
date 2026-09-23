import { useCallback } from "react";
import type GradingRank from "@/database/models/GradingRank";
import { findRankById } from "../services/gradingService";
import { useGradingRanks } from "./useGradingRanks";

export const useRankLookup = (organizationId: string) => {
  const { ranks, isLoading } = useGradingRanks(organizationId);

  const getRank = useCallback(
    (rankId?: string | null): GradingRank | undefined =>
      findRankById(ranks, rankId),
    [ranks],
  );

  return { getRank, ranks, isLoading };
};
