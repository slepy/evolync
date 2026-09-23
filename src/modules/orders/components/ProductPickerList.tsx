import type Product from "@/database/models/Product";
import type ProductVariant from "@/database/models/ProductVariant";
import { formatPrice } from "@/modules/core/utils/formatters";
import React from "react";
import { ScrollView } from "react-native";
import { Text, YStack } from "tamagui";

import type { CartItem } from "../types/dto";
import { OrderCartPreview } from "./OrderCartPreview";
import { ProductPickerCard } from "./ProductPickerCard";

// ============================================================================
// Types
// ============================================================================

export interface ProductWithVariants {
  product: Product;
  variants: ProductVariant[];
}

interface ProductPickerListProps {
  products: ProductWithVariants[];
  cartItems: CartItem[];
  isLoading: boolean;
  onProductPress: (productWithVariants: ProductWithVariants) => void;
  onRemoveItem: (itemId: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getLowestPrice = (variants: ProductVariant[]): string => {
  if (variants.length === 0) return "-";
  const lowest = variants.reduce(
    (min, v) => (v.price < min.price ? v : min),
    variants[0],
  );
  return formatPrice(lowest.price, lowest.currency);
};

// ============================================================================
// ProductPickerList Component
// ============================================================================

/**
 * Reusable product picker list component
 *
 * Features:
 * - Displays list of products with variants
 * - Shows cart preview when items are added
 * - Empty state for loading and no products
 */
export const ProductPickerList: React.FC<ProductPickerListProps> = ({
  products,
  cartItems,
  isLoading,
  onProductPress,
  onRemoveItem,
}) => {
  return (
    <YStack flex={1}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Preview */}
        {cartItems.length > 0 && (
          <YStack paddingHorizontal="$4" paddingBottom="$3">
            <OrderCartPreview items={cartItems} onRemoveItem={onRemoveItem} />
          </YStack>
        )}

        <YStack paddingHorizontal="$4" paddingBottom="$2" paddingTop="$3">
          <Text fontSize="$3" color="$softGrayDark" fontWeight="500">
            {t("ordersSelectProducts")}
          </Text>
        </YStack>
        {/* Products List */}
        {isLoading ? (
          <YStack padding="$4" alignItems="center">
            <Text color="$softGray">{t("loading")}</Text>
          </YStack>
        ) : products.length === 0 ? (
          <YStack gap="$2" alignItems="center" marginTop="$10">
            <Text color="$inkBlackLight" textAlign="center">
              {t("emptyNoProductsAvailable")}
            </Text>
            <Text color="$softGray" textAlign="center" fontSize="$3">
              {t("emptyNoProductsHint")}
            </Text>
          </YStack>
        ) : (
          <YStack paddingHorizontal="$1">
            {products.map((item) => (
              <ProductPickerCard
                key={item.product.id}
                name={item.product.name}
                imageUrl={item.product.imageUrl}
                variantsCount={item.variants.length}
                lowestPrice={getLowestPrice(item.variants)}
                onPress={() => onProductPress(item)}
              />
            ))}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
};
