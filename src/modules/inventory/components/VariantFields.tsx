import { SelectField, TextField, TrashButton } from "@/core/components";
import React from "react";
import { Text, XStack, YStack } from "tamagui";
import type { VariantFormValues } from "./productFormState";

interface VariantFieldsProps {
  variant: VariantFormValues;
  index: number;
  /** Several variants: NAME field, "Variant N" header and a trash button. */
  multiple: boolean;
  onChange: (patch: Partial<VariantFormValues>) => void;
  onPickCurrency: () => void;
  onRemove: () => void;
  /** Translation keys by field ("name", "price", "stockQuantity"). */
  errors: Partial<Record<keyof VariantFormValues, string>>;
}

/**
 * Fields of one variant (9B / 9C). A single variant is flat (PRICE, CURRENCY,
 * STOCK); with several, each sits in its own bordered group with a name.
 */
export const VariantFields: React.FC<VariantFieldsProps> = ({
  variant,
  index,
  multiple,
  onChange,
  onPickCurrency,
  onRemove,
  errors,
}) => {
  const err = (field: keyof VariantFormValues) =>
    errors[field] ? t(errors[field] as string) : undefined;

  const fields = (
    <YStack gap={16}>
      {multiple ? (
        <TextField
          label={t("fieldName")}
          value={variant.name}
          onChangeText={(name) => onChange({ name })}
          placeholder={t("inventoryVariantNamePlaceholder")}
          accent="products"
          maxLength={100}
          error={err("name")}
          autoCapitalize="words"
        />
      ) : null}
      <XStack gap={12}>
        <YStack flex={1}>
          <TextField
            label={t("fieldPrice")}
            value={variant.price}
            onChangeText={(price) => onChange({ price })}
            placeholder={t("fieldPricePlaceholder")}
            accent="products"
            keyboardType="decimal-pad"
            error={err("price")}
          />
        </YStack>
        <YStack width={128}>
          <SelectField
            label={t("fieldCurrency")}
            value={variant.currency}
            onPress={onPickCurrency}
            accent="products"
          />
        </YStack>
      </XStack>
      <TextField
        label={t("fieldStock")}
        value={variant.stockQuantity}
        onChangeText={(stockQuantity) => onChange({ stockQuantity })}
        placeholder={t("fieldQuantityPlaceholder")}
        accent="products"
        keyboardType="number-pad"
        error={err("stockQuantity")}
      />
    </YStack>
  );

  if (!multiple) return fields;

  return (
    <YStack
      gap={16}
      padding={16}
      borderRadius="$card"
      borderWidth={1}
      borderColor="$neutralCardBorder"
    >
      <XStack alignItems="center" justifyContent="space-between" gap={12}>
        <Text fontSize="$rowTitle" fontWeight="$rowTitle" color="$neutralText" numberOfLines={1} flexShrink={1}>
          {variant.name.trim() || t("inventoryVariantNumber", { number: index + 1 })}
        </Text>
        <TrashButton onPress={onRemove} label={t("inventoryRemoveVariant")} />
      </XStack>
      {fields}
    </YStack>
  );
};
