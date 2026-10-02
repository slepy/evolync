import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import {
  ProductRepository,
  ProductVariantRepository,
} from "@/modules/inventory/repositories";
import {
  ProductPickerList,
  VariantPickerSheet,
  useCreateOrder,
} from "@/modules/orders";
import type { ProductWithVariants } from "@/modules/orders/components/ProductPickerList";
import type { CartItem, CreateOrderItemDto } from "@/modules/orders/types/dto";
import { SchoolRepository } from "@/modules/school/repositories";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { useStore } from "@/store";

/**
 * User Create Order Screen
 *
 * Route: /user/orders/create
 *
 * Same as school create order but without member selection —
 * the order is automatically created for the current user's membership.
 */
export default function UserCreateOrderScreen() {
  const router = useRouter();
  const { createOrder, isLoading, error } = useCreateOrder();
  const schoolMembership = useStore((state) => state.getActiveMembership());
  const insets = useSafeAreaInsets();

  const schoolId = schoolMembership?.schoolId;
  const memberId = schoolMembership?.memberId;

  // State
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Variant picker state
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithVariants | null>(null);
  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);

  // Fetch products
  useEffect(() => {
    if (!schoolId) return;

    const fetchData = async () => {
      try {
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
        console.error("[UserCreateOrder] Error fetching data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [schoolId]);

  // Handlers
  const handleProductPress = (productWithVariants: ProductWithVariants) => {
    setSelectedProduct(productWithVariants);
    setIsVariantSheetOpen(true);
  };

  const handleUpdateProductItems = (productId: string, items: CartItem[]) => {
    setCartItems((prev) => {
      const otherItems = prev.filter((i) => i.productId !== productId);
      return [...otherItems, ...items];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleSave = async () => {
    if (!schoolId || !memberId || cartItems.length === 0) return;

    const items: CreateOrderItemDto[] = cartItems.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency: item.currency,
    }));

    const order = await createOrder(schoolId, memberId, items);
    if (order) {
      router.back();
    }
  };

  if (!schoolId || !memberId) {
    return (
      <View style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textPrimary">{t("errorNoSchool")}</Text>
        </YStack>
      </View>
    );
  }

  const canSave = cartItems.length > 0;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("ordersCreateTitle")} />}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: canSave ? 120 : 20 }}
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
        </YStack>

        {/* Products List */}
        <ProductPickerList
          products={products}
          cartItems={cartItems}
          isLoading={isLoadingData}
          onProductPress={handleProductPress}
          onRemoveItem={handleRemoveItem}
        />
      </ScrollView>

      {/* Save Button */}
      {canSave && (
        <SubmitComponent
          onPress={handleSave}
          isLoading={isLoading}
          disabled={isLoading}
        />
      )}

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
