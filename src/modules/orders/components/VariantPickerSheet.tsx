import { formatPrice } from "@/modules/core/utils/formatters";
import { Minus, Package, Plus } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Image, Sheet, Text, XStack, YStack, useTheme } from "tamagui";
import { v4 as uuidv4 } from "uuid";

import type { CartItem } from "../types/dto";

// ============================================================================
// Types
// ============================================================================

interface VariantData {
  id: string;
  name: string;
  price: number;
  currency: string;
  stockQuantity: number;
}

interface VariantPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productDescription?: string | null;
  productImageUrl?: string | null;
  variants: VariantData[];
  /** Existing cart items for this product - used to pre-fill quantities */
  existingCartItems?: CartItem[];
  /** Called with updated items - replaces existing items for this product */
  onUpdateItems: (items: CartItem[]) => void;
}

// ============================================================================
// VariantPickerSheet Component
// ============================================================================

export const VariantPickerSheet: React.FC<VariantPickerSheetProps> = ({
  open,
  onOpenChange,
  productId,
  productName,
  productDescription,
  productImageUrl,
  variants,
  existingCartItems = [],
  onUpdateItems,
}) => {
  const theme = useTheme();
  // Track quantities for each variant independently
  const [variantQuantities, setVariantQuantities] = useState<
    Record<string, number>
  >({});

  // Initialize quantities from existing cart items when sheet opens
  useEffect(() => {
    if (open) {
      const initialQuantities: Record<string, number> = {};
      existingCartItems.forEach((item) => {
        initialQuantities[item.variantId] = item.quantity;
      });
      setVariantQuantities(initialQuantities);
    }
  }, [open, existingCartItems]);

  const handleQuantityChange = (variantId: string, change: number) => {
    setVariantQuantities((prev) => {
      const currentQty = prev[variantId] || 0;
      const newQty = Math.max(0, currentQty + change);
      if (newQty === 0) {
        const { [variantId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [variantId]: newQty };
    });
  };

  const handleAddToOrder = () => {
    const updatedItems: CartItem[] = Object.entries(variantQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([variantId, qty]) => {
        const variant = variants.find((v) => v.id === variantId)!;
        // Reuse existing cart item ID if updating, otherwise generate new one
        const existingItem = existingCartItems.find(
          (item) => item.variantId === variantId,
        );
        return {
          id: existingItem?.id || uuidv4(),
          variantId: variant.id,
          variantName: variant.name,
          productName: productName,
          productId: productId,
          quantity: qty,
          unitPrice: variant.price,
          currency: variant.currency,
          imageUrl: productImageUrl ?? undefined,
        };
      });

    onUpdateItems(updatedItems);

    // Reset and close
    setVariantQuantities({});
    onOpenChange(false);
  };

  const resolvedIconColor = theme.purple10?.val || "#7c3aed";

  // Calculate total items being added
  const totalItemsCount = Object.values(variantQuantities).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  // Calculate total price grouped by currency
  const totalsByCurrency = Object.entries(variantQuantities).reduce<
    Record<string, number>
  >((acc, [variantId, qty]) => {
    const variant = variants.find((v) => v.id === variantId);
    if (variant && qty > 0) {
      acc[variant.currency] =
        (acc[variant.currency] || 0) + variant.price * qty;
    }
    return acc;
  }, {});

  const insets = useSafeAreaInsets();

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[80]}
      dismissOnSnapToBottom
      zIndex={100000}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame
        padding="$4"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <Sheet.Handle />
        <YStack gap="$4" flex={1}>
          {/* Product Header with Large Image */}
          <YStack gap="$3">
            {productImageUrl ? (
              <Image
                source={{ uri: productImageUrl, width: 200, height: 200 }}
                width="100%"
                height={180}
                borderRadius="$4"
                borderWidth={1}
                borderColor="$softGray"
                objectFit="cover"
                backgroundColor="$softGrayLight"
              />
            ) : (
              <XStack
                width="100%"
                height={180}
                backgroundColor="$purple3"
                borderRadius="$4"
                justifyContent="center"
                alignItems="center"
                borderWidth={1}
                borderColor="$purple10"
              >
                <Package
                  size={64}
                  color={resolvedIconColor}
                  strokeWidth={1.5}
                />
              </XStack>
            )}
            <YStack gap="$1">
              <Text fontSize="$6" fontWeight="700" color="$inkBlack">
                {productName}
              </Text>
              {productDescription ? (
                <Text fontSize="$3" color="$softGrayDark" numberOfLines={3}>
                  {productDescription}
                </Text>
              ) : null}
            </YStack>
          </YStack>

          {/* Variants List with Quantity Controls */}
          <YStack gap="$2" flex={1}>
            <Text fontSize="$3" color="$softGrayDark" fontWeight="500">
              {t("inventoryVariants")}
            </Text>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <YStack gap="$3">
                {variants.map((variant) => {
                  const isOutOfStock = variant.stockQuantity === 0;
                  const currentQty = variantQuantities[variant.id] || 0;
                  const hasQuantity = currentQty > 0;

                  return (
                    <XStack
                      key={variant.id}
                      backgroundColor={
                        hasQuantity ? "$purple3" : "$softGrayLighter"
                      }
                      borderRadius="$4"
                      borderWidth={hasQuantity ? 2 : 1}
                      borderColor={hasQuantity ? "$purple11" : "$softGray"}
                      padding="$3"
                      alignItems="center"
                      gap="$3"
                    >
                      {/* Variant Info */}
                      <YStack flex={1} gap="$1">
                        <Text
                          fontSize="$4"
                          fontWeight="600"
                          color={hasQuantity ? "$purple11" : "$inkBlack"}
                        >
                          {variant.name}
                        </Text>
                        <XStack gap="$2" alignItems="center">
                          <Text
                            fontSize="$3"
                            color="$softGrayDark"
                            fontWeight="500"
                          >
                            {formatPrice(variant.price, variant.currency)}
                          </Text>
                          <Text
                            fontSize="$2"
                            color={
                              isOutOfStock
                                ? "$imperialRedLight"
                                : "$softGrayDark"
                            }
                          >
                            {isOutOfStock
                              ? t("statusOutOfStock")
                              : t("ordersStockAvailable", {
                                  count: variant.stockQuantity,
                                })}
                          </Text>
                        </XStack>
                      </YStack>

                      {/* Quantity Controls */}
                      <XStack gap="$2" alignItems="center">
                        <Button
                          width="$3"
                          height="$3"
                          backgroundColor={
                            currentQty > 0 ? "$purple3" : "$softGrayLighter"
                          }
                          borderWidth={1}
                          borderColor={
                            currentQty > 0 ? "$purple11" : "$softGray"
                          }
                          pressStyle={{ scale: 0.95 }}
                          disabled={currentQty <= 0}
                          opacity={currentQty <= 0 ? 0.4 : 1}
                          onPress={() => handleQuantityChange(variant.id, -1)}
                        >
                          <Minus
                            size={16}
                            color={theme.purple11?.val}
                            pointerEvents="none"
                          />
                        </Button>

                        <Text
                          fontSize="$5"
                          fontWeight="700"
                          color={hasQuantity ? "$purple11" : "$softGrayDark"}
                          minWidth={32}
                          textAlign="center"
                        >
                          {currentQty}
                        </Text>

                        <Button
                          width="$3"
                          height="$3"
                          backgroundColor="$purple3"
                          borderWidth={1}
                          borderColor="$purple11"
                          pressStyle={{ scale: 0.95 }}
                          onPress={() => handleQuantityChange(variant.id, 1)}
                        >
                          <Plus
                            size={16}
                            color={theme.purple11?.val}
                            pointerEvents="none"
                          />
                        </Button>
                      </XStack>
                    </XStack>
                  );
                })}
              </YStack>
            </ScrollView>
          </YStack>

          {/* Add/Update Button */}
          <Button
            size="$5"
            backgroundColor={totalItemsCount > 0 ? "$purple11" : "$softGray"}
            paddingBottom={
              Platform.OS === "android"
                ? Math.max(insets.bottom, 16)
                : undefined
            }
            color="$pearlWhite"
            fontWeight="600"
            disabled={totalItemsCount === 0}
            pressStyle={
              totalItemsCount > 0
                ? { scale: 0.98, backgroundColor: "$purple11" }
                : {}
            }
            onPress={handleAddToOrder}
          >
            {totalItemsCount > 0
              ? `${existingCartItems.length > 0 ? t("save") : t("ordersAddToOrder")} (${totalItemsCount}) - ${Object.entries(
                  totalsByCurrency,
                )
                  .map(([currency, amount]) => formatPrice(amount, currency))
                  .join(" + ")}`
              : t("ordersSelectQuantity")}
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
