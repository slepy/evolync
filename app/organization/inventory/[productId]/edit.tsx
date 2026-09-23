import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import { useDirtyFlag } from "@/modules/core/hooks";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";

import {
  ProductForm,
  ProductFormHandle,
} from "@/modules/inventory/components/ProductForm";
import { useEditProduct } from "@/modules/inventory/hooks";
import {
  deleteProduct,
  getProductById,
} from "@/modules/inventory/services/productService";
import type { ProductDto } from "@/modules/inventory/types/dto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text, useTheme, YStack } from "tamagui";

/**
 * Screen for editing an existing product
 *
 * Route: /inventory/[productId]/edit
 *
 * Features:
 * - Form with product details and variants
 * - Validation (Zod)
 * - Offline support
 * - Optimistic UI (immediate feedback)
 * - Auto-navigation on success
 */
export default function EditProductScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const formRef = useRef<ProductFormHandle>(null);
  const insets = useSafeAreaInsets();

  const [initialData, setInitialData] = useState<ProductDto | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const { updateProduct, isLoading, error, reset } = useEditProduct();
  const { isDirty, markDirty, reset: resetDirty } = useDirtyFlag();
  const theme = useTheme();

  const handleDelete = () => {
    if (!productId) return;
    confirmDelete(t("delete"), t("inventoryDeleteProductConfirm"), async () => {
      await deleteProduct(productId);
      router.back();
    });
  };

  // Load product data
  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        const product = await getProductById(productId);
        if (product) {
          setInitialData({
            name: product.name,
            description: product.description ?? undefined,
            imageUri: product.imageUrl ?? undefined,
            variants: product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: v.price,
              currency: v.currency,
              stockQuantity: v.stockQuantity,
            })),
          });
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleSubmit = async (data: ProductDto) => {
    if (!productId) return;

    const product = await updateProduct(productId, data);
    if (product) {
      resetDirty();
      router.back();
    }
  };

  const handleScrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    if (!productId) {
      router.back();
    }
  }, [productId, router]);

  if (!initialData) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header
          onBack={() => router.back()}
          centerContent={<HeaderTitle text={t("inventoryEditTitle")} />}
        />
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$inkBlack">{t("errorNotFound")}</Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("inventoryEditTitle")} />}
        rightContent={
          <Button size="$3" chromeless onPress={handleDelete} disabled={isLoading}>
            <Trash2 size={20} color={theme.imperialRedDark?.val} pointerEvents="none" />
          </Button>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{
              flexGrow: 1,
              padding: 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <YStack
              maxWidth={500}
              width="100%"
              alignSelf="center"
              gap="$4"
              paddingVertical="$4"
            >
              <ProductForm
                ref={formRef}
                initialData={initialData}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                onResetError={reset}
                onVariantAdded={handleScrollToEnd}
                onDirtyChange={(dirty) => { if (dirty) markDirty(); }}
              />
            </YStack>
          </ScrollView>

          {isDirty && (
            <SubmitComponent
              onPress={() => formRef.current?.submit()}
              isLoading={isLoading}
              disabled={isLoading}
            />
          )}
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
