import { withAlpha, resolveListAccent } from "@/core/components";
import React from "react";
import { ScrollView } from "react-native";
import { Text, XStack } from "tamagui";
import { ORDER_STATUSES, ORDER_STATUS_STYLE, type OrderStatusChip } from "./orderListState";

interface OrderStatusChipsProps {
  value: OrderStatusChip;
  counts: Record<OrderStatusChip, number>;
  onChange: (value: OrderStatusChip) => void;
  /** Hide "All" (shopping list: products of one status). */
  showAll?: boolean;
}

/** Status chips with counts (12A): one pill per status, the chosen one tinted in its status color. */
export const OrderStatusChips: React.FC<OrderStatusChipsProps> = ({ value, counts, onChange, showAll = true }) => {
  const chips: OrderStatusChip[] = showAll ? ["all", ...ORDER_STATUSES] : ORDER_STATUSES;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      <XStack role="radiogroup" aria-label={t("status")} gap={8}>
        {chips.map((chip) => {
          const selected = chip === value;
          const a = resolveListAccent(chip === "all" ? "orders" : ORDER_STATUS_STYLE[chip].accent);
          const label = chip === "all" ? t("ordersFilterAll") : t(ORDER_STATUS_STYLE[chip].label);
          return (
            <XStack
              key={chip}
              role="radio"
              aria-checked={selected}
              aria-label={`${label}, ${counts[chip]}`}
              onPress={() => onChange(chip)}
              pressStyle={{ opacity: 0.85 }}
              alignItems="center"
              gap={8}
              height={40}
              paddingLeft={14}
              paddingRight={8}
              borderRadius={20}
              borderWidth={1}
              borderColor={selected ? withAlpha(a.tint, 0.5) : "$neutralRaisedBorder"}
              backgroundColor={selected ? a.fill : "$neutralCard"}
            >
              <Text fontSize={13.5} fontWeight="$button" color={selected ? a.tint : "$neutralMuted"} numberOfLines={1}>
                {label}
              </Text>
              <XStack
                minWidth={24}
                height={24}
                paddingHorizontal={7}
                borderRadius={12}
                alignItems="center"
                justifyContent="center"
                backgroundColor={selected ? a.fill : "$neutralTintFill"}
              >
                <Text fontSize={12} fontWeight="$button" color={selected ? a.tint : "$neutralTint"}>
                  {counts[chip]}
                </Text>
              </XStack>
            </XStack>
          );
        })}
      </XStack>
    </ScrollView>
  );
};
