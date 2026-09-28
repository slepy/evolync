import { FilterChip } from "@/modules/core/components";
import React from "react";
import { ScrollView } from "react-native";
import {
  ORDER_STATUS_FILTER,
  type OrderStatusFilterValue as OrderStatusFilterType,
} from "../types/enums";

const getOrderStatusLabel = (status: OrderStatusFilterType): string => {
  const labels: Record<OrderStatusFilterType, string> = {
    all: t("ordersFilterAll"),
    placed: t("statusPlaced"),
    paid: t("statusPaid"),
    processing: t("statusProcessing"),
    ready_for_pickup: t("statusReadyForPickup"),
    completed: t("statusCompleted"),
  };
  return labels[status] ?? status;
};

interface OrderStatusFilterProps {
  value: OrderStatusFilterType;
  onChange: (status: OrderStatusFilterType) => void;
  showAllFilter?: boolean;
}

export const OrderStatusFilter: React.FC<OrderStatusFilterProps> = ({
  value,
  onChange,
  showAllFilter = true,
}) => {
  const statuses = Object.values(ORDER_STATUS_FILTER).filter(
    (status) => showAllFilter || status !== ORDER_STATUS_FILTER.ALL,
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginTop: 6,
        gap: 8,
      }}
    >
      {statuses.map((status) => (
        <FilterChip
          key={status}
          label={getOrderStatusLabel(status)}
          active={value === status}
          onPress={() => onChange(status)}
        />
      ))}
    </ScrollView>
  );
};
