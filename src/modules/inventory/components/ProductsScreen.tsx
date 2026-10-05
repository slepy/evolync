import { ListCard, ListImage, ListRow, ListSection, SubScreenPage } from "@/core/components";
import { LoadingScreen } from "@/modules/core/components";
import { formatPrice } from "@/modules/core/utils/formatters";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { Package } from "lucide-react-native";
import React from "react";
import { Text, YStack } from "tamagui";
import { useProducts } from "../hooks/useProducts";
import type { ProductResponseDto } from "../types/dto";
import { summarizeProductRow } from "./productRowSummary";

const stockLine = (product: ProductResponseDto): string => {
  const s = summarizeProductRow(product.variants);
  const stock =
    s.stockStatus === "out"
      ? t("statusOutOfStock")
      : s.stockStatus === "low"
        ? t("inventoryLowStockCount", { count: s.totalStock })
        : t("inventoryInStockCount", { count: s.totalStock });
  return s.variantCount > 1
    ? `${stock} · ${t("inventoryVariantsCount", { count: s.variantCount })}`
    : stock;
};

const priceLabel = (product: ProductResponseDto): string =>
  summarizeProductRow(product.variants)
    .prices.map((p) =>
      p.from
        ? `${t("from")} ${formatPrice(p.price, p.currency)}`
        : formatPrice(p.price, p.currency),
    )
    .join(" · ");

/**
 * Products list (9A): sub-screen header, "Your products" with Add new in the
 * Products pink, one row per product (photo or package icon, stock line,
 * lowest price on the right). A row opens edit (9C), Add new opens 9B.
 */
export const ProductsScreen: React.FC = () => {
  const router = useRouter();
  const { organization } = useStore();
  const { products, isLoading } = useProducts(organization?.id ?? "");

  if (isLoading || !organization) return <LoadingScreen />;

  return (
    <SubScreenPage title={t("dashboardTileProductsTitle")}>
      <ListSection
        title={t("inventoryYourProducts")}
        accent="products"
        action={{
          label: t("addNew"),
          onPress: () => router.push("/organization/inventory/create"),
        }}
      >
        {products.length > 0 ? (
          <ListCard aria-label={t("inventoryYourProducts")}>
            {products.map((product) => (
              <ListRow
                key={product.id}
                title={product.name}
                subtitle={stockLine(product)}
                leading={<ListImage uri={product.imageUrl} icon={Package} accent="products" />}
                trailing={
                  <Text
                    fontSize={14}
                    fontWeight="$rowTitle"
                    color="$neutralText"
                    numberOfLines={1}
                    flexShrink={0}
                    maxWidth="45%"
                  >
                    {priceLabel(product)}
                  </Text>
                }
                onPress={() =>
                  router.push(`/organization/inventory/${product.id}/edit`)
                }
              />
            ))}
          </ListCard>
        ) : (
          <YStack
            padding={20}
            borderRadius="$card"
            borderWidth={1}
            borderColor="$neutralCardBorder"
            backgroundColor="$neutralCard"
          >
            <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" textAlign="center">
              {t("inventoryEmpty")}
            </Text>
          </YStack>
        )}
      </ListSection>
    </SubScreenPage>
  );
};
