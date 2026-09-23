import Order from "@/database/models/Order";
import { Header, HeaderTitle, OptionsSheet } from "@/modules/core/components";
import { ProductRepository } from "@/modules/inventory/repositories";
import { ProductVariantRepository } from "@/modules/inventory/repositories";
import { OrderItemRepository } from "@/modules/orders/repositories";
import { StudentRepository } from "@/modules/students/repositories";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { Copy, Package, ShoppingCart } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, YStack, useTheme } from "tamagui";

import {
  ORDER_STATUS_FILTER,
  ORDER_TAB,
  type OrderStatusFilter as OrderStatusFilterType,
  type OrderTabType,
} from "../types/enums";
import type { AggregatedProduct, OrderWithDetails } from "../types/dto";
import { OrderCard } from "./OrderCard";
import { OrderStatusFilter } from "./OrderStatusFilter";
import { OrderedProductCard } from "./OrderedProductCard";
import { OrdersTabSelector } from "./OrdersTabSelector";

// ============================================================================
// Types
// ============================================================================

export interface OrdersListScreenProps {
  /** List of orders to display */
  orders: Order[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether to show the create order FAB */
  showCreateFab?: boolean;
  /** Callback when create order FAB is pressed */
  onCreateOrder?: () => void;
  /** Callback to get the navigation path for an order */
  getOrderPath: (order: OrderWithDetails) => string;
  /** Callback when back button is pressed */
  onBack: () => void;
  /** Router push function */
  routerPush: (path: string) => void;
}

// ============================================================================
// OrdersListScreen Component
// ============================================================================

/**
 * Shared orders list screen component used by both school and organization views.
 *
 * Features:
 * - Tabs: Orders / Products
 * - Status filters (no "All" in Products tab)
 * - Orders tab: list of all orders
 * - Products tab: aggregated products from filtered orders
 * - Copy to clipboard functionality
 * - Offline support via WatermelonDB
 */
export const OrdersListScreen: React.FC<OrdersListScreenProps> = ({
  orders,
  isLoading,
  error,
  showCreateFab = false,
  onCreateOrder,
  getOrderPath,
  onBack,
  routerPush,
}) => {
  const theme = useTheme();

  // Tab state
  const [activeTab, setActiveTab] = useState<OrderTabType>(ORDER_TAB.ORDERS);

  // Status filter state
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilterType>(
    ORDER_STATUS_FILTER.ALL,
  );

  // Orders with details
  const [ordersWithDetails, setOrdersWithDetails] = useState<
    OrderWithDetails[]
  >([]);

  // Aggregated products data
  const [aggregatedProducts, setAggregatedProducts] = useState<
    AggregatedProduct[]
  >([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Function to fetch order details
  const fetchOrderDetails = useCallback(async (ordersList: Order[]) => {
    if (ordersList.length === 0) {
      setOrdersWithDetails([]);
      return;
    }

    const details: OrderWithDetails[] = [];

    for (const order of ordersList) {
      const member = await StudentRepository.findById(order.schoolMemberId);
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

      details.push({
        orderId: order.id,
        schoolId: order.schoolId,
        status: order.status,
        createdAt: order.createdAt,
        member,
        itemCount,
        totalsByCurrency,
      });
    }

    setOrdersWithDetails(details);
  }, []);

  // Function to aggregate products from filtered orders
  const aggregateProductsFromOrders = useCallback(
    async (ordersList: Order[], filter: OrderStatusFilterType) => {
      setProductsLoading(true);

      // Filter orders by status
      const filteredOrders =
        filter === ORDER_STATUS_FILTER.ALL
          ? ordersList
          : ordersList.filter((o) => o.status === filter);

      if (filteredOrders.length === 0) {
        setAggregatedProducts([]);
        setProductsLoading(false);
        return;
      }

      // Get all order items from filtered orders
      const allItems = await Promise.all(
        filteredOrders.map((order) =>
          OrderItemRepository.findByOrderId(order.id),
        ),
      );
      const flatItems = allItems.flat();

      // Aggregate by variantId
      const aggregationMap = new Map<
        string,
        {
          variantId: string;
          totalQuantity: number;
          unitPrice: number;
          currency: string;
        }
      >();

      for (const item of flatItems) {
        const existing = aggregationMap.get(item.productVariantId);
        if (existing) {
          existing.totalQuantity += item.quantity;
        } else {
          aggregationMap.set(item.productVariantId, {
            variantId: item.productVariantId,
            totalQuantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
          });
        }
      }

      // Get product and variant details for each aggregated item
      const aggregated: AggregatedProduct[] = [];

      for (const [variantId, data] of aggregationMap) {
        const variant = await ProductVariantRepository.findById(variantId, true);
        if (!variant) continue;

        const product = await ProductRepository.findById(variant.productId, true);
        if (!product) continue;

        aggregated.push({
          variantId: data.variantId,
          productId: product.id,
          productName: product.name,
          variantName: variant.name,
          imageUrl: product.imageUrl ?? null,
          totalQuantity: data.totalQuantity,
          currency: data.currency,
          unitPrice: data.unitPrice,
        });
      }

      // Sort by product name, then variant name
      aggregated.sort((a, b) => {
        const nameCompare = a.productName.localeCompare(b.productName);
        if (nameCompare !== 0) return nameCompare;
        return a.variantName.localeCompare(b.variantName);
      });

      setAggregatedProducts(aggregated);
      setProductsLoading(false);
    },
    [],
  );

  // Refresh details when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (orders.length > 0) {
        fetchOrderDetails(orders);
        if (activeTab === ORDER_TAB.PRODUCTS) {
          aggregateProductsFromOrders(orders, statusFilter);
        }
      }
    }, [
      orders,
      fetchOrderDetails,
      aggregateProductsFromOrders,
      activeTab,
      statusFilter,
    ]),
  );

  // Fetch order details when orders change
  useEffect(() => {
    if (orders.length === 0) {
      setOrdersWithDetails([]);
      setAggregatedProducts([]);
      return;
    }
    fetchOrderDetails(orders);
  }, [orders, fetchOrderDetails]);

  // Aggregate products when tab changes to products or filter changes
  useEffect(() => {
    if (activeTab === ORDER_TAB.PRODUCTS && orders.length > 0) {
      aggregateProductsFromOrders(orders, statusFilter);
    }
  }, [activeTab, statusFilter, orders, aggregateProductsFromOrders]);

  // Filter orders by status (for orders tab)
  const filteredOrders =
    statusFilter === ORDER_STATUS_FILTER.ALL
      ? ordersWithDetails
      : ordersWithDetails.filter((o) => o.status === statusFilter);

  const handleTabChange = (tab: OrderTabType) => {
    setActiveTab(tab);
    if (
      tab === ORDER_TAB.PRODUCTS &&
      statusFilter === ORDER_STATUS_FILTER.ALL
    ) {
      setStatusFilter(ORDER_STATUS_FILTER.PLACED);
    }
  };

  const handleOrderPress = (order: OrderWithDetails) => {
    routerPush(getOrderPath(order));
  };

  const handleCopyProductsList = async () => {
    if (aggregatedProducts.length === 0) return;

    const lines = aggregatedProducts.map((product) => {
      const variantPart =
        product.variantName.toLowerCase() !== "standard"
          ? ` (${product.variantName})`
          : "";
      return `${product.productName}${variantPart} - ${product.totalQuantity}x,`;
    });

    const text = lines.join("\n");
    await Clipboard.setStringAsync(text);
    Alert.alert(t("success"), t("ordersCopiedToClipboard"));
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <Header
        onBack={onBack}
        centerContent={<HeaderTitle text={t("ordersTitle")} />}
      />
      <View style={{ flex: 1 }}>
        {/* Tabs */}
        <OrdersTabSelector
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Status Filter */}
        <OrderStatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          showAllFilter={activeTab === ORDER_TAB.ORDERS}
        />

        {/* Error Banner */}
        {error && activeTab === ORDER_TAB.ORDERS && (
          <YStack
            backgroundColor="$red3"
            padding="$3"
            borderRadius="$3"
            marginBottom="$3"
            marginHorizontal="$3"
          >
            <Text color="$red10">{error}</Text>
          </YStack>
        )}

        {/* Content */}
        <View style={{ flex: 1 }}>
          {activeTab === ORDER_TAB.ORDERS ? (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.orderId}
              contentContainerStyle={{ paddingBottom: 100 }}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <OrderCard
                  member={item.member}
                  status={item.status}
                  itemCount={item.itemCount}
                  totalsByCurrency={item.totalsByCurrency}
                  createdAt={item.createdAt}
                  onPress={() => handleOrderPress(item)}
                />
              )}
              ListEmptyComponent={
                <YStack gap="$2" alignItems="center" marginTop="$10">
                  <ShoppingCart size={48} color={theme.softGray?.val} />
                  <Text color="$inkBlackLight" textAlign="center">
                    {statusFilter === ORDER_STATUS_FILTER.ALL
                      ? t("emptyNoOrders")
                      : t("emptyNoOrdersFiltered")}
                  </Text>
                  {statusFilter === ORDER_STATUS_FILTER.ALL &&
                    showCreateFab && (
                      <Text
                        color="$softGrayDark"
                        textAlign="center"
                        fontSize="$3"
                      >
                        {t("emptyNoOrdersHint")}
                      </Text>
                    )}
                </YStack>
              }
            />
          ) : (
            <FlatList
              data={aggregatedProducts}
              keyExtractor={(item) => item.variantId}
              contentContainerStyle={{ paddingBottom: 100 }}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <OrderedProductCard
                  productName={item.productName}
                  variantName={item.variantName}
                  imageUrl={item.imageUrl}
                  totalQuantity={item.totalQuantity}
                />
              )}
              ListEmptyComponent={
                <YStack gap="$2" alignItems="center" marginTop="$10">
                  <Package size={48} color={theme.softGray?.val} />
                  <Text color="$inkBlackLight" textAlign="center">
                    {t("emptyNoProductsFiltered")}
                  </Text>
                </YStack>
              }
            />
          )}
        </View>

        {/* FAB - Create New Order (only on Orders tab when enabled) */}
        {activeTab === ORDER_TAB.ORDERS && showCreateFab && onCreateOrder && (
          <OptionsSheet
            fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
            action={onCreateOrder}
          />
        )}

        {/* FAB - Copy Products List (only on Products tab) */}
        {activeTab === ORDER_TAB.PRODUCTS && aggregatedProducts.length > 0 && (
          <OptionsSheet
            fab={{
              bottom: Platform.OS === "ios" ? 90 : 80,
              right: 20,
              backgroundColor: "$purple11",
              icon: <Copy size={24} />,
            }}
            action={handleCopyProductsList}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
