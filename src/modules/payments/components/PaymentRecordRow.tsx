import React from "react";
import { useTheme } from "tamagui";
import {
  type PaymentStatus,
  type PaymentMethod,
} from "@/database/models/PaymentRecord";
import {
  AccordionSection,
  CurrencySelect,
  NumberInput,
} from "@/modules/core/components";
import { PaymentMethodSelect } from "./PaymentMethodSelect";
import { STATUS_CONFIG, STATUS_CYCLE } from "../constants";
import { SchoolMember } from "@/database/models";
import { useRankById } from "@/modules/grading";

// ============================================================================
// Types
// ============================================================================

interface PaymentRecordRowProps {
  member: SchoolMember;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  onChange: (data: {
    status: PaymentStatus;
    amount: number;
    currency: string;
    method: PaymentMethod;
  }) => void;
  disabled?: boolean;
}

// ============================================================================
// PaymentRecordRow Component
// ============================================================================

export const PaymentRecordRow: React.FC<PaymentRecordRowProps> = ({
  member,
  amount,
  currency,
  status,
  method,
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const rank = useRankById(member.currentRankId);

  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  const handleStatusToggle = () => {
    if (disabled) return;
    const currentIndex = STATUS_CYCLE.indexOf(status);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    onChange({ status: STATUS_CYCLE[nextIndex], amount, currency, method });
  };

  const handleAmountChange = (text: string) => {
    const parsed = parseFloat(text) || 0;
    onChange({ status, amount: parsed, currency, method });
  };

  const handleCurrencyChange = (newCurrency: string) => {
    onChange({ status, amount, currency: newCurrency, method });
  };

  const handleMethodChange = (newMethod: PaymentMethod) => {
    onChange({ status, amount, currency, method: newMethod });
  };

  return (
    <AccordionSection
      title={member.displayName || t("unknownMember")}
      subtitle={`${amount.toFixed(2)} ${currency}`}
      backgroundColor="$blue3"
      borderColor="$blue11"
      statusIcon={<StatusIcon />}
      statusColor={config.color}
      headerPressToExpand={false}
      imageUrl={member.avatarUrl}
      rankColor={rank?.color}
      onPress={handleStatusToggle}
    >
      {/* Amount Input */}
      <NumberInput
        label={t("fieldAmount")}
        value={amount > 0 ? amount.toString() : ""}
        onChangeText={handleAmountChange}
        placeholder="0.00"
        disabled={disabled}
      />

      {/* Currency Select */}
      <CurrencySelect
        label={t("fieldCurrency")}
        value={currency}
        onValueChange={handleCurrencyChange}
        disabled={disabled}
      />

      {/* Payment Method Select */}
      <PaymentMethodSelect
        label={t("paymentsMethod")}
        value={method}
        onValueChange={handleMethodChange}
        disabled={disabled}
      />
    </AccordionSection>
  );
};
