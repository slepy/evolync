import { Package } from "lucide-react-native";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Text, XStack, YStack } from "tamagui";

import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { formatPrice } from "@/modules/core/utils/formatters";
import type { ProductVariantResponseDto } from "../types/dto";

// ============================================================================
// Types
// ============================================================================

interface ProductCardProps {
  name: string;
  imageUrl?: string | null;
  variants: ProductVariantResponseDto[];
  onPress: () => void;
}

/**
 * Gets the lowest price from variants
 */
const getLowestPrice = (variants: ProductVariantResponseDto[]): string => {
  if (variants.length === 0) return "-";

  const lowest = variants.reduce(
    (min, v) => (v.price < min.price ? v : min),
    variants[0],
  );
  return formatPrice(lowest.price, lowest.currency);
};

/**
 * Gets total stock across all variants
 */
const getTotalStock = (variants: ProductVariantResponseDto[]): number => {
  return variants.reduce((sum, v) => sum + v.stockQuantity, 0);
};

/**
 * Gets stock status label and color
 */
const getStockStatus = (
  totalStock: number,
): { label: string; color: ColorTokens; bgColor: ColorTokens } => {
  if (totalStock === 0) {
    return {
      label: t("statusOutOfStock"),
      color: "$red10",
      bgColor: "$red3",
    };
  }
  if (totalStock <= 5) {
    return {
      label: t("statusLowStock"),
      color: "$orange10",
      bgColor: "$orange3",
    };
  }
  return {
    label: t("statusInStock"),
    color: "$jadeGreen",
    bgColor: "$jadeGreenLighter",
  };
};

// ============================================================================
// ProductCard Component
// ============================================================================

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  imageUrl,
  variants,
  onPress,
}) => {
  const totalStock = getTotalStock(variants);
  const stockStatus = getStockStatus(totalStock);
  const lowestPrice = getLowestPrice(variants);

  return (
    <BaseCard onPress={onPress}>
      <XStack gap="$3" alignItems="center">
        {/* Icon/Image Container */}
        <Thumbnail
          icon={<Package />}
          imageUrl={imageUrl}
          borderColor="$pink11"
          backgroundColor="$pink3"
        />

        {/* Content */}
        <CardInfo
          displayName={name}
          subtitle={
            variants.length > 1 ? `${t("from")} ${lowestPrice}` : lowestPrice
          }
        />

        {/* Price and Stock Row */}
        <YStack gap="$1" alignItems="flex-end" flex={1}>
          {/* Stock Badge */}
          <XStack
            backgroundColor={stockStatus.bgColor}
            paddingHorizontal="$1.5"
            paddingVertical={2}
            borderRadius="$1"
          >
            <Text fontSize="$1" fontWeight="500" color={stockStatus.color}>
              {stockStatus.label} ({totalStock})
            </Text>
          </XStack>

          {/* Variants Count */}
          {variants.length > 1 && (
            <Text fontSize="$1" color="$softGrayDark">
              {variants.length} {t("inventoryVariants").toLowerCase()}
            </Text>
          )}
        </YStack>
      </XStack>
    </BaseCard>
  );
};
