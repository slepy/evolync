import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";

import {
  ProductForm,
  ProductFormHandle,
} from "@/modules/inventory/components/ProductForm";
import { useCreateProduct } from "@/modules/inventory/hooks";
import type { ProductDto } from "@/modules/inventory/types/dto";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

/**
 * Screen for creating a new product
 *
 * Route: /organization/inventory/create
 *
 * Features:
 * - Form with product details and initial variant
 * - Validation (Zod)
 * - Offline support
 * - Optimistic UI (immediate feedback)
 * - Auto-navigation on success
 */
export default function CreateProductScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const formRef = useRef<ProductFormHandle>(null);
  const { createProduct, isLoading, error, reset } = useCreateProduct();
  const insets = useSafeAreaInsets();

  const handleSubmit = async (data: ProductDto) => {
    const product = await createProduct(data);
    if (product) {
      router.back();
    }
  };

  const handleScrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("inventoryCreateTitle")} />}
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
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                onResetError={reset}
                onVariantAdded={handleScrollToEnd}
              />
            </YStack>
          </ScrollView>

          {/* Floating Submit Button */}
          <SubmitComponent
            onPress={() => formRef.current?.submit()}
            isLoading={isLoading}
            disabled={isLoading}
            title={t("inventoryCreateSubmit")}
          />
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
