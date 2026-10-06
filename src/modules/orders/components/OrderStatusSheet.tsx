import { FormSheet, ListCard, ListCheck, ListRow, resolveListAccent } from "@/core/components";
import React from "react";
import { View } from "tamagui";
import type { OrderStatus } from "../types";
import { ORDER_STATUSES, ORDER_STATUS_STYLE } from "./orderListState";

interface OrderStatusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: OrderStatus;
  onSelect: (status: OrderStatus) => void;
}

/** Status (12C): one row per status with its color dot; tap to choose and close. */
export const OrderStatusSheet: React.FC<OrderStatusSheetProps> = ({ open, onOpenChange, value, onSelect }) => (
  <FormSheet open={open} onOpenChange={onOpenChange} title={t("ordersChangeStatus")}>
    <ListCard role="radiogroup" aria-label={t("ordersChangeStatus")}>
      {ORDER_STATUSES.map((status) => {
        const style = ORDER_STATUS_STYLE[status];
        const selected = status === value;
        return (
          <ListRow
            key={status}
            size="md"
            role="radio"
            aria-checked={selected}
            title={t(style.label)}
            leading={<StatusDot status={status} />}
            selected={selected}
            accent="orders"
            trailing={selected ? <ListCheck accent="orders" /> : undefined}
            onPress={() => {
              onSelect(status);
              onOpenChange(false);
            }}
          />
        );
      })}
    </ListCard>
  </FormSheet>
);

/** 12px dot in the status color (status rows and the STATUS field). */
export function StatusDot({ status }: { status: OrderStatus }) {
  const a = resolveListAccent(ORDER_STATUS_STYLE[status].accent);
  return (
    <View width={36} height={36} borderRadius={12} backgroundColor={a.fill} alignItems="center" justifyContent="center" flexShrink={0}>
      <View width={12} height={12} borderRadius={6} backgroundColor={a.tint} />
    </View>
  );
}
