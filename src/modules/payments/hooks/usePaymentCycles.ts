import { useCallback, useEffect, useState } from "react";
import PaymentCycle from "@/database/models/PaymentCycle";
import { useStore } from "@/store";
import { createPaymentCycle, deletePaymentCycle } from "../services";
import type { CreatePaymentCycleDto } from "../types";
import { PaymentCycleRepository } from "../repositories";

/**
 * Hook for managing payment cycles for a school
 *
 * Features:
 * - Reactive to local database changes via repository
 * - Background sync with Supabase
 * - CRUD operations
 */
export const usePaymentCycles = (schoolId: string | undefined) => {
  const [cycles, setCycles] = useState<PaymentCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { performSync } = useStore();

  // Subscribe to local database changes via repository
  useEffect(() => {
    if (!schoolId) {
      setCycles([]);
      setIsLoading(false);
      return;
    }

    const subscription = PaymentCycleRepository.observeBySchoolId(schoolId).subscribe({
      next: (result: PaymentCycle[]) => {
        setCycles(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[usePaymentCycles] Observer error:", err);
        setError(t("errorLoadingFailed"));
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [schoolId]);

  // Create a new cycle
  const handleCreateCycle = useCallback(
    async (data: Omit<CreatePaymentCycleDto, "schoolId">) => {
      if (!schoolId) {
        throw new Error(t("errorNoSchool"));
      }

      try {
        setError(null);
        const cycle = await createPaymentCycle({
          ...data,
          schoolId,
        });
        return cycle;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errorCreateFailed");
        setError(message);
        throw err;
      }
    },
    [schoolId]
  );

  // Delete a cycle
  const handleDeleteCycle = useCallback(async (cycleId: string) => {
    try {
      setError(null);
      await deletePaymentCycle(cycleId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorDeleteFailed");
      setError(message);
      throw err;
    }
  }, []);

  // Manual refresh - triggers global sync
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await performSync(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorLoadingFailed");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [performSync]);

  return {
    cycles,
    isLoading,
    error,
    createCycle: handleCreateCycle,
    deleteCycle: handleDeleteCycle,
    refresh,
  };
};
