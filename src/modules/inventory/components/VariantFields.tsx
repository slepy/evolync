import {
  CurrencySelect,
  NumberInput,
  TextInput,
} from "@/modules/core/components";
import React from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { XStack, YStack } from "tamagui";

import type { CreateProductFormValues } from "../validation";

// ============================================================================
// Types
// ============================================================================

interface VariantFieldsProps {
  control: Control<CreateProductFormValues>;
  /** Path prefix for form fields - `variants.${index}` */
  fieldPrefix: `variants.${number}`;
  /** Errors object from react-hook-form */
  errors: FieldErrors<CreateProductFormValues>;
  /** Whether inputs should be disabled */
  disabled?: boolean;
  /** Whether the variant name field should be editable */
  nameEditable?: boolean;
}

// ============================================================================
// Helper function to get nested error message
// ============================================================================

function getFieldError(
  errors: FieldErrors<CreateProductFormValues>,
  fieldPrefix: `variants.${number}`,
  field: "name" | "stockQuantity" | "price" | "currency",
): string | undefined {
  // Extract index from "variants.{index}"
  const match = fieldPrefix.match(/^variants\.(\d+)$/);
  if (match) {
    const index = parseInt(match[1], 10);
    const message = errors.variants?.[index]?.[field]?.message;
    return message ? t(message) : undefined;
  }

  return undefined;
}

// ============================================================================
// VariantFields Component
// ============================================================================

export const VariantFields: React.FC<VariantFieldsProps> = ({
  control,
  fieldPrefix,
  errors,
  disabled = false,
  nameEditable = true,
}) => {
  return (
    <YStack gap="$2">
      {/* Variant Name and Stock Quantity Row */}
      <XStack gap="$3">
        <TextInput
          control={control}
          name={`${fieldPrefix}.name`}
          label={t("inventoryVariantName")}
          placeholder={nameEditable ? t("inventoryVariantNamePlaceholder") : ""}
          error={getFieldError(errors, fieldPrefix, "name")}
          disabled={disabled || !nameEditable}
          autoCapitalize="words"
          flex={5}
        />

        <NumberInput
          control={control}
          name={`${fieldPrefix}.stockQuantity`}
          label={t("fieldQuantity")}
          placeholder={t("fieldQuantityPlaceholder")}
          error={getFieldError(errors, fieldPrefix, "stockQuantity")}
          disabled={disabled}
          allowDecimals={false}
          flex={2}
        />
      </XStack>

      {/* Price and Currency Row */}
      <XStack gap="$3">
        <NumberInput
          control={control}
          name={`${fieldPrefix}.price`}
          label={t("fieldPrice")}
          placeholder={t("fieldPricePlaceholder")}
          error={getFieldError(errors, fieldPrefix, "price")}
          disabled={disabled}
          allowDecimals={true}
          flex={5}
        />

        <CurrencySelect
          control={control}
          name={`${fieldPrefix}.currency`}
          label={t("fieldCurrency")}
          error={getFieldError(errors, fieldPrefix, "currency")}
          disabled={disabled}
          flex={2}
        />
      </XStack>
    </YStack>
  );
};
