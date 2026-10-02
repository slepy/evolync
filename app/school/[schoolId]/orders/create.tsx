import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import {
  ProductRepository,
  ProductVariantRepository,
} from "@/modules/inventory/repositories";
import {
  ProductPickerList,
  VariantPickerSheet,
  useCreateOrder,
} from "@/modules/orders";
import type { ProductWithVariants } from "@/modules/orders/components/ProductPickerList";
import type { CartItem, CreateOrderItemDto } from "@/modules/orders/types/dto";
import { SchoolRepository } from "@/modules/school/repositories";
import { StudentRepository } from "@/modules/students/repositories";
import { ChevronDown } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Adapt, Select, Sheet, Text, YStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface MemberOption {
  id: string;
  name: string;
}

// ============================================================================
// Create Order Screen
// ============================================================================

/**
 * Screen for creating a new order
 *
 * Route: /school/[schoolId]/orders/create
 *
 * Features:
 * - Select school member from dropdown
 * - Browse products from organization
 * - Select variants and quantities
 * - Cart preview before saving
 * - Works offline
 */
export default function CreateOrderScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const { createOrder, isLoading, error, reset } = useCreateOrder();
  const insets = useSafeAreaInsets();

  // State
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Variant picker state
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithVariants | null>(null);
  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);

  // Fetch members and products
  useEffect(() => {
    if (!schoolId) return;

    const fetchData = async () => {
      try {
        // Get organization ID from school
        const school = await SchoolRepository.findById(schoolId);
        if (!school) {
          console.error("[CreateOrderScreen] School not found");
          return;
        }
        const organizationId = school.organizationId;

        // Fetch active members via repository
        const activeMembers =
          await StudentRepository.findActiveBySchoolId(schoolId);

        const memberOptions: MemberOption[] = activeMembers.map((m) => ({
          id: m.id,
          name: m.displayName || m.email || t("unknownMember"),
        }));
        setMembers(memberOptions);

        // Fetch products with variants via repositories
        const allProducts =
          await ProductRepository.findByOrganizationId(organizationId);

        const productsWithVariants: ProductWithVariants[] = [];

        for (const product of allProducts) {
          const variants = await ProductVariantRepository.findByProductId(
            product.id,
          );

          // Only include products with at least one variant
          if (variants.length > 0) {
            productsWithVariants.push({ product, variants });
          }
        }

        setProducts(productsWithVariants);
      } catch (err) {
        console.error("[CreateOrderScreen] Error fetching data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [schoolId]);

  // Handlers
  const handleProductPress = (productWithVariants: ProductWithVariants) => {
    setSelectedProduct(productWithVariants);
    setIsVariantSheetOpen(true);
  };

  /**
   * Handle updating cart items for a specific product.
   * Replaces all items for that product with the new items.
   */
  const handleUpdateProductItems = (productId: string, items: CartItem[]) => {
    setCartItems((prev) => {
      // Remove all existing items for this product
      const otherItems = prev.filter((i) => i.productId !== productId);
      // Add the new items
      return [...otherItems, ...items];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleSave = async () => {
    if (!schoolId || !selectedMemberId || cartItems.length === 0) {
      return;
    }

    const items: CreateOrderItemDto[] = cartItems.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency: item.currency,
    }));

    const order = await createOrder(schoolId, selectedMemberId, items);
    if (order) {
      router.back();
    }
  };

  if (!schoolId) {
    return (
      <View style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textPrimary">{t("errorNoSchool")}</Text>
        </YStack>
      </View>
    );
  }

  const canSave = selectedMemberId && cartItems.length > 0;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("ordersCreateTitle")} />}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: canSave ? 120 : 20 }}
      >
        <YStack
          maxWidth={500}
          width="100%"
          alignSelf="center"
          padding="$4"
          gap="$4"
        >
          {/* Error Banner */}
          {error && (
            <YStack backgroundColor="$red3" padding="$3" borderRadius="$3">
              <Text color="$red10">{error}</Text>
            </YStack>
          )}

          {/* Member Selection */}
          <YStack gap="$2">
            <Text fontSize="$3" color="$textSecondary" fontWeight="500">
              {t("ordersSelectMember")}
            </Text>
            {members.length === 0 && !isLoadingData ? (
              <YStack
                backgroundColor="$yellow3"
                padding="$3"
                borderRadius="$3"
                borderWidth={1}
                borderColor="$yellow6"
              >
                <Text color="$yellow11" fontSize="$3">
                  {t("emptyNoMembers")}
                </Text>
              </YStack>
            ) : (
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
                disablePreventBodyScroll
                native
              >
                <Select.Trigger
                  borderColor="$borderStrong"
                  borderWidth={2}
                  backgroundColor="$background"
                  iconAfter={ChevronDown}
                >
                  <Select.Value
                    placeholder={t("ordersSelectMemberPlaceholder")}
                  />
                </Select.Trigger>

                <Adapt when="sm" platform="touch">
                  <Sheet modal dismissOnSnapToBottom snapPoints={[40]}>
                    <Sheet.Frame>
                      <Sheet.ScrollView>
                        <Adapt.Contents />
                      </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay />
                  </Sheet>
                </Adapt>

                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    {members.map((member, index) => (
                      <Select.Item
                        key={member.id}
                        value={member.id}
                        index={index}
                      >
                        <Select.ItemText>{member.name}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
            )}
          </YStack>
        </YStack>

        {/* Products List */}
        <ProductPickerList
          products={products}
          cartItems={cartItems}
          isLoading={isLoadingData}
          onProductPress={handleProductPress}
          onRemoveItem={handleRemoveItem}
        />
      </ScrollView>

      {/* Save Button - shows only when can save */}
      {canSave && (
        <SubmitComponent
          onPress={handleSave}
          isLoading={isLoading}
          disabled={isLoading}
        />
      )}

      {/* Variant Picker Sheet */}
      {selectedProduct && (
        <VariantPickerSheet
          open={isVariantSheetOpen}
          onOpenChange={setIsVariantSheetOpen}
          productId={selectedProduct.product.id}
          productName={selectedProduct.product.name}
          productDescription={selectedProduct.product.description}
          productImageUrl={selectedProduct.product.imageUrl}
          variants={selectedProduct.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            currency: v.currency,
            stockQuantity: v.stockQuantity,
          }))}
          existingCartItems={cartItems.filter(
            (item) => item.productId === selectedProduct.product.id,
          )}
          onUpdateItems={(items) =>
            handleUpdateProductItems(selectedProduct.product.id, items)
          }
        />
      )}
    </View>
  );
}
