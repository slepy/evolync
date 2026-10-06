import {
  FormSheet,
  ListCard,
  ListChip,
  ListDivider,
  ListImage,
  PrimaryButton,
  SearchField,
  matchesSearch,
  resolveListAccent,
} from "@/core/components";
import { neutral, orderStatusColors } from "@/core/theme/tokens";
import type { ProductResponseDto, ProductVariantResponseDto } from "@/modules/inventory/types/dto";
import { ChevronDown, ChevronUp, Package } from "lucide-react-native";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { Text, XStack, YStack } from "tamagui";
import type { CartItem } from "../types/dto";
import { addToCart, cartTotals, setCartQuantity, type CartVariant } from "./orderCart";
import { amountLines, formatAmount } from "./orderListState";
import { QuantityStepper } from "./QuantityStepper";

const accent = resolveListAccent("orders");

export const toCartVariants = (product: ProductResponseDto): CartVariant[] =>
  product.variants.map((variant) => ({
    variantId: variant.id,
    variantName: variant.name,
    productId: product.id,
    productName: product.name,
    unitPrice: variant.price,
    currency: variant.currency,
    imageUrl: product.imageUrl ?? undefined,
  }));

/** "From 110 PLN · 4 sizes", "89 PLN · 3 sizes", "45 PLN". */
const productMeta = (product: ProductResponseDto): string => {
  const byCurrency = new Map<string, number[]>();
  for (const v of product.variants) byCurrency.set(v.currency, [...(byCurrency.get(v.currency) ?? []), v.price]);
  const prices = [...byCurrency]
    .map(([currency, list]) => {
      const min = Math.min(...list);
      const amount = formatAmount(min, currency);
      return list.some((p) => p !== min) ? t("ordersPriceFrom", { price: amount }) : amount;
    })
    .join(" / ");
  return product.variants.length > 1 ? `${prices} · ${t("ordersSizesCount", { count: product.variants.length })}` : prices;
};

/** Picked pieces and their total: "3 items" + "330 PLN" (sheet footer). */
function PickSummary({ count, totals, emptyLabel }: { count: number; totals: Record<string, number>; emptyLabel: string }) {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap={12}>
      <Text fontSize={14} fontWeight="700" color="$neutralMuted">
        {count === 0 ? emptyLabel : t("ordersItemsCount", { count })}
      </Text>
      <Text flexShrink={1} textAlign="right" fontSize={16} fontWeight="$rowTitle" color="$neutralText">
        {amountLines(totals).join(" · ")}
      </Text>
    </XStack>
  );
}

/** One size: name, price · stock, − n +; 8% tint while picked (12F, 12F variant sheet). */
export function SizeRow({
  variant,
  productName,
  quantity,
  onChange,
  outOfStockLabel,
}: {
  variant: ProductVariantResponseDto;
  productName: string;
  quantity: number;
  onChange: (quantity: number) => void;
  outOfStockLabel: string;
}) {
  const out = variant.stockQuantity <= 0;
  return (
    <XStack
      alignItems="center"
      gap={6}
      paddingVertical={4}
      paddingRight={4}
      paddingLeft={12}
      borderRadius={14}
      backgroundColor={quantity > 0 ? accent.selectedFill : "transparent"}
    >
      <YStack flex={1} minWidth={0} gap={2}>
        <Text fontSize={14} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
          {variant.name}
        </Text>
        <Text fontSize={12} fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
          {formatAmount(variant.price, variant.currency)} ·{" "}
          <Text fontSize={12} fontWeight={out ? "700" : "$secondary"} color={out ? orderStatusColors.processing.tint : "$neutralMuted"}>
            {out ? outOfStockLabel : t("ordersInStock", { count: variant.stockQuantity })}
          </Text>
        </Text>
      </YStack>
      <QuantityStepper label={`${productName} ${variant.name}`} value={quantity} onChange={onChange} />
    </XStack>
  );
}

interface AddProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductResponseDto[];
  cart: CartItem[];
  /** The cart with the picked quantities added. */
  onAdd: (cart: CartItem[]) => void;
}

/**
 * Add product (12F): search, the organization's products ("From 110 PLN ·
 * 4 sizes"); tap one to show its sizes and pick quantities. The footer
 * counts the picked pieces and their total; Add puts them in the order.
 */
export const AddProductSheet: React.FC<AddProductSheetProps> = ({ open, onOpenChange, products, cart, onAdd }) => {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      setQuery("");
      setExpandedId(null);
      setPicks({});
    }
  }, [open]);

  const available = useMemo(
    () => products.filter((p) => p.variants.length > 0 && matchesSearch(query, p.name)),
    [products, query],
  );
  const allVariants = useMemo(() => products.flatMap(toCartVariants), [products]);
  const picked = useMemo(
    () => allVariants.flatMap((v) => ((picks[v.variantId] ?? 0) > 0 ? [{ ...v, quantity: picks[v.variantId] }] : [])),
    [allVariants, picks],
  );
  const count = picked.reduce((sum, v) => sum + v.quantity, 0);

  const handleAdd = () => {
    onAdd(addToCart(cart, allVariants, picks, uuidv4));
    onOpenChange(false);
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("ordersAddProduct")}
      subtitle={t("ordersAddProductHint")}
      footer={
        <YStack gap={10}>
          <PickSummary count={count} totals={cartTotals(picked)} emptyLabel={t("ordersNothingPicked")} />
          <PrimaryButton label={t("add")} accent="orders" onPress={handleAdd} disabled={count === 0} />
        </YStack>
      }
    >
      <SearchField value={query} onChangeText={setQuery} placeholder={t("ordersSearchProduct")} accent="orders" />
      <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
        <ListCard aria-label={t("ordersAddProduct")}>
          {available.map((product, index) => {
            const expanded = expandedId === product.id;
            const productQty = product.variants.reduce((sum, v) => sum + (picks[v.id] ?? 0), 0);
            const Chevron = expanded ? ChevronUp : ChevronDown;
            return (
              <Fragment key={product.id}>
                {index > 0 ? <ListDivider /> : null}
                <YStack>
                  <XStack
                    role="button"
                    aria-expanded={expanded}
                    aria-label={product.name}
                    onPress={() => setExpandedId(expanded ? null : product.id)}
                    pressStyle={{ opacity: 0.85 }}
                    alignItems="center"
                    gap={12}
                    paddingVertical={12}
                    paddingHorizontal={16}
                  >
                    <ListImage uri={product.imageUrl} icon={Package} accent="products" size={44} />
                    <YStack flex={1} minWidth={0} gap={3}>
                      <Text fontSize={15} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
                        {productMeta(product)}
                      </Text>
                    </YStack>
                    {productQty > 0 ? <ListChip label={`×${productQty}`} accent="orders" /> : null}
                    <Chevron size={20} color={neutral.muted} strokeWidth={2.2} />
                  </XStack>
                  {expanded ? (
                    <YStack gap={2} paddingLeft={16} paddingRight={12} paddingBottom={10}>
                      {product.variants.map((variant) => (
                        <SizeRow
                          key={variant.id}
                          variant={variant}
                          productName={product.name}
                          quantity={picks[variant.id] ?? 0}
                          outOfStockLabel={t("statusOutOfStock")}
                          onChange={(qty) => setPicks((prev) => ({ ...prev, [variant.id]: Math.max(0, qty) }))}
                        />
                      ))}
                    </YStack>
                  ) : null}
                </YStack>
              </Fragment>
            );
          })}
          {available.length === 0 ? (
            <YStack paddingVertical={20} paddingHorizontal={16}>
              <Text fontSize={14} fontWeight="600" color="$neutralMuted">
                {products.length === 0 ? t("ordersNoProducts") : t("ordersNoProductsFound")}
              </Text>
            </YStack>
          ) : null}
        </ListCard>
      </ScrollView>
    </FormSheet>
  );
};

interface ProductSizesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductResponseDto | null;
  cart: CartItem[];
  /** The cart with this product's sizes set to the chosen quantities. */
  onSave: (cart: CartItem[]) => void;
}

/**
 * A product of the order tapped (12F variant sheet): photo, name and
 * description, VARIANTS with − n + starting from the order's quantities.
 */
export const ProductSizesSheet: React.FC<ProductSizesSheetProps> = ({ open, onOpenChange, product, cart, onSave }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open && product) {
      setQuantities(
        Object.fromEntries(product.variants.map((v) => [v.id, cart.find((c) => c.variantId === v.id)?.quantity ?? 0])),
      );
    }
    // Start from the order when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  if (!product) return null;
  const variants = toCartVariants(product);
  const chosen = variants.flatMap((v) => ((quantities[v.variantId] ?? 0) > 0 ? [{ ...v, quantity: quantities[v.variantId] }] : []));
  const count = chosen.reduce((sum, v) => sum + v.quantity, 0);

  const handleSave = () => {
    const next = variants.reduce(
      (acc, variant) => setCartQuantity(acc, variant, quantities[variant.variantId] ?? 0, uuidv4),
      cart,
    );
    onSave(next);
    onOpenChange(false);
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={product.name}
      subtitle={product.description ?? undefined}
      titleLeading={<ProductPhoto uri={product.imageUrl} />}
      footer={
        <YStack gap={10}>
          <PickSummary count={count} totals={cartTotals(chosen)} emptyLabel={t("ordersPickSize")} />
          <PrimaryButton label={t("save")} accent="orders" onPress={handleSave} />
        </YStack>
      }
    >
      <YStack gap={10}>
        <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
          {t("inventoryVariants")}
        </Text>
        <ListCard aria-label={t("inventoryVariants")}>
          {product.variants.map((variant) => (
            <YStack key={variant.id} paddingVertical={6} paddingLeft={4} paddingRight={8}>
              <SizeRow
                variant={variant}
                productName={product.name}
                quantity={quantities[variant.id] ?? 0}
                outOfStockLabel={t("ordersOutOfStockOrdered")}
                onChange={(qty) => setQuantities((prev) => ({ ...prev, [variant.id]: Math.max(0, qty) }))}
              />
            </YStack>
          ))}
        </ListCard>
      </YStack>
    </FormSheet>
  );
};

/** 72px product photo (or the package icon) of the variant sheet header. */
function ProductPhoto({ uri }: { uri: string | null }) {
  const products = resolveListAccent("products");
  return (
    <YStack width={72} height={72} borderRadius={20} overflow="hidden" backgroundColor={products.fill} alignItems="center" justifyContent="center" flexShrink={0}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <Package size={30} color={products.tint} strokeWidth={2} />
      )}
    </YStack>
  );
}
