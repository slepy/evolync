import { ChoiceList, FormSheet, PrimaryButton } from "@/core/components";
import React, { useEffect, useState } from "react";
import type { OrderStatus } from "../types";
import { ORDER_STATUSES, ORDER_STATUS_STYLE } from "./orderListState";

interface OrderStatusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Order: Jan Zieliński". */
  subtitle?: string;
  value: OrderStatus;
  /** The status saved on the order (its hint says "current"). */
  current: OrderStatus;
  onSave: (status: OrderStatus) => void;
}

/** Change status (12C): radio rows with the status dot and what it means, Save. */
export const OrderStatusSheet: React.FC<OrderStatusSheetProps> = ({ open, onOpenChange, subtitle, value, current, onSave }) => {
  const [picked, setPicked] = useState<OrderStatus>(value);

  useEffect(() => {
    if (open) setPicked(value);
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
            onSave(picked);
            onOpenChange(false);
          }}
        />
      }
    >
      <ChoiceList
        accent="orders"
        value={picked}
        onChange={setPicked}
        options={ORDER_STATUSES.map((status) => {
          const style = ORDER_STATUS_STYLE[status];
          return {
            value: status,
            title: t(style.title),
            hint: status === current ? `${t(style.hint)} · ${t("ordersStatusCurrent")}` : t(style.hint),
            dot: style.tint,
          };
        })}
      />
    </FormSheet>
  );
};
