import { formatPrice } from "@/modules/core/utils/formatters";
import { useDirtyFlag } from "@/modules/core/hooks";
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
  VariantPickerSheet,
  useOrderDetails,
} from "@/modules/orders";
import type { OrderItemDetails } from "@/modules/orders/hooks/useOrderDetails";
import type { ProductWithVariants } from "@/modules/orders/components/ProductPickerList";
import type { CartItem, CreateOrderItemDto } from "@/modules/orders/types/dto";
import { OrderStatus } from "@/modules/orders/types";
import {
  ProductRepository,
  ProductVariantRepository,
} from "@/modules/inventory/repositories";
import { SchoolRepository } from "@/modules/school/repositories";
import { useStore } from "@/store";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Clock, Package, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Separator, Text, XStack, YStack, useTheme } from "tamagui";
import { BaseCard } from "@/modules/core/components";

/**
 * User Order Details Screen
 *
 * Route: /user/orders/[orderId]
 *
 * Features:
 * - View order status and dates
 * - View order items
 * - Edit order items when status is "placed" (add/remove products)
 * - Delete order when status is "placed"
 * - Read-only view for other statuses
 * - No member info (it's the user's own order)
 */
export default function UserOrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const schoolMembership = useStore((state) => state.getActiveMembership());
  const schoolId = schoolMembership?.schoolId;
  const insets = useSafeAreaInsets();

  const {
    orderDetails,
    isLoading,
    isUpdating,
    error,
    updateItems,
    deleteOrder,
  } = useOrderDetails(orderId);

  // Cart state (only used when editable)
  const { isDirty, markDirty, reset: resetDirty } = useDirtyFlag();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartInitialized, setCartInitialized] = useState(false);

  // Product picker state
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithVariants | null>(null);
  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);

  const isEditable = orderDetails?.order.status === OrderStatus.PLACED;

  // Initialize cart with existing order items
  useEffect(() => {
    if (orderDetails && !cartInitialized && isEditable) {
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
  }, [orderDetails, cartInitialized, isEditable]);

  // Load products for editing
  useEffect(() => {
    if (!schoolId || !isEditable) return;

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const school = await SchoolRepository.findById(schoolId);
        if (!school) return;

        const allProducts = await ProductRepository.findByOrganizationId(
          school.organizationId,
        );

        const productsWithVariants: ProductWithVariants[] = [];

        for (const product of allProducts) {
          const variants = await ProductVariantRepository.findByProductId(
            product.id,
          );

          if (variants.length > 0) {
            productsWithVariants.push({ product, variants });
          }
        }

        setProducts(productsWithVariants);
      } catch (err) {
        console.error("[UserOrderDetails] Error fetching products:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [schoolId, isEditable]);

  // Handlers
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
      const originalIds = new Set(orderDetails.items.map((i) => i.id));
      const cartIds = new Set(cartItems.map((i) => i.id));

      // Items in original but not in cart → remove
      const itemIdsToRemove = orderDetails.items
        .filter((item) => !cartIds.has(item.id))
        .map((item) => item.id);

      // Items in cart but not in original → add
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

  if (isLoading || (isEditable && !cartInitialized)) {
    return <LoadingScreen showLogo={false} spinnerColor="$blue11" />;
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
          <Text color="$inkBlackLight">{t("errorNotFound")}</Text>
        </YStack>
      </View>
    );
  }

  const { order, items, totalsByCurrency } = orderDetails;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("ordersDetailsTitle")} />}
        rightContent={
          isEditable ? (
            <Button
              width="$4"
              height="$4"
              chromeless
              pressStyle={{
                scale: 0.95,
                backgroundColor: "$imperialRedLighter",
              }}
              onPress={handleDeleteOrder}
              disabled={isUpdating}
              icon={
                <Trash2
                  size={20}
                  color={theme.imperialRedDark?.val}
                  pointerEvents="none"
                />
              }
            />
          ) : undefined
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: isDirty ? 120 : 20,
        }}
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
            borderColor="$softGrayLight"
            gap="$3"
          >
            {/* Status */}
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" color="$softGray" fontWeight="600">
                {t("status")}
              </Text>
              <OrderStatusBadge status={order.status} />
            </XStack>

            <Separator backgroundColor="$softGrayLight" />

            {/* Date Info */}
            <XStack gap="$4">
              <XStack alignItems="center" gap="$2" flex={1}>
                <Calendar size={16} color={theme.softGray?.val} />
                <YStack>
                  <Text fontSize="$2" color="$softGray">
                    {t("fieldCreatedAt")}
                  </Text>
                  <Text fontSize="$3" color="$softGrayBark">
                    {format(order.createdAt, "dd.MM.yyyy HH:mm")}
                  </Text>
                </YStack>
              </XStack>
              <XStack alignItems="center" gap="$2" flex={1}>
                <Clock size={16} color={theme.softGray?.val} />
                <YStack>
                  <Text fontSize="$2" color="$softGray">
                    {t("fieldUpdatedAt")}
                  </Text>
                  <Text fontSize="$3" color="$softGrayBark">
                    {format(order.updatedAt, "dd.MM.yyyy HH:mm")}
                  </Text>
                </YStack>
              </XStack>
            </XStack>
          </YStack>

          {/* Read-only Order Items (when not editable) */}
          {!isEditable && items.length > 0 && (
            <YStack gap="$3">
              <Text fontSize="$3" color="$softGrayDark" paddingHorizontal="$1">
                {t("ordersCartTitle")}
              </Text>
              <YStack gap="$2">
                {items.map((item: OrderItemDetails) => (
                  <XStack
                    key={item.id}
                    gap="$2"
                    alignItems="center"
                    borderRadius="$3"
                    padding="$2"
                    borderWidth={1}
                    borderColor="$softGrayLight"
                  >
                    <Thumbnail
                      imageUrl={item.productImageUrl}
                      borderColor={theme.purple11?.val}
                      backgroundColor={theme.purple3?.val}
                      size={32}
                      iconSize={16}
                      icon={<Package />}
                    />
                    <CardInfo
                      displayName={item.productName}
                      subtitle={`${item.variantName} × ${item.quantity}`}
                    />
                    <Text fontSize="$3" fontWeight="600" color="$softGrayDark">
                      {formatPrice(
                        item.unitPrice * item.quantity,
                        item.currency,
                      )}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          )}

          {/* Total (read-only view) */}
          {!isEditable && Object.keys(totalsByCurrency).length > 0 && (
            <BaseCard
              onPress={() => {}}
              backgroundColor="$jadeGreenLighter"
              borderColor="$jadeGreen"
              marginHorizontal="$0"
            >
              <XStack
                gap="$3"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text fontSize="$4" color="$jadeGreenDark">
                  {t("total")}
                </Text>
                <YStack alignItems="flex-end" gap="$2">
                  {Object.entries(totalsByCurrency).map(([cur, amount]) => (
                    <Text
                      key={cur}
                      fontSize="$4"
                      fontWeight="700"
                      color="$jadeGreen"
                    >
                      {formatPrice(amount, cur)}
                    </Text>
                  ))}
                </YStack>
              </XStack>
            </BaseCard>
          )}
        </YStack>

        {/* Editable Product Picker (when status is "placed") */}
        {isEditable && (
          <ProductPickerList
            products={products}
            cartItems={cartItems}
            isLoading={isLoadingProducts}
            onProductPress={handleProductPress}
            onRemoveItem={handleRemoveItem}
          />
        )}
      </ScrollView>

      {/* Save Button (only when editable and changes detected) */}
      {isEditable && isDirty && (
        <SubmitComponent
          onPress={handleSaveChanges}
          isLoading={isUpdating}
          disabled={isUpdating}
        />
      )}

      {/* Variant Picker Sheet (only when editable) */}
      {isEditable && selectedProduct && (
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
