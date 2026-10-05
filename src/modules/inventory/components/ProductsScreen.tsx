import { ListCard, ListChip, ListImage, ListRow, ListSection, SubScreenPage } from "@/core/components";
import { LoadingScreen } from "@/modules/core/components";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { Package } from "lucide-react-native";
import React from "react";
import { Text, YStack } from "tamagui";
import { useProducts } from "../hooks/useProducts";
import type { ProductResponseDto } from "../types/dto";
import { summarizeProductRow } from "./productRowSummary";

const STOCK_ACCENT = { in: "payments", low: "students", out: "danger" } as const;

/** One chip per currency: "24 / 120 PLN", colored by the stock in that currency. */
const priceChips = (product: ProductResponseDto) =>
  summarizeProductRow(product.variants).prices.map((p) => (
    <ListChip
      key={p.currency}
      label={`${p.stock} / ${p.price} ${p.currency}`}
      accent={STOCK_ACCENT[p.stockStatus]}
    />
  ));

/**
 * Products list (9A): sub-screen header, "Your products" with Add new in the
 * Products pink, one row per product (photo or package icon, a stock / price
 * chip per currency). A row opens edit (9C), Add new opens 9B.
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
                meta={priceChips(product)}
                leading={<ListImage uri={product.imageUrl} icon={Package} accent="products" />}
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
