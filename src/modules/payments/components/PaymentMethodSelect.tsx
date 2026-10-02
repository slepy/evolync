import { ChevronDown } from "lucide-react-native";
import React from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Adapt, Label, Select, Sheet, Text, YStack } from "tamagui";
import {
  type PaymentMethod,
  PaymentMethod as PaymentMethodEnum,
  DEFAULT_PAYMENT_METHOD,
} from "@/database/models/PaymentRecord";

// ============================================================================
// Types
// ============================================================================

interface BasePaymentMethodSelectProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  flex?: number;
}

interface FormPaymentMethodSelectProps<
  TFieldValues extends FieldValues,
> extends BasePaymentMethodSelectProps {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  value?: never;
  onValueChange?: never;
}

interface StandalonePaymentMethodSelectProps extends BasePaymentMethodSelectProps {
  control?: never;
  name?: string;
  value: PaymentMethod;
  onValueChange: (value: PaymentMethod) => void;
}

type PaymentMethodSelectProps<TFieldValues extends FieldValues = FieldValues> =
  | FormPaymentMethodSelectProps<TFieldValues>
  | StandalonePaymentMethodSelectProps;

// ============================================================================
// PaymentMethodSelect Component
// ============================================================================

/**
 * Reusable payment method select component.
 * Supports both React Hook Form and standalone usage.
 *
 * @example React Hook Form mode
 * <PaymentMethodSelect
 *   control={control}
 *   name="method"
 *   label={t('paymentsMethod')}
 *   error={errors.method?.message}
 * />
 *
 * @example Standalone mode
 * <PaymentMethodSelect
 *   value={method}
 *   onValueChange={setMethod}
 *   label={t('paymentsMethod')}
 * />
 */
export const PaymentMethodSelect = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  error,
  disabled = false,
  flex = 1,
  value: standaloneValue,
  onValueChange: standaloneOnValueChange,
}: PaymentMethodSelectProps<TFieldValues>) => {
  const inputId = name ?? "payment-method-select";

  const renderSelect = (
    selectValue: PaymentMethod,
    onChange: (value: PaymentMethod) => void,
  ) => (
    <Select
      value={selectValue || DEFAULT_PAYMENT_METHOD}
      onValueChange={(val) => onChange(val as PaymentMethod)}
      disablePreventBodyScroll
    >
      <Select.Trigger
        borderColor={error ? "$imperialRed" : "$borderStrong"}
        borderWidth={2}
        backgroundColor={disabled ? "$fillStrong" : "$background"}
        disabled={disabled}
        iconAfter={ChevronDown}
        opacity={1}
      >
        <Select.Value placeholder={t("paymentsSelectMethod")} />
      </Select.Trigger>

      <Adapt when="sm" platform="touch">
        <Sheet modal dismissOnSnapToBottom snapPointsMode="fit">
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
          <Select.Item index={0} value={PaymentMethodEnum.CASH}>
            <Select.ItemText>{t("paymentsMethodCash")}</Select.ItemText>
          </Select.Item>
          <Select.Item index={1} value={PaymentMethodEnum.TRANSFER}>
            <Select.ItemText>{t("paymentsMethodTransfer")}</Select.ItemText>
          </Select.Item>
          <Select.Item index={2} value={PaymentMethodEnum.OTHER}>
            <Select.ItemText>{t("paymentsMethodOther")}</Select.ItemText>
          </Select.Item>
        </Select.Viewport>
        <Select.ScrollDownButton />
      </Select.Content>
    </Select>
  );

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
            renderSelect(value as PaymentMethod, onChange)
          }
        />
      ) : (
        renderSelect(
          standaloneValue ?? DEFAULT_PAYMENT_METHOD,
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
