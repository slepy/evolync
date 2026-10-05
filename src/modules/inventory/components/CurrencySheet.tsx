import { FormSheet, ListCard, ListCheck, ListRow } from "@/core/components";
import React from "react";
import { SUPPORTED_CURRENCIES } from "../validation";

interface CurrencySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  onSelect: (currency: string) => void;
}

/** Select sheet of the CURRENCY field (board S section 7): tap a row to choose and close. */
export const CurrencySheet: React.FC<CurrencySheetProps> = ({
  open,
  onOpenChange,
  value,
  onSelect,
}) => (
  <FormSheet open={open} onOpenChange={onOpenChange} title={t("fieldCurrency")}>
    <ListCard role="group" aria-label={t("fieldCurrency")}>
      {SUPPORTED_CURRENCIES.map((currency) => (
        <ListRow
          key={currency}
          size="md"
          role="option"
          title={currency}
          selected={currency === value}
          accent="products"
          trailing={currency === value ? <ListCheck accent="products" /> : undefined}
          onPress={() => {
            onSelect(currency);
            onOpenChange(false);
          }}
        />
      ))}
    </ListCard>
  </FormSheet>
);
