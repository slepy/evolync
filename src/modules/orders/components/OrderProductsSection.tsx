import { ListDivider, ListImage, ListRow, ListSection, TrashButton } from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { confirmDelete } from "@/core/utils/confirmDelete";
import { formatPrice } from "@/core/utils/formatters";
import { ShoppingBag } from "lucide-react-native";
import React, { Fragment } from "react";
import { Text, View, XStack, YStack } from "tamagui";
import type { CartItem } from "../types/dto";
import { cartItemCount, cartTotals } from "./orderCart";
import { isStandardVariant } from "./orderListState";

interface OrderProductsSectionProps {
  cart: CartItem[];
  /** Editable: Add new, tap a row to change it (`onEditProduct`), trash removes it. Read-only otherwise. */
  onChange?: (cart: CartItem[]) => void;
  onAddProduct?: () => void;
  /** Opens Add product (12F) on the tapped product. */
  onEditProduct?: (productId: string) => void;
  /** "120 PLN each" after the size and quantity (12E). */
  showUnitPrice?: boolean;
  /** Muted hint under the card while editable. */
  hint?: string;
  /** Shown under the list when there is nothing yet (12E). */
  emptyText?: string;
  error?: string;
}

/**
 * PRODUCTS of an order (12D / 12E): one row per size ("160 cm ×2", line
 * total on the right, trash), Total row inside the card with one line per
 * currency.
 */
export const OrderProductsSection: React.FC<OrderProductsSectionProps> = ({
  cart,
  onChange,
  onAddProduct,
  onEditProduct,
  showUnitPrice,
  hint,
  emptyText,
  error,
}) => {
  const editable = !!onChange;
  const totals = Object.entries(cartTotals(cart));
  const count = cartItemCount(cart);

  const subtitle = (item: CartItem) =>
    [
      `${isStandardVariant(item.variantName) ? "" : `${item.variantName} `}×${item.quantity}`,
      showUnitPrice
        ? t("ordersUnitPrice", {
            price: formatPrice(item.unitPrice, item.currency),
          })
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <ListSection
      title={t("products")}
      subtitle={count > 0 ? t("ordersItemsCount", { count }) : undefined}
      accent="orders"
      action={editable && onAddProduct ? { label: t("addNew"), onPress: onAddProduct } : undefined}
    >
      {cart.length > 0 ? (
        <YStack
          overflow="hidden"
          role="list"
          aria-label={t("products")}
          borderRadius="$card"
          borderWidth={1}
          borderColor="$neutralCardBorder"
          backgroundColor="$neutralCard"
        >
          {cart.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 ? <ListDivider /> : null}
              <XStack alignItems="center" gap={10} paddingRight={editable ? 12 : 0}>
                <YStack flex={1} minWidth={0}>
                  <ListRow
                    size="md"
                    title={item.productName}
                    subtitle={subtitle(item)}
                    leading={<ListImage uri={item.imageUrl} icon={ShoppingBag} accent="products" size={44} />}
                    trailing={
                      <Text fontSize={14} fontWeight="$rowTitle" color="$neutralText" flexShrink={0}>
                        {formatPrice(item.unitPrice * item.quantity, item.currency)}
                      </Text>
                    }
                    onPress={
                      editable && onEditProduct && item.productId ? () => onEditProduct(item.productId) : undefined
                    }
                  />
                </YStack>
                {onChange ? (
                  <TrashButton
                    label={t("ordersRemoveProduct", { name: item.productName })}
                    onPress={() =>
                      confirmDelete(t("delete"), t("ordersRemoveProductConfirm", { name: item.productName }), () =>
                        onChange(cart.filter((line) => line.id !== item.id)),
                      )
                    }
                  />
                ) : null}
              </XStack>
            </Fragment>
          ))}
          <View height={1} backgroundColor="$neutralCardBorder" />
          <XStack
            alignItems="flex-start"
            gap={12}
            paddingVertical={14}
            paddingHorizontal={16}
            backgroundColor="$neutralRaised"
          >
            <Text flex={1} fontSize={15} fontWeight="$rowTitle" color="$neutralText">
              {t("total")}
            </Text>
            <YStack alignItems="flex-end" gap={2}>
              {totals.map(([currency, amount]) => (
                <Text key={currency} fontSize={16} fontWeight="$rowTitle" color="$neutralText">
                  {formatPrice(amount, currency)}
                </Text>
              ))}
            </YStack>
          </XStack>
        </YStack>
      ) : (
        <YStack
          padding={20}
          borderRadius="$card"
          borderWidth={1}
          borderColor="$neutralCardBorder"
          backgroundColor="$neutralCard"
        >
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

      {editable && hint && cart.length > 0 ? (
        <Text fontSize={12.5} lineHeight={18} fontWeight="$secondary" color={neutral.placeholder}>
          {hint}
        </Text>
      ) : null}
    </ListSection>
  );
};
