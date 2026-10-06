import { ListCard, ListImage, ListSection, TrashButton } from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { Package } from "lucide-react-native";
import React from "react";
import { Text, XStack, YStack } from "tamagui";
import type { CartItem } from "../types/dto";
import { cartItemCount, cartTotals } from "./orderCart";
import { amountLines, formatAmount } from "./orderListState";

interface OrderProductsSectionProps {
  cart: CartItem[];
  /** Editable: Add new, tap a row to change its sizes, trash removes it. Read-only otherwise. */
  editable?: boolean;
  onAddProduct?: () => void;
  onProductPress?: (productId: string) => void;
  onRemove?: (itemId: string) => void;
  /** Dashed card while there are no products (12E: "Pick a student first…"). */
  emptyText?: string;
  /** Hide Add new until the order can take products (12E: no student yet). */
  canAdd?: boolean;
  /** Hint under the card ("Tap a product to change the size or quantity…"). */
  hint?: string;
}

/** Products of an order (12D / 12E2): rows with sizes, price each and amount, Total under the rows. */
export const OrderProductsSection: React.FC<OrderProductsSectionProps> = ({
  cart,
  editable,
  onAddProduct,
  onProductPress,
  onRemove,
  emptyText,
  canAdd = true,
  hint,
}) => {
  const count = cartItemCount(cart);

  return (
    <ListSection
      title={t("ordersSelectProducts")}
      subtitle={count === 0 ? t("ordersNoProductsYet") : t("ordersItemsCount", { count })}
      accent="orders"
      action={editable && canAdd && onAddProduct ? { label: t("addNew"), onPress: onAddProduct } : undefined}
    >
      {cart.length === 0 ? (
        <YStack
          paddingVertical={18}
          paddingHorizontal={16}
          borderRadius={20}
          borderWidth={1}
          borderStyle="dashed"
          borderColor="$neutralRaisedBorder"
          backgroundColor="$neutralCard"
        >
          <Text fontSize={14} fontWeight="600" color="$neutralMuted">
            {emptyText ?? t("ordersNoItems")}
          </Text>
        </YStack>
      ) : (
        <YStack gap={12}>
          <ListCard aria-label={t("ordersSelectProducts")}>
            {cart.map((item) => (
              <XStack key={item.id} alignItems="center" gap={10} paddingVertical={10} paddingLeft={16} paddingRight={editable ? 12 : 16}>
                <XStack
                  role={editable ? "button" : undefined}
                  aria-label={item.productName}
                  onPress={editable && onProductPress ? () => onProductPress(item.productId) : undefined}
                  pressStyle={editable ? { opacity: 0.85 } : undefined}
                  flex={1}
                  minWidth={0}
                  alignItems="center"
                  gap={12}
                >
                  <ListImage uri={item.imageUrl} icon={Package} accent="products" size={44} />
                  <YStack flex={1} minWidth={0} gap={3}>
                    <Text fontSize={15} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
                      {t("ordersLineHint", {
                        size: item.variantName,
                        quantity: item.quantity,
                        price: formatAmount(item.unitPrice, item.currency),
                      })}
                    </Text>
                  </YStack>
                  <Text fontSize={14} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1} flexShrink={0}>
                    {formatAmount(item.unitPrice * item.quantity, item.currency)}
                  </Text>
                </XStack>
                {editable && onRemove ? (
                  <TrashButton label={t("ordersRemoveProduct", { name: item.productName })} onPress={() => onRemove(item.id)} />
                ) : null}
              </XStack>
            ))}
            <TotalRow totals={cartTotals(cart)} />
          </ListCard>
          {hint ? (
            <Text fontSize={12.5} fontWeight="$secondary" lineHeight={18} color={neutral.placeholder}>
              {hint}
            </Text>
          ) : null}
        </YStack>
      )}
    </ListSection>
  );
};

/** Total on the raised fill, one amount per currency stacked on the right. */
function TotalRow({ totals }: { totals: Record<string, number> }) {
  return (
    <YStack>
      <XStack alignItems="flex-start" gap={12} paddingVertical={14} paddingHorizontal={16} backgroundColor="$neutralRaised">
        <Text flex={1} fontSize={15} fontWeight="$rowTitle" color="$neutralText">
          {t("total")}
        </Text>
        <YStack alignItems="flex-end" gap={2}>
          {amountLines(totals).map((line) => (
            <Text key={line} fontSize={16} fontWeight="$rowTitle" color="$neutralText">
              {line}
            </Text>
          ))}
        </YStack>
      </XStack>
    </YStack>
  );
}
