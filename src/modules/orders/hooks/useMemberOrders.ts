import { useEffect, useState } from "react";
import Order from "@/database/models/Order";
import { OrderRepository, OrderItemRepository } from "../repositories";
import {
  ProductVariantRepository,
  ProductRepository,
} from "../../inventory/repositories";

// ============================================================================
// Types
// ============================================================================

export interface MemberOrderWithDetails {
  order: Order;
  itemCount: number;
  totalsByCurrency: Record<string, number>;
  productName?: string;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for fetching orders for a specific school member
 *
 * Features:
 * - Reactive to local database changes via repository
 * - Includes order details (item count, total amount)
 */
export const useMemberOrders = (memberId: string | undefined) => {
  const [orders, setOrders] = useState<MemberOrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!memberId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const subscription = OrderRepository.observeByMemberId(memberId).subscribe({
      next: async (result: Order[]) => {
        // Fetch details for each order via repository
        const ordersWithDetails: MemberOrderWithDetails[] = [];
        for (const order of result) {
          const items = await OrderItemRepository.findByOrderId(order.id);
          const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
          const totalsByCurrency = items.reduce<Record<string, number>>(
            (acc, item) => {
              const amount = item.unitPrice * item.quantity;
              acc[item.currency] = (acc[item.currency] || 0) + amount;
              return acc;
            },
            {},
          );

          let productName: string | undefined;
          if (itemCount === 1) {
            const variant = await ProductVariantRepository.findById(
              items[0].productVariantId,
              true,
            );
            if (variant) {
              const product = await ProductRepository.findById(
                variant.productId,
                true,
              );
              if (product) {
                productName = product.name;
              }
            }
          }

          ordersWithDetails.push({
            order,
            itemCount,
            totalsByCurrency,
            productName,
          });
        }

        setOrders(ordersWithDetails);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useMemberOrders] Observer error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [memberId]);

  return {
    orders,
    isLoading,
    total: orders.length,
  };
};
