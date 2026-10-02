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

interface CurrencyGroupSummary {
  currency: string;
  lowestPrice: number;
  totalStock: number;
}

/**
 * Groups variants by currency, then computes the lowest price and total
 * stock per currency group. A product's variants aren't guaranteed to share
 * one currency, so this avoids blending unrelated currencies into one
 * meaningless number.
 */
const getSummaryByCurrency = (
  variants: ProductVariantResponseDto[],
): CurrencyGroupSummary[] => {
  const groups = new Map<string, ProductVariantResponseDto[]>();
  for (const variant of variants) {
    const list = groups.get(variant.currency) ?? [];
    list.push(variant);
    groups.set(variant.currency, list);
  }

  return Array.from(groups.entries()).map(([currency, group]) => ({
    currency,
    lowestPrice: group.reduce((min, v) => Math.min(min, v.price), group[0].price),
    totalStock: group.reduce((sum, v) => sum + v.stockQuantity, 0),
  }));
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
    bgColor: "$successSurface",
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
  const summaries = getSummaryByCurrency(variants);
  const showFromPrefix = variants.length > 1;

  const priceSubtitle = summaries
    .map((s) =>
      showFromPrefix
        ? `${t("from")} ${formatPrice(s.lowestPrice, s.currency)}`
        : formatPrice(s.lowestPrice, s.currency),
    )
    .join(" · ");

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
        <CardInfo displayName={name} subtitle={priceSubtitle} />

        {/* Price and Stock Row */}
        <YStack gap="$1" alignItems="flex-end" flex={1}>
          {/* One stock badge per currency group */}
          {summaries.map((s) => {
            const stockStatus = getStockStatus(s.totalStock);
            return (
              <XStack
                key={s.currency}
                backgroundColor={stockStatus.bgColor}
                paddingHorizontal="$1.5"
                paddingVertical={2}
                borderRadius="$1"
              >
                <Text fontSize="$1" fontWeight="500" color={stockStatus.color}>
                  {stockStatus.label} ({s.totalStock})
                  {summaries.length > 1 ? ` ${s.currency}` : ""}
                </Text>
              </XStack>
            );
          })}

          {/* Variants Count */}
          {variants.length > 1 && (
            <Text fontSize="$1" color="$textSecondary">
              {variants.length} {t("inventoryVariants").toLowerCase()}
            </Text>
          )}
        </YStack>
      </XStack>
    </BaseCard>
  );
};
