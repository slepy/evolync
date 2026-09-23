import {
  AccordionGroup,
  AccordionSection,
  CurrencySelect,
  DEFAULT_CURRENCY,
  ErrorBanner,
  NumberInput,
  TextInput,
} from "@/modules/core/components";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CreditCard } from "lucide-react-native";
import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { YStack } from "tamagui";
import type { CombinedSchoolSettingsFormValues } from "../validation";
import { schoolSettingsFormSchema } from "../validation";

// ============================================================================
// Types
// ============================================================================

export interface SchoolSettingsFormHandle {
  submit: () => void;
}

interface SchoolSettingsFormProps {
  initialData: {
    name: string;
    address?: string;
    defaultCurrency?: string;
    defaultPaymentAmount?: number;
  };
  onSubmit: (data: CombinedSchoolSettingsFormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onResetError: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

// ============================================================================
// SchoolSettingsForm Component
// ============================================================================

export const SchoolSettingsForm = forwardRef<
  SchoolSettingsFormHandle,
  SchoolSettingsFormProps
>(({ initialData, onSubmit, isLoading, error, onResetError, onDirtyChange }, ref) => {
  const [activeSection, setActiveSection] = useState<string>("basicInfo");

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CombinedSchoolSettingsFormValues>({
    resolver: zodResolver(schoolSettingsFormSchema),
    defaultValues: {
      name: initialData.name,
      address: initialData.address ?? "",
      defaultCurrency: initialData.defaultCurrency ?? DEFAULT_CURRENCY,
      defaultPaymentAmount: initialData.defaultPaymentAmount ?? 0,
    },
  });

  useImperativeHandle(ref, () => ({
    submit: handleSubmit(onSubmit),
  }));

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <YStack gap="$1" width="100%">
      {error && (
        <ErrorBanner
          title={t("errorSaveFailed")}
          message={error}
          onDismiss={onResetError}
        />
      )}

      <AccordionGroup value={activeSection} onValueChange={setActiveSection}>
        {/* Section 1: Basic Info */}
        <AccordionSection
          value="basicInfo"
          title={t("settingsBasicInfo")}
          icon={<Building2 size={20} color="#1E293B" />}
          marginHorizontal="$0"
        >
          <TextInput
            control={control}
            name="name"
            label={t("schoolNameLabel")}
            placeholder={t("schoolNamePlaceholder")}
            error={errors.name?.message ? t(errors.name.message) : undefined}
            disabled={isLoading}
            autoCapitalize="words"
          />

          <TextInput
            control={control}
            name="address"
            label={t("fieldAddress")}
            placeholder={t("fieldAddressPlaceholder")}
            error={
              errors.address?.message ? t(errors.address.message) : undefined
            }
            disabled={isLoading}
            autoCapitalize="sentences"
          />
        </AccordionSection>

        {/* Section 2: Payment Defaults */}
        <AccordionSection
          value="paymentDefaults"
          title={t("settingsPaymentDefaults")}
          icon={<CreditCard size={20} color="#1E293B" />}
          marginHorizontal="$0"
        >
          <CurrencySelect
            control={control}
            name="defaultCurrency"
            label={t("settingsDefaultCurrency")}
            error={
              errors.defaultCurrency?.message
                ? t(errors.defaultCurrency.message)
                : undefined
            }
            disabled={isLoading}
          />

          <NumberInput
            control={control}
            name="defaultPaymentAmount"
            label={t("settingsDefaultAmount")}
            placeholder="0.00"
            error={
              errors.defaultPaymentAmount?.message
                ? t(errors.defaultPaymentAmount.message)
                : undefined
            }
            disabled={isLoading}
          />
        </AccordionSection>
      </AccordionGroup>
    </YStack>
  );
});
