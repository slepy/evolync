import { useEffect, useState } from "react";
import type { Subscription } from "rxjs";
import type GradingRank from "@/database/models/GradingRank";
import { GradingRankRepository } from "../repositories";

export const useGradingRanks = (organizationId: string) => {
  const [ranks, setRanks] = useState<GradingRank[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    let subscription: Subscription;

    const observable =
      GradingRankRepository.observeByOrganizationId(organizationId);

    subscription = observable.subscribe(
      (result) => {
        setRanks(result);
        setIsLoading(false);
      },
      (error) => {
        console.error("[useGradingRanks] Error observing:", error);
        setIsLoading(false);
      },
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [organizationId]);

  return { ranks, isLoading };
};
