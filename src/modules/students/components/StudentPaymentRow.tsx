import { ChevronDown, Calendar } from "lucide-react-native";
import { format } from "date-fns";
import React from "react";
import { Text, XStack, YStack, useTheme } from "tamagui";
import {
  type PaymentStatus,
  type PaymentMethod,
} from "@/database/models/PaymentRecord";
import {
  AccordionSection,
  BaseCard,
  CardInfo,
  CurrencySelect,
  NumberInput,
  Thumbnail,
  type AccordionRenderProps,
} from "@/modules/core/components";
import { PaymentMethodSelect } from "@/modules/payments/components";
import { STATUS_CONFIG, STATUS_CYCLE } from "@/modules/payments/constants";

// ============================================================================
// Types
// ============================================================================

interface PaymentData {
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
}

interface StudentPaymentRowProps {
  periodStart: Date;
  periodEnd: Date;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  /** Called when user changes any field (updates local state only) */
  onLocalChange: (data: PaymentData) => void;
  disabled?: boolean;
  headerPressToExpand?: boolean;
}

// ============================================================================
// StudentPaymentRow Component
// ============================================================================

export const StudentPaymentRow: React.FC<StudentPaymentRowProps> = ({
  periodStart,
  periodEnd,
  amount,
  currency,
  status,
  method,
  onLocalChange,
  disabled = false,
  headerPressToExpand = false,
}) => {
  const theme = useTheme();

  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  const handleStatusToggle = () => {
    if (disabled) return;
    const currentIndex = STATUS_CYCLE.indexOf(status);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    onLocalChange({
      status: STATUS_CYCLE[nextIndex],
      amount,
      currency,
      method,
    });
  };

  const handleAmountChange = (text: string) => {
    const parsed = parseFloat(text) || 0;
    onLocalChange({ status, amount: parsed, currency, method });
  };

  const handleCurrencyChange = (newCurrency: string) => {
    onLocalChange({ status, amount, currency: newCurrency, method });
  };

  const handleMethodChange = (newMethod: PaymentMethod) => {
    onLocalChange({
      status,
      amount,
      currency,
      method: newMethod,
    });
  };

  return (
    <AccordionSection
      title={format(periodStart, "d MMM yyyy")}
      subtitle={format(periodEnd, "d MMM yyyy")}
      backgroundColor="$successSurface"
      borderColor="$jadeGreen"
      icon={<Calendar />}
      statusIcon={<StatusIcon />}
      statusColor={config.color}
      headerPressToExpand={headerPressToExpand}
      onPress={handleStatusToggle}
    >
      {/* Amount Input */}
      <NumberInput
        value={amount > 0 ? amount.toString() : ""}
        onChangeText={handleAmountChange}
        label={t("fieldAmount")}
        placeholder="0.00"
        disabled={disabled}
      />

      {/* Currency Select */}
      <CurrencySelect
        value={currency}
        onValueChange={handleCurrencyChange}
        label={t("fieldCurrency")}
        disabled={disabled}
      />

      {/* Payment Method Select */}
      <PaymentMethodSelect
        value={method}
        onValueChange={handleMethodChange}
        label={t("paymentsMethod")}
        disabled={disabled}
      />
    </AccordionSection>
  );
};
