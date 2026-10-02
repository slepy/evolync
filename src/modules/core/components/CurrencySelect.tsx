import React, { useState } from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { TouchableOpacity } from "react-native";
import { YStack, Text, XStack, useTheme } from "tamagui";
import { ChevronDown } from "lucide-react-native";
import { PickerSheet, PickerSheetOption } from "./PickerSheet";

// ============================================================================
// Constants
// ============================================================================

/**
 * Supported currency codes (ISO 4217)
 */
export const SUPPORTED_CURRENCIES = ["PLN", "EUR", "USD", "GBP"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Default currency
 */
export const DEFAULT_CURRENCY: SupportedCurrency = "PLN";

// ============================================================================
// Types
// ============================================================================

interface BaseCurrencySelectProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  currencies?: readonly string[];
  defaultCurrency?: string;
  flex?: number;
}

interface FormCurrencySelectProps<
  TFieldValues extends FieldValues,
> extends BaseCurrencySelectProps {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  value?: never;
  onValueChange?: never;
}

interface StandaloneCurrencySelectProps extends BaseCurrencySelectProps {
  control?: never;
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
}

type CurrencySelectProps<TFieldValues extends FieldValues = FieldValues> =
  | FormCurrencySelectProps<TFieldValues>
  | StandaloneCurrencySelectProps;

// ============================================================================
// CurrencySelect Component
// ============================================================================

/**
 * Reusable currency select component with validation and error display.
 * Supports both React Hook Form and standalone usage.
 *
 * @example React Hook Form mode
 * <CurrencySelect
 *   control={control}
 *   name="currency"
 *   label={t('inventoryCreateCurrencyLabel')}
 *   error={errors.currency?.message}
 * />
 *
 * @example Standalone mode
 * <CurrencySelect
 *   value={currency}
 *   onValueChange={setCurrency}
 *   label="Currency"
 * />
 */
export const CurrencySelect = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  error,
  disabled = false,
  currencies = SUPPORTED_CURRENCIES,
  defaultCurrency = DEFAULT_CURRENCY,
  flex = 1,
  value: standaloneValue,
  onValueChange: standaloneOnValueChange,
}: CurrencySelectProps<TFieldValues>) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const pickerOptions: PickerSheetOption[] = currencies.map((c) => ({
    id: c,
    label: c,
  }));

  const renderTrigger = (
    selectValue: string,
    onChange: (value: string) => void,
  ) => {
    const resolved = selectValue || defaultCurrency;
    return (
      <>
        <TouchableOpacity
          onPress={() => !disabled && setOpen(true)}
          activeOpacity={disabled ? 1 : 0.7}
        >
          <XStack
            borderColor={error ? "$imperialRed" : "$borderStrong"}
            borderWidth={2}
            borderRadius="$3"
            backgroundColor={disabled ? "$fillStrong" : "$background"}
            paddingHorizontal="$3"
            paddingVertical="$2.5"
            alignItems="center"
            justifyContent="space-between"
          >
            <Text fontSize="$4" color="$textPrimary">
              {resolved}
            </Text>
            <ChevronDown
              size={16}
              color={theme.textSecondary?.val}
              pointerEvents="none"
            />
          </XStack>
        </TouchableOpacity>

        <PickerSheet
          open={open}
          onOpenChange={setOpen}
          options={pickerOptions}
          selectedId={resolved}
          onSelect={(id) => {
            if (id) onChange(id);
          }}
          snapPoints={[30]}
        />
      </>
    );
  };

  return (
    <YStack gap="$2" {...(flex !== 1 && { flex, flexBasis: 0 })}>
      {label && (
        <Text fontSize="$3" color="$textSecondary" fontWeight="500">
          {label}
        </Text>
      )}

      {control && name ? (
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, value } }) =>
            renderTrigger(value as string, onChange)
          }
        />
      ) : (
        renderTrigger(
          standaloneValue ?? defaultCurrency,
          standaloneOnValueChange ?? (() => {}),
        )
      )}

      {error && (
        <Text color="$imperialRed" fontSize="$3" fontWeight="500">
          {error}
        </Text>
      )}
    </YStack>
  );
};
