import { useState, useCallback } from "react";
import type Order from "@/database/models/Order";
import { createOrderWithItems } from "../services";
import type { CreateOrderItemDto } from "../types";

/**
 * Hook for creating a new order with items
 *
 * Features:
 * - Loading state tracking
 * - Error handling with user-friendly messages
 * - Works offline
 *
 * @returns Object with createOrder function, loading state, error, and reset
 */
export const useCreateOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrder = useCallback(
    async (
      schoolId: string,
      memberId: string,
      items: CreateOrderItemDto[]
    ): Promise<Order | null> => {
      if (items.length === 0) {
        setError(t("errorNoItems"));
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const order = await createOrderWithItems(schoolId, memberId, items);

        return order;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t("errorCreateFailed");
        setError(errorMessage);
        console.error("Error creating order:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    createOrder: handleCreateOrder,
    isLoading,
    error,
    reset,
  };
};
