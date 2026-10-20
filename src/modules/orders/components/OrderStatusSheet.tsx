import { ChoiceList, FormSheet, PrimaryButton, resolveListAccent } from "@/core/components";
import React, { useEffect, useState } from "react";
import { View } from "tamagui";
import type { OrderStatus } from "../types";
import { ORDER_STATUSES, ORDER_STATUS_STYLE } from "./orderListState";

interface OrderStatusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Muted line under the title: whose order(s) change. */
  subtitle?: string;
  value: OrderStatus;
  onSelect: (status: OrderStatus) => void;
}

/**
 * Change status (12C): radio choice list with the status dot, its hint and
 * "· current" on the status the order has now; Save applies and closes.
 */
export const OrderStatusSheet: React.FC<OrderStatusSheetProps> = ({ open, onOpenChange, subtitle, value, onSelect }) => {
  const [selected, setSelected] = useState<OrderStatus>(value);

  useEffect(() => {
    if (open) setSelected(value);
  }, [open, value]);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("ordersChangeStatus")}
      subtitle={subtitle}
      footer={
        <PrimaryButton
          label={t("save")}
          accent="orders"
          onPress={() => {
            if (selected !== value) onSelect(selected);
            onOpenChange(false);
          }}
        />
      }
    >
      <ChoiceList
        accent="orders"
        value={selected}
        onChange={setSelected}
        options={ORDER_STATUSES.map((status) => {
          const style = ORDER_STATUS_STYLE[status];
          return {
            value: status,
            title: t(style.label),
            hint: status === value ? t("ordersStatusCurrent", { hint: t(style.hint) }) : t(style.hint),
            dot: style.accent,
          };
        })}
      />
    </FormSheet>
  );
};

interface StatusDotProps {
  status: OrderStatus;
}

/** 12px dot in the status color (status rows and the STATUS field). */
function StatusDot({ status }: StatusDotProps) {
  const a = resolveListAccent(ORDER_STATUS_STYLE[status].accent);
  return (
    <View width={36} height={36} borderRadius={12} backgroundColor={a.fill} alignItems="center" justifyContent="center" flexShrink={0}>
      <View width={12} height={12} borderRadius={6} backgroundColor={a.tint} />
    </View>
  );
}
