import {
  CurrencySheet,
  ListSection,
  PhotoField,
  PrimaryButton,
  SubScreenPage,
  SyncedPill,
  TextField,
  TrashButton,
} from "@/core/components";
import { confirmDelete } from "@/core/utils/confirmDelete";
import React, { useMemo, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import type { ProductDto } from "../types/dto";
import { SUPPORTED_CURRENCIES } from "../validation";
import {
  hasProductChanges,
  initialProductForm,
  newVariant,
  removeVariant,
  showVariantNames,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormState,
  type VariantFormValues,
} from "./productFormState";
import { VariantFields } from "./VariantFields";

interface ProductFormScreenProps {
  /** Saved product (9C); without it the screen adds one (9B). */
  product?: ProductDto;
  /** Persists the validated product; a thrown error is shown above the button. */
  onSubmit: (data: ProductDto) => Promise<void>;
  /** Edit only: header trash button. */
  onDelete?: () => void;
}

/**
 * Add (9B) / edit (9C) product: sub-screen header (edit adds the red trash),
 * PHOTO, NAME, DESCRIPTION, then the variants with Add new in the Products
 * pink. Create / Save is pinned at the bottom; Save waits for a change.
 */
export const ProductFormScreen: React.FC<ProductFormScreenProps> = ({
  product,
  onSubmit,
  onDelete,
}) => {
  const editing = !!product;
  const initial = useMemo(() => initialProductForm(product), [product]);
  const [form, setForm] = useState<ProductFormState>(initial);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [currencyFor, setCurrencyFor] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const multiple = showVariantNames(form.variants.length);
  const changed = hasProductChanges(form, initial);

  const update = (patch: Partial<ProductFormState>, clear: string[]) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const key of clear) delete next[key];
      return next;
    });
    setSubmitError(undefined);
  };

  const updateVariant = (index: number, patch: Partial<VariantFormValues>) =>
    update(
      { variants: form.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) },
      Object.keys(patch).map((field) => `variants.${index}.${field}`),
    );

  // Errors are keyed by index, so they are dropped when the list shifts.
  const addVariant = () => {
    update({ variants: [...form.variants, newVariant()] }, []);
  };

  const handleRemoveVariant = (index: number) =>
    confirmDelete(t("delete"), t("inventoryDeleteVariantConfirm"), () => {
      setForm((f) => ({ ...f, variants: removeVariant(f.variants, index) }));
      setErrors({});
    });

  const handleSubmit = async () => {
    if (isSaving) return;
    const result = validateProductForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setIsSaving(true);
    setSubmitError(undefined);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setSubmitError(t(err instanceof Error ? err.message : "errorUnknown"));
    } finally {
      setIsSaving(false);
    }
  };

  const fieldError = (path: string) => (errors[path] ? t(errors[path]) : undefined);
  const variantErrors = (index: number) => ({
    name: errors[`variants.${index}.name`],
    price: errors[`variants.${index}.price`],
    stockQuantity: errors[`variants.${index}.stockQuantity`],
  });

  return (
    <>
      <SubScreenPage
        title={editing ? t("inventoryEditTitle") : t("inventoryCreateTitle")}
        right={
          editing && onDelete ? (
            <XStack alignItems="center" gap={8}>
              <TrashButton onPress={onDelete} disabled={isSaving} />
              <SyncedPill />
            </XStack>
          ) : undefined
        }
        footer={
          <YStack gap={10}>
            {submitError ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                {submitError}
              </Text>
            ) : null}
            <PrimaryButton
              label={editing ? t("save") : t("create")}
              accent="products"
              onPress={handleSubmit}
              disabled={editing && !changed}
              loading={isSaving}
            />
          </YStack>
        }
      >
        <YStack gap={20}>
          <PhotoField
            label={t("fieldPhoto")}
            value={form.imageUri}
            onChange={(imageUri) => update({ imageUri }, [])}
            accent="products"
            disabled={isSaving}
          />
          <TextField
            label={t("fieldName")}
            value={form.name}
            onChangeText={(name) => update({ name }, ["name"])}
            placeholder={t("inventoryProductNamePlaceholder")}
            accent="products"
            maxLength={255}
            error={fieldError("name")}
            autoCapitalize="sentences"
          />
          <TextField
            label={t("fieldDescription")}
            value={form.description}
            onChangeText={(description) => update({ description }, ["description"])}
            placeholder={t("fieldDescriptionPlaceholder")}
            accent="products"
            maxLength={1000}
            error={fieldError("description")}
            autoCapitalize="sentences"
            multiline
          />
        </YStack>

        <ListSection
          title={t("inventoryVariants")}
          accent="products"
          action={{ label: t("addNew"), onPress: addVariant }}
        >
          <YStack gap={12}>
            {fieldError("variants") ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText">
                {fieldError("variants")}
              </Text>
            ) : null}
            {form.variants.map((variant, index) => (
              <VariantFields
                key={variant.id ?? `new-${index}`}
                variant={variant}
                index={index}
                multiple={multiple}
                onChange={(patch) => updateVariant(index, patch)}
                onPickCurrency={() => setCurrencyFor(index)}
                onRemove={() => handleRemoveVariant(index)}
                errors={variantErrors(index)}
              />
            ))}
          </YStack>
        </ListSection>
      </SubScreenPage>

      <CurrencySheet
        open={currencyFor !== null}
        options={SUPPORTED_CURRENCIES}
        accent="products"
        onOpenChange={(open) => {
          if (!open) setCurrencyFor(null);
        }}
        value={currencyFor !== null ? form.variants[currencyFor]?.currency : undefined}
        onSelect={(currency) => {
          if (currencyFor !== null) updateVariant(currencyFor, { currency });
        }}
      />
    </>
  );
};
