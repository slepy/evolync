import React from "react";
import { FormSheet } from "../FormSheet";
import { ListCard, ListCheck, ListRow } from "../List";
import type { ListAccent } from "../List/accent";

export interface CurrencySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Currency codes offered, in order. */
  options: readonly string[];
  value?: string;
  onSelect: (currency: string) => void;
  accent: ListAccent;
}

/** Select sheet of a CURRENCY field (board S section 7, 9B, 10A): tap a row to choose and close. */
export const CurrencySheet: React.FC<CurrencySheetProps> = ({
  open,
  onOpenChange,
  options,
  value,
  onSelect,
  accent,
}) => (
  <FormSheet open={open} onOpenChange={onOpenChange} title={t("fieldCurrency")}>
    <ListCard role="group" aria-label={t("fieldCurrency")}>
      {options.map((currency) => (
        <ListRow
          key={currency}
          size="md"
          role="option"
          title={currency}
          aria-selected={currency === value}
          accent={accent}
          trailing={currency === value ? <ListCheck accent={accent} /> : undefined}
          onPress={() => {
            onSelect(currency);
            onOpenChange(false);
          }}
        />
      ))}
    </ListCard>
  </FormSheet>
);
