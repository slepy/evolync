import { database } from "@/database";
import { useDirtyFlag } from "@/modules/core/hooks";
import { OrderStatus } from "@/modules/orders/types";
import Product from "@/database/models/Product";
import ProductVariant from "@/database/models/ProductVariant";
import School from "@/database/models/School";
import {
  Header,
  HeaderTitle,
  Thumbnail,
  CardInfo,
  SubmitComponent,
} from "@/modules/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import {
  OrderStatusBadge,
  ProductPickerList,
  StatusPickerSheet,
  VariantPickerSheet,
  useOrderDetails,
} from "@/modules/orders";
import type { ProductWithVariants } from "@/modules/orders/components/ProductPickerList";
import type { CartItem, CreateOrderItemDto } from "@/modules/orders/types/dto";
import { Q } from "@nozbe/watermelondb";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Clock, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Separator, Text, XStack, YStack, useTheme } from "tamagui";
import { useRankById } from "@/modules/grading";

// ============================================================================
// Order Details Screen
// ============================================================================

/**
 * Screen for viewing and editing order details
 *
 * Route: /school/[schoolId]/orders/[orderId]
 *
 * Features:
 * - View order info (member, status, date, items)
 * - Change order status
 * - Edit order items (add/remove products)
 * - Delete order
 * - Works offline
 */
export default function OrderDetailsScreen() {
  const { schoolId, orderId } = useLocalSearchParams<{
    schoolId: string;
    orderId: string;
  }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const {
    orderDetails,
    isLoading,
    isUpdating,
    error,
    updateStatus,
    updateItems,
    deleteOrder,
  } = useOrderDetails(orderId);

  const { isDirty, markDirty, reset: resetDirty } = useDirtyFlag();
  const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  // Cart state - initialized from existing order items
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartInitialized, setCartInitialized] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithVariants | null>(null);
  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Initialize cart with existing order items when data loads
  useEffect(() => {
    if (orderDetails && !cartInitialized) {
      const initialCart: CartItem[] = orderDetails.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        productId: item.productId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
        imageUrl: item.productImageUrl,
      }));
      setCartItems(initialCart);
      setCartInitialized(true);
    }
  }, [orderDetails, cartInitialized]);

  // Load products for editing
  useEffect(() => {
    if (!schoolId) return;

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const school = await database.get<School>("schools").find(schoolId);
        const organizationId = school.organizationId;

        const productsCollection = database.get<Product>("products");
        const allProducts = await productsCollection
          .query(
            Q.where("organization_id", organizationId),
            Q.where("deleted_at", null),
          )
          .fetch();

        const variantsCollection =
          database.get<ProductVariant>("product_variants");
        const productsWithVariants: ProductWithVariants[] = [];

        for (const product of allProducts) {
          const variants = await variantsCollection
            .query(
              Q.where("product_id", product.id),
              Q.where("deleted_at", null),
            )
            .fetch();

          if (variants.length > 0) {
            productsWithVariants.push({ product, variants });
          }
        }

        setProducts(productsWithVariants);
      } catch (err) {
        console.error("[OrderDetails] Error fetching products:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [schoolId]);

  // Handlers
  const handleStatusChange = useCallback((newStatus: OrderStatus) => {
    markDirty();
    setPendingStatus(newStatus);
    setIsStatusSheetOpen(false);
  }, [markDirty]);

  const handleDeleteOrder = useCallback(() => {
    confirmDelete(t("ordersDeleteTitle"), t("ordersDeleteMessage"), async () => {
      try {
        await deleteOrder();
        router.back();
      } catch {
        // Error is handled by the hook
      }
    });
  }, [deleteOrder, router]);

  const handleProductPress = (productWithVariants: ProductWithVariants) => {
    setSelectedProduct(productWithVariants);
    setIsVariantSheetOpen(true);
  };

  /**
   * Handle updating cart items for a specific product.
   * Replaces all items for that product with the new items.
   */
  const handleUpdateProductItems = (productId: string, items: CartItem[]) => {
    markDirty();
    setCartItems((prev) => {
      const otherItems = prev.filter((i) => i.productId !== productId);
      return [...otherItems, ...items];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    markDirty();
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleSaveChanges = async () => {
    if (!orderDetails) return;

    try {
      // Update status if changed
      if (
        pendingStatus !== null &&
        pendingStatus !== orderDetails.order.status
      ) {
        await updateStatus(pendingStatus);
      }

      const originalIds = new Set(orderDetails.items.map((i) => i.id));
      const cartIds = new Set(cartItems.map((i) => i.id));

      // Items in original but not in cart → remove
      const itemIdsToRemove = orderDetails.items
        .filter((item) => !cartIds.has(item.id))
        .map((item) => item.id);

      // Items in cart but not in original → add (new items have generated UUIDs)
      const itemsToAdd: CreateOrderItemDto[] = cartItems
        .filter((item) => !originalIds.has(item.id))
        .map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          currency: item.currency,
        }));

      // Items that exist in both but have different quantities → update
      const quantityUpdates: Array<{ itemId: string; quantity: number }> = [];
      for (const cartItem of cartItems) {
        const originalItem = orderDetails.items.find(
          (i) => i.id === cartItem.id,
        );
        if (originalItem && originalItem.quantity !== cartItem.quantity) {
          quantityUpdates.push({
            itemId: cartItem.id,
            quantity: cartItem.quantity,
          });
        }
      }

      // Only update items if there are changes
      if (
        itemIdsToRemove.length > 0 ||
        itemsToAdd.length > 0 ||
        quantityUpdates.length > 0
      ) {
        await updateItems(itemIdsToRemove, itemsToAdd, quantityUpdates);
      }

      resetDirty();
      router.back();
    } catch {
      // Error is handled by the hook
    }
  };

  const rank = useRankById(orderDetails?.member?.currentRankId);

  if (isLoading || !cartInitialized) {
    return <LoadingScreen />;
  }

  if (!orderDetails) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header
          onBack={() => router.back()}
          centerContent={<HeaderTitle text={t("ordersDetailsTitle")} />}
        />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Text color="$textBody">{t("errorNotFound")}</Text>
        </YStack>
      </View>
    );
  }

  const { order, member, items } = orderDetails;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("ordersDetailsTitle")} />}
        rightContent={
          <Button
            width="$4"
            height="$4"
            chromeless
            pressStyle={{
              scale: 0.95,
              backgroundColor: "$dangerSurface",
            }}
            onPress={handleDeleteOrder}
            disabled={isUpdating}
            icon={
              <Trash2
                size={20}
                color={theme.dangerText?.val}
                pointerEvents="none"
              />
            }
          />
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: isDirty ? 120 : 20 }}
      >
        <YStack
          maxWidth={500}
          width="100%"
          alignSelf="center"
          padding="$4"
          gap="$4"
        >
          {/* Error Banner */}
          {error && (
            <YStack backgroundColor="$red3" padding="$3" borderRadius="$3">
              <Text color="$red10">{error}</Text>
            </YStack>
          )}

          {/* Order Info Card */}
          <YStack
            padding="$4"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderStrong"
            gap="$3"
          >
            {/* Member Info */}
            <XStack alignItems="center" gap="$3">
              <XStack flex={1} gap="$3" alignItems="center">
                <Thumbnail
                  backgroundColor="$blue3"
                  borderColor="$blue11"
                  imageUrl={member?.avatarUrl}
                  rankColor={rank?.color}
                />
                <CardInfo
                  displayName={member?.displayName || t("unknownMember")}
                  subtitle={member?.email}
                />
              </XStack>
              <XStack justifyContent="flex-end">
                <Button
                  size="$2"
                  chromeless
                  onPress={() => setIsStatusSheetOpen(true)}
                  disabled={isUpdating}
                >
                  <OrderStatusBadge status={pendingStatus ?? order.status} />
                </Button>
              </XStack>
            </XStack>

            <Separator backgroundColor="$fillStrong" />

            {/* Date Info */}
            <XStack gap="$4">
              <XStack alignItems="center" gap="$2" flex={1}>
                <Calendar size={16} color={theme.textMuted?.val} />
                <YStack>
                  <Text fontSize="$2" color="$textMuted">
                    {t("fieldCreatedAt")}
                  </Text>
                  <Text fontSize="$3" color="$textSecondary">
                    {format(order.createdAt, "dd.MM.yyyy HH:mm")}
                  </Text>
                </YStack>
              </XStack>
              <XStack alignItems="center" gap="$2" flex={1}>
                <Clock size={16} color={theme.textMuted?.val} />
                <YStack>
                  <Text fontSize="$2" color="$textMuted">
                    {t("fieldUpdatedAt")}
                  </Text>
                  <Text fontSize="$3" color="$textSecondary">
                    {format(order.updatedAt, "dd.MM.yyyy HH:mm")}
                  </Text>
                </YStack>
              </XStack>
            </XStack>
          </YStack>
        </YStack>

        {/* Products Section - shows cart items and allows adding new ones */}
        <ProductPickerList
          products={products}
          cartItems={cartItems}
          isLoading={isLoadingProducts}
          onProductPress={handleProductPress}
          onRemoveItem={handleRemoveItem}
        />
      </ScrollView>

      {/* Save Button */}
      {isDirty && (
        <SubmitComponent
          onPress={handleSaveChanges}
          isLoading={isUpdating}
          disabled={isUpdating}
        />
      )}

      {/* Status Picker Sheet */}
      <StatusPickerSheet
        open={isStatusSheetOpen}
        onOpenChange={setIsStatusSheetOpen}
        currentStatus={pendingStatus ?? order.status}
        onSelectStatus={handleStatusChange}
        isUpdating={isUpdating}
      />

      {/* Variant Picker Sheet */}
      {selectedProduct && (
        <VariantPickerSheet
          open={isVariantSheetOpen}
          onOpenChange={setIsVariantSheetOpen}
          productId={selectedProduct.product.id}
          productName={selectedProduct.product.name}
          productDescription={selectedProduct.product.description}
          productImageUrl={selectedProduct.product.imageUrl}
          variants={selectedProduct.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            currency: v.currency,
            stockQuantity: v.stockQuantity,
          }))}
          existingCartItems={cartItems.filter(
            (item) => item.productId === selectedProduct.product.id,
          )}
          onUpdateItems={(items) =>
            handleUpdateProductItems(selectedProduct.product.id, items)
          }
        />
      )}
    </View>
  );
}
