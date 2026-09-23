import { formatPrice } from "@/modules/core/utils/formatters";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { Package, Trash2 } from "lucide-react-native";
import React from "react";
import { Button, Image, Text, XStack, YStack, useTheme } from "tamagui";

import type { CartItem } from "../types/dto";
import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";

// ============================================================================
// Types
// ============================================================================

interface OrderCartPreviewProps {
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
}

// ============================================================================
// OrderCartPreview Component
// ============================================================================

export const OrderCartPreview: React.FC<OrderCartPreviewProps> = ({
  items,
  onRemoveItem,
}) => {
  const theme = useTheme();
  const resolvedIconColor = theme.purple11?.val;
  const resolvedIconBgColor = theme.purple3?.val;
  const resolvedDeleteColor = theme.imperialRedDark?.val;

  if (items.length === 0) {
    return null;
  }

  // Group totals by currency
  const totalsByCurrency = items.reduce<Record<string, number>>((acc, item) => {
    const amount = item.unitPrice * item.quantity;
    acc[item.currency] = (acc[item.currency] || 0) + amount;
    return acc;
  }, {});

  const currencies = Object.keys(totalsByCurrency);

  return (
    <YStack gap="$3" borderWidth={0} backgroundColor="$transparent">
      {/* Header */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$transparent"
      >
        <Text fontSize="$3" color="$softGrayDark">
          {t("ordersCartTitle")}
        </Text>
        <Text fontSize="$3" color="$softGrayDark">
          {items.length} {t("items")}
        </Text>
      </XStack>

      {/* Items List */}
      <YStack gap="$2">
        {items.map((item) => (
          <XStack
            key={item.variantId}
            gap="$2"
            alignItems="center"
            backgroundColor="$transparent"
            borderRadius="$3"
            padding="$2"
            borderWidth={1}
            borderColor="$softGrayLight"
          >
            {/* Icon/Image */}
            <Thumbnail
              imageUrl={item.imageUrl}
              borderColor={resolvedIconColor}
              backgroundColor={resolvedIconBgColor}
              size={32}
              iconSize={16}
              icon={<Package />}
            />

            {/* Item Details */}
            <CardInfo
              displayName={item.productName}
              subtitle={`${item.variantName} × ${item.quantity}`}
            />

            {/* Price */}
            <Text fontSize="$3" fontWeight="600" color="$softGrayDark">
              {formatPrice(item.unitPrice * item.quantity, item.currency)}
            </Text>

            {/* Remove Button */}
            <Button
              size="$2"
              chromeless
              pressStyle={{
                scale: 0.95,
                backgroundColor: "$imperialRedLighter",
              }}
              onPress={() => confirmDelete(t("delete"), t("ordersRemoveItemConfirm"), () => onRemoveItem(item.id))}
            >
              <Trash2
                size={17}
                color={resolvedDeleteColor}
                pointerEvents="none"
              />
            </Button>
          </XStack>
        ))}
      </YStack>

      {/* Total */}
      <BaseCard
        onPress={() => {}}
        backgroundColor="$jadeGreenLighter"
        borderColor="$jadeGreen"
        marginHorizontal="$0"
      >
        <XStack gap="$3" alignItems="center" justifyContent="space-between">
          <Text fontSize="$4" color="$jadeGreenDark">
            {t("total")}
          </Text>

          <YStack alignItems="flex-end" gap="$2">
            {currencies.map((currency) => (
              <Text
                key={currency}
                fontSize="$4"
                fontWeight="700"
                color="$jadeGreen"
              >
                {formatPrice(totalsByCurrency[currency], currency)}
              </Text>
            ))}
          </YStack>
        </XStack>
      </BaseCard>
    </YStack>
  );
};
