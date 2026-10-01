import { useCallback, useEffect, useState } from "react";
import Order from "@/database/models/Order";
import type { OrderStatus } from "../types";
import { useStore } from "@/store";
import {
  updateOrderStatus,
  deleteOrder,
  updateOrderItems,
} from "../services";
import type { CreateOrderItemDto } from "../types/dto";
import { OrderRepository, OrderItemRepository } from "../repositories";
import { StudentRepository } from "@/modules/students/repositories";
import { ProductRepository } from "@/modules/inventory/repositories";
import { ProductVariantRepository } from "@/modules/inventory/repositories";
import { School, SchoolMember } from "@/database/models";

// ============================================================================
// Types
// ============================================================================

export interface OrderItemDetails {
  id: string;
  variantId: string;
  variantName: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface OrderDetails {
  order: Order;
  member?: SchoolMember;
  items: OrderItemDetails[];
  totalsByCurrency: Record<string, number>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for loading and managing a single order's details
 *
 * Features:
 * - Loads order with items, member, and product details via repositories
 * - Reactive to local database changes
 * - Update status functionality
 * - Delete functionality
 */
export const useOrderDetails = (orderId: string | undefined) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { performSync } = useStore();

  // Load order details
  useEffect(() => {
    if (!orderId) {
      setOrderDetails(null);
      setIsLoading(false);
      return;
    }

    const loadOrderDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get order via repository
        const order = await OrderRepository.findById(orderId);

        if (!order || order.deletedAt) {
          setOrderDetails(null);
          setIsLoading(false);
          return;
        }

        // Get member name via repository
        const member = await StudentRepository.findById(order.schoolMemberId);
        // Get order items with product details via repositories
        const orderItems = await OrderItemRepository.findByOrderId(orderId);

        const itemDetails: OrderItemDetails[] = [];
        for (const item of orderItems) {
          let variantName = "";
          let productName = "";
          let productId = "";
          let productImageUrl: string | undefined;

          const variant = await ProductVariantRepository.findById(
            item.productVariantId,
            true,
          );
          if (variant) {
            variantName = variant.name;
            productId = variant.productId;

            const product = await ProductRepository.findById(variant.productId, true);
            if (product) {
              productName = product.name;
              productImageUrl = product.imageUrl || undefined;
            } else {
              productName = t("ordersUnknownProduct");
            }
          } else {
            variantName = t("ordersUnknownVariant");
            productName = t("ordersUnknownProduct");
          }

          itemDetails.push({
            id: item.id,
            variantId: item.productVariantId,
            variantName,
            productId,
            productName,
            productImageUrl,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
          });
        }

        const totalsByCurrency = itemDetails.reduce<Record<string, number>>(
          (acc, item) => {
            const amount = item.unitPrice * item.quantity;
            acc[item.currency] = (acc[item.currency] || 0) + amount;
            return acc;
          },
          {},
        );

        setOrderDetails({
          order,
          member: member ?? undefined,
          items: itemDetails,
          totalsByCurrency,
        });
      } catch (err) {
        console.error("[useOrderDetails] Error loading order:", err);
        setError(t("errorLoadingFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderDetails();

    // Also set up observer for reactive updates via repository
    const subscription = OrderRepository.observeById(orderId).subscribe({
      next: () => {
        loadOrderDetails();
      },
      error: (err: Error) => {
        console.error("[useOrderDetails] Observer error:", err);
      },
    });

    return () => subscription.unsubscribe();
  }, [orderId]);

  // Update order status
  const handleUpdateStatus = useCallback(
    async (status: OrderStatus) => {
      if (!orderId) return;

      try {
        setIsUpdating(true);
        setError(null);
        await updateOrderStatus(orderId, status);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errorUpdateFailed");
        setError(message);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [orderId],
  );

  // Delete order
  const handleDeleteOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setIsUpdating(true);
      setError(null);
      await deleteOrder(orderId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorDeleteFailed");
      setError(message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [orderId]);

  // Update order items (remove, add, and update quantities)
  const handleUpdateItems = useCallback(
    async (
      itemIdsToRemove: string[],
      itemsToAdd: CreateOrderItemDto[],
      quantityUpdates: Array<{ itemId: string; quantity: number }> = [],
    ) => {
      if (!orderId) return;

      try {
        setIsUpdating(true);
        setError(null);

        // Remove + update quantities + add, all in a single atomic batch
        await updateOrderItems(
          orderId,
          itemIdsToRemove,
          itemsToAdd,
          quantityUpdates,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errorUpdateFailed");
        setError(message);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [orderId],
  );

  // Manual refresh
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
    orderDetails,
    isLoading,
    isUpdating,
    error,
    updateStatus: handleUpdateStatus,
    updateItems: handleUpdateItems,
    deleteOrder: handleDeleteOrder,
    refresh,
  };
};
