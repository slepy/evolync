import Product from "@/database/models/Product";
import { Header, HeaderTitle } from "@/modules/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { OptionsSheet } from "@/modules/core/components/OptionsSheet";
import { ProductCard } from "@/modules/inventory/components";
import { ProductRepository } from "@/modules/inventory/repositories";
import type {
  ProductResponseDto,
  ProductVariantResponseDto,
} from "@/modules/inventory/types/dto";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

/**
 * Inventory list screen
 *
 * Route: /inventory
 *
 * Features:
 * - Lists all products in the organization
 * - WatermelonDB reactive observers via repository
 * - Offline support
 * - FAB for adding new products
 */
export default function InventoryScreen() {
  useRequireOrganizationOwner();
  const { organization } = useStore();
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    const subscription = ProductRepository.observeByOrganizationId(
      organization.id,
    ).subscribe({
      next: async (result: Product[]) => {
        // Map products with their variants
        const productsWithVariants = await Promise.all(
          result.map(async (product) => {
            const variants = await product.variants.fetch();
            const activeVariants = variants.filter((v) => !v.deletedAt);

            return {
              id: product.id,
              organizationId: product.organizationId,
              name: product.name,
              description: product.description ?? null,
              imageUrl: product.imageUrl ?? null,
              variants: activeVariants.map(
                (v): ProductVariantResponseDto => ({
                  id: v.id,
                  productId: v.productId,
                  name: v.name,
                  price: v.price,
                  currency: v.currency,
                  stockQuantity: v.stockQuantity,
                  createdAt: v.createdAt,
                  updatedAt: v.updatedAt,
                }),
              ),
              createdAt: product.createdAt,
              updatedAt: product.updatedAt,
            };
          }),
        );

        setProducts(productsWithVariants);
        setLoading(false);
      },
      error: (error: Error) => {
        console.error("Error observing products:", error);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [organization?.id]);

  const handleProductPress = (productId: string) => {
    router.push(`/organization/inventory/${productId}/edit`);
  };

  const handleCreateProduct = () => {
    router.push("/organization/inventory/create");
  };

  if (!organization) {
    return (
      <View style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textPrimary">{t("errorNoOrganization")}</Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("inventoryTitle")} />}
      />
      <YStack
        flex={1}
        maxWidth={500}
        width="100%"
        alignSelf="center"
        paddingVertical="$4"
      >
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <ProductCard
              name={item.name}
              imageUrl={item.imageUrl}
              variants={item.variants}
              onPress={() => handleProductPress(item.id)}
            />
          )}
          ListEmptyComponent={
            <YStack gap="$2" alignItems="center" marginTop="$10">
              <Text color="$textBody" textAlign="center">
                {t("emptyNoProducts")}
              </Text>
            </YStack>
          }
        />
      </YStack>

      {/* FAB - Add Product Button */}
      <OptionsSheet
        fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
        action={handleCreateProduct}
      />
    </View>
  );
}
