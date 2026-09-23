import { useCallback, useEffect, useState } from "react";
import Order from "@/database/models/Order";
import { useStore } from "@/store";
import { SchoolRepository } from "@/modules/school/repositories";
import { OrderRepository } from "../repositories";
import { deleteOrder } from "../services";

/**
 * Hook for managing orders across all schools in an organization
 *
 * Features:
 * - Fetches schools for the organization
 * - Observes orders for all schools reactively
 * - Background sync with Supabase
 * - Delete operations
 */
export const useOrganizationOrders = (organizationId: string | undefined) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [schoolIds, setSchoolIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { performSync } = useStore();

  // First, get all school IDs for the organization
  useEffect(() => {
    if (!organizationId) {
      setSchoolIds([]);
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const subscription = SchoolRepository.observeByOrganizationId(
      organizationId,
    ).subscribe({
      next: (schools) => {
        const ids = schools.map((s) => s.id);
        setSchoolIds(ids);
      },
      error: (err: Error) => {
        console.error("[useOrganizationOrders] Schools observer error:", err);
        setError(t("errorLoadingFailed"));
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [organizationId]);

  // Then observe orders for those schools
  useEffect(() => {
    if (schoolIds.length === 0) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const subscription = OrderRepository.observeBySchoolIds(schoolIds).subscribe(
      {
        next: (result: Order[]) => {
          setOrders(result);
          setIsLoading(false);
        },
        error: (err: Error) => {
          console.error("[useOrganizationOrders] Orders observer error:", err);
          setError(t("errorLoadingFailed"));
          setIsLoading(false);
        },
      },
    );

    return () => subscription.unsubscribe();
  }, [schoolIds]);

  // Delete an order
  const handleDeleteOrder = useCallback(async (orderId: string) => {
    try {
      setError(null);
      await deleteOrder(orderId);
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
    orders,
    schoolIds,
    isLoading,
    error,
    deleteOrder: handleDeleteOrder,
    refresh,
  };
};
