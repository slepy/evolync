import {
  FormSheet,
  ListCard,
  ListChip,
  ListImage,
  ListRow,
  PrimaryButton,
  SearchField,
  matchesSearch,
} from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { formatPrice } from "@/core/utils/formatters";
import type { ProductResponseDto } from "@/modules/inventory/types/dto";
import { ChevronDown, Package } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { Text, XStack, YStack } from "tamagui";
import type { CartItem } from "../types/dto";
import { applyCartQuantities, cartTotals, type CartVariant } from "./orderCart";
import { VariantRow } from "./VariantRow";

interface AddProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductResponseDto[];
  cart: CartItem[];
  /** The cart with the chosen quantities applied. */
  onAdd: (cart: CartItem[]) => void;
  /** Product expanded on open (a product row of 12D / 12E tapped). */
  focusProductId?: string | null;
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

/** "From 110,00 zł · 4 sizes", or the one price of a single size. */
const productMeta = (product: ProductResponseDto): string => {
  const lowest = new Map<string, number>();
  for (const v of product.variants) {
    lowest.set(v.currency, Math.min(lowest.get(v.currency) ?? Infinity, v.price));
  }
  const prices = [...lowest].map(([currency, price]) => formatPrice(price, currency)).join(" · ");
  if (product.variants.length === 1) return prices;
  const differ = new Set(product.variants.map((v) => `${v.currency}:${v.price}`)).size > 1;
  return [
    differ ? t("ordersPriceFrom", { price: prices }) : prices,
    t("ordersSizesCount", { count: product.variants.length }),
  ].join(" · ");
};

/**
 * Add product (12F): tall sheet with search and the organization's products;
 * tap one to expand its sizes, set the quantity of each, the footer shows the
 * picked count and total, Add applies them to the order.
 */
export const AddProductSheet: React.FC<AddProductSheetProps> = ({
  open,
  onOpenChange,
  products,
  cart,
  onAdd,
  focusProductId,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setQuantities(quantitiesOf(cart));
      setExpandedId(focusProductId ?? null);
      setQuery("");
    }
    // Reset only when the sheet opens; the cart changes through this sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const available = useMemo(() => products.filter((p) => p.variants.length > 0), [products]);
  const visible = useMemo(() => available.filter((p) => matchesSearch(query, p.name)), [available, query]);
  const before = useMemo(() => quantitiesOf(cart), [cart]);
  const changed = Object.entries(quantities).some(([id, qty]) => (before[id] ?? 0) !== qty);

  const picked = useMemo(
    () =>
      available.flatMap((p) =>
        p.variants.map((v) => ({ quantity: quantities[v.id] ?? 0, unitPrice: v.price, currency: v.currency })),
      ),
    [available, quantities],
  );
  const count = picked.reduce((sum, item) => sum + item.quantity, 0);
  const totals = Object.entries(cartTotals(picked.filter((item) => item.quantity > 0)));
  const totalLabel =
    totals.length > 0
      ? totals.map(([currency, total]) => formatPrice(total, currency)).join(" · ")
      : formatPrice(0, available[0]?.variants[0]?.currency ?? "PLN");

  const handleAdd = () => {
    const variants = available.flatMap(toCartVariants);
    onAdd(applyCartQuantities(cart, variants, quantities, uuidv4));
    onOpenChange(false);
  };

  const setQuantity = (variantId: string, quantity: number) =>
    setQuantities((prev) => ({ ...prev, [variantId]: Math.max(0, quantity) }));

  return (
    <FormSheet
      fill
      open={open}
      onOpenChange={onOpenChange}
      title={t("ordersAddProduct")}
      subtitle={t("ordersAddProductHint")}
      footer={
        <YStack gap={10}>
          <XStack alignItems="center" justifyContent="space-between" gap={12}>
            <Text fontSize={14} fontWeight="700" color="$neutralMuted">
              {count === 0 ? t("ordersNothingPicked") : t("ordersItemsCount", { count })}
            </Text>
            <Text fontSize={16} fontWeight="800" color="$neutralText" numberOfLines={1} flexShrink={1}>
              {totalLabel}
            </Text>
          </XStack>
          <PrimaryButton
            label={t("add")}
            accent="orders"
            onPress={handleAdd}
            disabled={!changed}
            colors={changed ? undefined : { from: neutral.cardBorder, to: neutral.cardBorder, text: neutral.placeholder }}
          />
        </YStack>
      }
    >
      <SearchField value={query} onChangeText={setQuery} placeholder={t("ordersSearchProduct")} accent="orders" />
      {visible.length === 0 ? (
        <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {available.length === 0 ? t("ordersNoProducts") : t("ordersNoProductsFound")}
        </Text>
      ) : (
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <ListCard aria-label={t("ordersAddProduct")}>
            {visible.map((product) => {
              const inOrder = product.variants.reduce((sum, v) => sum + (quantities[v.id] ?? 0), 0);
              const expanded = expandedId === product.id;
              return (
                <ListRow
                  key={product.id}
                  size="md"
                  title={product.name}
                  subtitle={productMeta(product)}
                  leading={<ListImage uri={product.imageUrl} icon={Package} accent="products" size={44} />}
                  trailing={
                    <XStack alignItems="center" gap={12} flexShrink={0}>
                      {inOrder > 0 ? <ListChip label={`×${inOrder}`} accent="orders" /> : null}
                      <ChevronDown
                        size={18}
                        color={neutral.muted}
                        strokeWidth={2.2}
                        style={expanded ? { transform: [{ rotate: "180deg" }] } : undefined}
                      />
                    </XStack>
                  }
                  accent="orders"
                  expanded={expanded}
                  onPress={() => setExpandedId(expanded ? null : product.id)}
                >
                  <YStack gap={2} marginRight={-4}>
                    {product.variants.map((variant) => (
                      <VariantRow
                        key={variant.id}
                        label={`${product.name} ${variant.name}`}
                        name={variant.name}
                        price={formatPrice(variant.price, variant.currency)}
                        stock={variant.stockQuantity}
                        value={quantities[variant.id] ?? 0}
                        onChange={(qty) => setQuantity(variant.id, qty)}
                      />
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
