import {
  FormSheet,
  ListCard,
  ListChip,
  ListImage,
  ListRow,
  PrimaryButton,
  resolveListAccent,
} from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { formatPrice } from "@/modules/core/utils/formatters";
import type { ProductResponseDto } from "@/modules/inventory/types/dto";
import { Minus, Plus, ShoppingBag } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { Text, XStack, YStack } from "tamagui";
import type { CartItem } from "../types/dto";
import { applyCartQuantities, type CartVariant } from "./orderCart";
import { isStandardVariant } from "./orderListState";

interface AddProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductResponseDto[];
  cart: CartItem[];
  /** The cart with the chosen quantities applied. */
  onAdd: (cart: CartItem[]) => void;
}

const toCartVariants = (product: ProductResponseDto): CartVariant[] =>
  product.variants.map((variant) => ({
    variantId: variant.id,
    variantName: variant.name,
    productId: product.id,
    productName: product.name,
    unitPrice: variant.price,
    currency: variant.currency,
    imageUrl: product.imageUrl ?? undefined,
  }));

const quantitiesOf = (cart: CartItem[]): Record<string, number> =>
  Object.fromEntries(cart.map((item) => [item.variantId, item.quantity]));

/** Lowest price per currency: "from 120,00 zł" or the one price of a single size. */
const priceLine = (product: ProductResponseDto): string => {
  const lowest = new Map<string, number>();
  for (const v of product.variants) {
    lowest.set(v.currency, Math.min(lowest.get(v.currency) ?? Infinity, v.price));
  }
  const prices = [...lowest].map(([currency, price]) => formatPrice(price, currency)).join(" · ");
  return product.variants.length > 1 ? t("ordersPriceFrom", { price: prices }) : prices;
};

/**
 * Add product (12F): the organization's products; tap one to expand its
 * sizes, set the quantity of each, Add applies them to the order.
 */
export const AddProductSheet: React.FC<AddProductSheetProps> = ({ open, onOpenChange, products, cart, onAdd }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      setQuantities(quantitiesOf(cart));
      setExpandedId(null);
    }
    // Reset only when the sheet opens; the cart changes through this sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const available = useMemo(() => products.filter((p) => p.variants.length > 0), [products]);
  const before = useMemo(() => quantitiesOf(cart), [cart]);
  const changed = Object.entries(quantities).some(([id, qty]) => (before[id] ?? 0) !== qty);

  const handleAdd = () => {
    const variants = available.flatMap(toCartVariants);
    onAdd(applyCartQuantities(cart, variants, quantities, uuidv4));
    onOpenChange(false);
  };

  const setQuantity = (variantId: string, quantity: number) =>
    setQuantities((prev) => ({ ...prev, [variantId]: Math.max(0, quantity) }));

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("ordersAddProduct")}
      subtitle={t("ordersAddProductHint")}
      footer={<PrimaryButton label={t("add")} accent="orders" onPress={handleAdd} disabled={!changed} />}
    >
      {available.length === 0 ? (
        <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {t("ordersNoProducts")}
        </Text>
      ) : (
        <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled">
          <ListCard aria-label={t("ordersAddProduct")}>
            {available.map((product) => {
              const inOrder = product.variants.reduce((sum, v) => sum + (quantities[v.id] ?? 0), 0);
              const expanded = expandedId === product.id;
              return (
                <ListRow
                  key={product.id}
                  title={product.name}
                  subtitle={priceLine(product)}
                  leading={<ListImage uri={product.imageUrl} icon={ShoppingBag} accent="products" />}
                  trailing={inOrder > 0 ? <ListChip label={`×${inOrder}`} accent="orders" /> : undefined}
                  accent="orders"
                  selected={expanded}
                  expanded={expanded}
                  onPress={() => setExpandedId(expanded ? null : product.id)}
                >
                  <YStack gap={10}>
                    {product.variants.map((variant) => (
                      <XStack key={variant.id} alignItems="center" gap={12}>
                        <YStack flex={1} minWidth={0} gap={2}>
                          <Text fontSize={14.5} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
                            {isStandardVariant(variant.name) ? t("fieldQuantity") : variant.name}
                          </Text>
                          <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
                            {[
                              formatPrice(variant.price, variant.currency),
                              variant.stockQuantity > 0
                                ? t("ordersStockAvailable", { count: variant.stockQuantity })
                                : t("statusOutOfStock"),
                            ].join(" · ")}
                          </Text>
                        </YStack>
                        <QuantityStepper
                          label={variant.name}
                          value={quantities[variant.id] ?? 0}
                          onChange={(qty) => setQuantity(variant.id, qty)}
                        />
                      </XStack>
                    ))}
                  </YStack>
                </ListRow>
              );
            })}
          </ListCard>
        </ScrollView>
      )}
    </FormSheet>
  );
};

/** − n + in the Orders violet; − is muted at 0. */
export function QuantityStepper({
  value,
  onChange,
  label,
  min = 0,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
}) {
  const a = resolveListAccent("orders");
  const canDecrease = value > min;
  return (
    <XStack alignItems="center" gap={10} flexShrink={0}>
      <XStack
        role="button"
        aria-label={t("ordersDecrease", { name: label })}
        aria-disabled={!canDecrease}
        onPress={canDecrease ? () => onChange(value - 1) : undefined}
        pressStyle={canDecrease ? { opacity: 0.8 } : undefined}
        width={36}
        height={36}
        borderRadius={18}
        alignItems="center"
        justifyContent="center"
        backgroundColor={canDecrease ? a.fill : "$neutralTintFill"}
      >
        <Minus size={16} color={canDecrease ? a.tint : neutral.muted} strokeWidth={2.8} />
      </XStack>
      <Text minWidth={22} textAlign="center" fontSize={16} fontWeight="$rowTitle" color="$neutralText">
        {value}
      </Text>
      <XStack
        role="button"
        aria-label={t("ordersIncrease", { name: label })}
        onPress={() => onChange(value + 1)}
        pressStyle={{ opacity: 0.8 }}
        width={36}
        height={36}
        borderRadius={18}
        alignItems="center"
        justifyContent="center"
        backgroundColor={a.fill}
      >
        <Plus size={16} color={a.tint} strokeWidth={2.8} />
      </XStack>
    </XStack>
  );
}
