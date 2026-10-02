import {
  DEFAULT_CURRENCY,
  ErrorBanner,
  ImagePicker,
  TextInput,
} from "@/modules/core/components";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react-native";
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Button, Switch, Text, useTheme, XStack, YStack } from "tamagui";

import type { ProductDto, ProductVariantDto } from "../types/dto";
import type { ProductFormValues } from "../validation";
import {
  productFormSchema,
  DEFAULT_STOCK_QUANTITY,
  STANDARD_VARIANT_NAME,
} from "../validation";
import { VariantFields } from "./VariantFields";

// ============================================================================
// Helpers
// ============================================================================

const createDefaultVariant = (name: string = STANDARD_VARIANT_NAME) => ({
  id: undefined as string | undefined,
  name,
  price: undefined as unknown as number,
  currency: DEFAULT_CURRENCY,
  stockQuantity: DEFAULT_STOCK_QUANTITY,
});

// ============================================================================
// Types
// ============================================================================

export interface ProductFormHandle {
  submit: () => void;
}

interface ProductFormProps {
  /** Initial data for editing, undefined for create mode */
  initialData?: ProductDto;
  /** Called when form is submitted with valid data */
  onSubmit: (data: ProductDto) => Promise<void>;
  /** Loading state */
  isLoading: boolean;
  /** Error message to display */
  error: string | null;
  /** Called to reset error state */
  onResetError: () => void;
  /** Called when a new variant is added (for scroll) */
  onVariantAdded?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

// ============================================================================
// ProductForm Component
// ============================================================================

export const ProductForm = forwardRef<ProductFormHandle, ProductFormProps>(
  (
    {
      initialData,
      onSubmit,
      isLoading,
      error,
      onResetError,
      onVariantAdded,
      onDirtyChange,
    },
    ref,
  ) => {
    const isEditMode = !!initialData;

    // Determine if initial data has multiple variants
    const initialHasMultiple =
      initialData &&
      (initialData.variants.length > 1 ||
        (initialData.variants.length === 1 &&
          initialData.variants[0].name !== STANDARD_VARIANT_NAME));

    const {
      control,
      handleSubmit,
      setValue,
      formState: { errors, isDirty },
    } = useForm<ProductFormValues>({
      resolver: zodResolver(productFormSchema),
      defaultValues: initialData
        ? {
            name: initialData.name,
            description: initialData.description,
            imageUri: initialData.imageUri,
            hasMultipleVariants: initialHasMultiple ?? false,
            variants: initialData.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: v.price,
              currency: v.currency ?? DEFAULT_CURRENCY,
              stockQuantity: v.stockQuantity ?? DEFAULT_STOCK_QUANTITY,
            })),
          }
        : {
            name: "",
            description: undefined,
            imageUri: undefined,
            hasMultipleVariants: false,
            variants: [createDefaultVariant()],
          },
    });

    const hasMultipleVariants = useWatch({
      control,
      name: "hasMultipleVariants",
    });

    const theme = useTheme();

    const { fields, append, remove } = useFieldArray({
      control,
      name: "variants",
    });

    // Handle variant name when switching between single/multiple variants mode
    React.useEffect(() => {
      if (hasMultipleVariants) {
        // Multiple variants mode - if only one variant with Standard name, clear it for editing
        if (fields.length === 1 && fields[0]?.name === STANDARD_VARIANT_NAME) {
          setValue("variants.0.name", "");
        }
      } else {
        // Single variant mode - keep only first variant and set Standard name
        if (fields.length > 1) {
          // Remove extra variants, keep first one
          for (let i = fields.length - 1; i > 0; i--) {
            remove(i);
          }
        }
        setValue("variants.0.name", STANDARD_VARIANT_NAME);
      }
    }, [hasMultipleVariants, setValue, fields, remove]);

    const handleAddVariant = () => {
      append(createDefaultVariant(""));
      setTimeout(() => {
        onVariantAdded?.();
      }, 100);
    };

    const handleFormSubmit = async (data: ProductFormValues) => {
      const dto: ProductDto = {
        name: data.name,
        description: data.description,
        imageUri: data.imageUri,
        variants: data.variants.map(
          (v): ProductVariantDto => ({
            id: v.id,
            name: v.name,
            price: v.price,
            currency: v.currency,
            stockQuantity: v.stockQuantity,
          }),
        ),
      };
      await onSubmit(dto);
    };

    useImperativeHandle(ref, () => ({
      submit: handleSubmit(handleFormSubmit),
    }));

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    return (
      <YStack gap="$2" width="100%">
        {/* Error Banner */}
        {error && (
          <ErrorBanner
            title={isEditMode ? t("errorUpdateFailed") : t("errorCreateFailed")}
            message={error}
            onDismiss={onResetError}
          />
        )}

        {/* Product Image */}
        <Controller
          control={control}
          name="imageUri"
          render={({ field: { onChange, value } }) => (
            <ImagePicker
              value={value}
              onChange={onChange}
              label={t("fieldImage")}
              error={
                errors.imageUri?.message
                  ? t(errors.imageUri.message)
                  : undefined
              }
              disabled={isLoading}
            />
          )}
        />

        {/* Product Name */}
        <TextInput
          control={control}
          name="name"
          label={t("fieldName")}
          placeholder={t("fieldNamePlaceholder")}
          error={errors.name?.message ? t(errors.name.message) : undefined}
          disabled={isLoading}
          autoCapitalize="words"
        />

        {/* Description (optional) */}
        <TextInput
          control={control}
          name="description"
          label={t("fieldDescription")}
          placeholder={t("fieldDescriptionPlaceholder")}
          error={
            errors.description?.message
              ? t(errors.description.message)
              : undefined
          }
          disabled={isLoading}
          autoCapitalize="sentences"
        />

        {/* Variant Section */}
        <YStack gap="$2" marginTop="$4">
          {/* Label and Switch in one row */}
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="700" color="$textSecondary">
              {t("inventoryVariants")}
            </Text>

            <XStack alignItems="center" gap="$2">
              <Text fontSize="$2" color="$textSecondary">
                {t("inventoryVariantSingle")}
              </Text>
              <Controller
                control={control}
                name="hasMultipleVariants"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    checked={value}
                    onCheckedChange={onChange}
                    disabled={isLoading}
                    size="$3"
                    backgroundColor="$pink3"
                  >
                    <Switch.Thumb animation="quick" backgroundColor="$pink11" />
                  </Switch>
                )}
              />
              <Text fontSize="$2" color="$textSecondary">
                {t("inventoryVariantMultiple")}
              </Text>
            </XStack>
          </XStack>

          {!hasMultipleVariants ? (
            /* Single Variant Mode - "Standard" */
            <VariantFields
              control={control}
              fieldPrefix="variants.0"
              errors={errors}
              disabled={isLoading}
              nameEditable={false}
            />
          ) : (
            /* Multiple Variants Mode */
            <YStack gap="$2">
              {/* Variant Error */}
              {errors.variants?.message && (
                <Text fontSize="$2" color="$red10">
                  {t(errors.variants.message)}
                </Text>
              )}

              {/* Variant List */}
              {fields.map((field, index) => (
                <YStack
                  key={field.id}
                  gap="$3"
                  padding="$3"
                  borderRadius="$3"
                  borderWidth={1}
                  borderColor="$borderStrong"
                  position="relative"
                >
                  <VariantFields
                    control={control}
                    fieldPrefix={`variants.${index}`}
                    errors={errors}
                    disabled={isLoading}
                  />

                  {/* Delete Button - Top Right Corner */}
                  {fields.length > 1 && (
                    <XStack justifyContent="flex-end">
                      <Button
                        size="$2"
                        chromeless
                        pressStyle={{
                          scale: 0.95,
                          backgroundColor: "$dangerSurface",
                        }}
                        onPress={() =>
                          confirmDelete(
                            t("delete"),
                            t("inventoryDeleteVariantConfirm"),
                            () => remove(index),
                          )
                        }
                        disabled={isLoading}
                        icon={
                          <Trash2
                            size={16}
                            color={theme.dangerText?.val}
                            pointerEvents="none"
                          />
                        }
                      />
                    </XStack>
                  )}
                </YStack>
              ))}

              {/* Add Variant Button */}
              <Button
                size="$4"
                variant="outlined"
                onPress={handleAddVariant}
                disabled={isLoading}
                icon={<Plus size={18} pointerEvents="none" />}
              >
                {t("inventoryAddVariant")}
              </Button>
            </YStack>
          )}
        </YStack>
      </YStack>
    );
  },
);
