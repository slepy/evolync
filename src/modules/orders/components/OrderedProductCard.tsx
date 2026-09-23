import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { Package } from "lucide-react-native";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Text, XStack, YStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface OrderedProductCardProps {
  /** Product name */
  productName: string;
  /** Variant name */
  variantName: string;
  /** Product image URL */
  imageUrl: string | null;
  /** Total quantity ordered */
  totalQuantity: number;
  /** Callback when card is pressed */
  onPress?: () => void;
}

// ============================================================================
// OrderedProductCard Component
// ============================================================================

/**
 * Card displaying an aggregated ordered product.
 *
 * Features:
 * - Product thumbnail with fallback icon
 * - Product and variant name
 * - Quantity badge
 * - Press interaction
 */
export const OrderedProductCard: React.FC<OrderedProductCardProps> = ({
  productName,
  variantName,
  imageUrl,
  totalQuantity,
  onPress,
}) => {
  return (
    <BaseCard onPress={onPress}>
      <XStack gap="$3" alignItems="center">
        <Thumbnail icon={<Package />} imageUrl={imageUrl} />

        <CardInfo displayName={productName} subtitle={variantName} />

        <YStack alignItems="flex-end">
          <XStack
            backgroundColor="$purple3"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
          >
            <Text fontSize="$3" fontWeight="700" color="$purple10">
              {t("ordersOrderedQuantity", { count: totalQuantity })}
            </Text>
          </XStack>
        </YStack>
      </XStack>
    </BaseCard>
  );
};
