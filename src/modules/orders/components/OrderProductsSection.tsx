import { ListCard, ListChip, ListImage, ListRow, ListSection } from "@/core/components";
import { formatPrice } from "@/modules/core/utils/formatters";
import { ShoppingBag } from "lucide-react-native";
import React from "react";
import { Text, XStack, YStack } from "tamagui";
import type { CartItem } from "../types/dto";
import { QuantityStepper } from "./AddProductSheet";
import { cartTotals, setCartQuantity } from "./orderCart";
import { formatOrderTotals } from "./orderFormat";
import { isStandardVariant } from "./orderListState";

interface OrderProductsSectionProps {
  cart: CartItem[];
  /** Editable: Add product + quantity steppers (0 removes the line). Read-only otherwise. */
  onChange?: (cart: CartItem[]) => void;
  onAddProduct?: () => void;
  /** Shown under the list when there is nothing yet (12E). */
  emptyText?: string;
  error?: string;
}

/** PRODUCTS of an order (12D / 12E): one row per size with its quantity, Total under the card. */
export const OrderProductsSection: React.FC<OrderProductsSectionProps> = ({
  cart,
  onChange,
  onAddProduct,
  emptyText,
  error,
}) => {
  const editable = !!onChange;
  const total = formatOrderTotals(cartTotals(cart));

  return (
    <ListSection
      title={t("ordersSelectProducts")}
      accent="orders"
      action={editable && onAddProduct ? { label: t("ordersAddProduct"), onPress: onAddProduct } : undefined}
    >
      {cart.length > 0 ? (
        <ListCard aria-label={t("ordersSelectProducts")}>
          {cart.map((item) => (
            <ListRow
              key={item.id}
              title={item.productName}
              subtitle={[
                isStandardVariant(item.variantName) ? null : item.variantName,
                formatPrice(item.unitPrice, item.currency),
              ]
                .filter(Boolean)
                .join(" · ")}
              leading={<ListImage uri={item.imageUrl} icon={ShoppingBag} accent="products" size={44} />}
              trailing={
                onChange ? (
                  <QuantityStepper
                    label={item.productName}
                    value={item.quantity}
                    onChange={(quantity) =>
                      onChange(setCartQuantity(cart, item, quantity, () => item.id))
                    }
                  />
                ) : (
                  <ListChip label={`×${item.quantity}`} accent="orders" />
                )
              }
            />
          ))}
        </ListCard>
      ) : (
        <YStack padding={20} borderRadius="$card" borderWidth={1} borderColor="$neutralCardBorder" backgroundColor="$neutralCard">
          <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" textAlign="center">
            {emptyText ?? t("ordersNoItems")}
          </Text>
        </YStack>
      )}

      {error ? (
        <Text fontSize={12.5} fontWeight="$secondary" color="$trashText">
          {error}
        </Text>
      ) : null}

      {cart.length > 0 ? (
        <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={4} gap={12}>
          <Text fontSize={15} fontWeight="$rowTitle" color="$neutralMuted">
            {t("total")}
          </Text>
          <Text flexShrink={1} textAlign="right" fontSize={17} fontWeight="$section" color="$neutralText">
            {total}
          </Text>
        </XStack>
      ) : null}
    </ListSection>
  );
};
