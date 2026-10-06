import {
  FormSheet,
  ListCard,
  ListChip,
  ListImage,
  ListRow,
  PrimaryButton,
  SearchField,
  matchesSearch,
  resolveListAccent,
} from "@/core/components";
import { neutral, warning } from "@/core/theme/tokens";
import { formatPrice } from "@/modules/core/utils/formatters";
import type { ProductResponseDto } from "@/modules/inventory/types/dto";
import { ChevronDown, Minus, Package, Plus } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { Text, XStack, YStack } from "tamagui";
import type { CartItem } from "../types/dto";
import { applyCartQuantities, cartTotals, type CartVariant } from "./orderCart";

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

/** One size of an expanded product: name, "price · stock", − n + (12F). */
function VariantRow({
  label,
  name,
  price,
  stock,
  value,
  onChange,
}: {
  label: string;
  name: string;
  price: string;
  stock: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const a = resolveListAccent("orders");
  const picked = value > 0;
  return (
    <XStack
      alignItems="center"
      gap={6}
      paddingVertical={4}
      paddingRight={4}
      paddingLeft={12}
      borderRadius={14}
      backgroundColor={picked ? a.selectedFill : "transparent"}
    >
      <YStack flex={1} minWidth={0} gap={2}>
        <Text fontSize={14} fontWeight="800" color="$neutralText" numberOfLines={1}>
          {name}
        </Text>
        <Text fontSize={12} fontWeight="500" color="$neutralMuted" numberOfLines={1}>
          {`${price} · `}
          {stock > 0 ? (
            t("ordersStockAvailable", { count: stock })
          ) : (
            <Text fontSize={12} fontWeight="700" color={warning.text}>
              {t("statusOutOfStock")}
            </Text>
          )}
        </Text>
      </YStack>
      <XStack
        role="button"
        aria-label={t("ordersDecrease", { name: label })}
        aria-disabled={!picked}
        onPress={picked ? () => onChange(value - 1) : undefined}
        pressStyle={picked ? { opacity: 0.8 } : undefined}
        opacity={picked ? 1 : 0.35}
        width={44}
        height={44}
        borderRadius={22}
        borderWidth={1}
        borderColor="$neutralRaisedBorder"
        backgroundColor="$neutralRaised"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Minus size={16} color={neutral.text} strokeWidth={2.6} />
      </XStack>
      <Text minWidth={24} textAlign="center" fontSize={16} fontWeight="800" color={picked ? a.tint : neutral.placeholder}>
        {value}
      </Text>
      <XStack
        role="button"
        aria-label={t("ordersIncrease", { name: label })}
        onPress={() => onChange(value + 1)}
        pressStyle={{ opacity: 0.8 }}
        width={44}
        height={44}
        borderRadius={22}
        backgroundColor={a.fill}
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Plus size={16} color={a.tint} strokeWidth={2.6} />
      </XStack>
    </XStack>
  );
}
