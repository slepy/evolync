import { useCallback, useEffect, useState } from "react";
import Order from "@/database/models/Order";
import { useStore } from "@/store";
import { deleteOrder } from "../services";
import { OrderRepository } from "../repositories";

/**
 * Hook for managing orders for a school
 *
 * Features:
 * - Reactive to local database changes via repository
 * - Background sync with Supabase
 * - Delete operations
 */
export const useOrders = (schoolId: string | undefined) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { performSync } = useStore();

  // Subscribe to local database changes via repository
  useEffect(() => {
    if (!schoolId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const subscription = OrderRepository.observeBySchoolId(schoolId).subscribe({
      next: (result: Order[]) => {
        setOrders(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useOrders] Observer error:", err);
        setError(t("errorLoadingFailed"));
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [schoolId]);

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
    isLoading,
    error,
    deleteOrder: handleDeleteOrder,
    refresh,
  };
};
