import { ListChip, SectionActionPill, StatusBadge } from "@/core/components";
import { formatPrice } from "@/core/utils/formatters";
import React from "react";
import { Text, View, XStack, YStack } from "tamagui";
import type { EventOrderRowData } from "../types";
import { ORDER_STATUS_STYLE } from "./orderListState";

export interface EventParticipantOrdersProps {
  /** Participant name for the accessible labels. */
  name: string;
  orders: EventOrderRowData[];
  /** Add order under the list (exam takers only). */
  showAdd: boolean;
  onAddOrder: () => void;
  onOpenOrder: (order: EventOrderRowData) => void;
  /** Opens the status sheet; without it the badge is read-only (exams switched off, Q3). */
  onChangeStatus?: (order: EventOrderRowData) => void;
}

/**
 * Event orders of one participant (10D1): compact rows on the page fill
 * (product or "N items", a total per currency, the status badge that opens
 * the status sheet), unsaved drafts marked, then Add order in the orders accent.
 */
export const EventParticipantOrders: React.FC<EventParticipantOrdersProps> = ({
  name,
  orders,
  showAdd,
  onAddOrder,
  onOpenOrder,
  onChangeStatus,
}) => (
  <YStack gap={10}>
    {orders.length > 0 ? (
      <YStack
        borderRadius={16}
        borderWidth={1}
        borderColor="$neutralCardBorder"
        backgroundColor="$neutralPage"
        overflow="hidden"
      >
        {orders.map((order, index) => {
          const style = ORDER_STATUS_STYLE[order.status];
          const title = order.productName ?? t("ordersItemsCount", { count: order.itemCount });
          return (
            <YStack key={order.id}>
              {index > 0 ? <View height={1} marginHorizontal={12} backgroundColor="$neutralCardBorder" /> : null}
              <XStack alignItems="center" gap={8} paddingVertical={6} paddingLeft={12} paddingRight={6}>
                <XStack
                  role="link"
                  aria-label={title}
                  onPress={() => onOpenOrder(order)}
                  pressStyle={{ opacity: 0.85 }}
                  flex={1}
                  minWidth={0}
                  minHeight={44}
                  alignItems="center"
                  gap={8}
                >
                  <XStack flex={1} minWidth={0} alignItems="center" gap={6}>
                    <Text flexShrink={1} fontSize={14} fontWeight="$button" color="$neutralText" numberOfLines={1}>
                      {title}
                    </Text>
                    {order.draft ? <ListChip accent="orders" label={t("ordersUnsaved")} /> : null}
                  </XStack>
                  <YStack alignItems="flex-end" gap={1} flexShrink={0}>
                    {Object.entries(order.totalsByCurrency).map(([currency, amount]) => (
                      <Text key={currency} fontSize={13.5} fontWeight="$button" color="$neutralText" numberOfLines={1}>
                        {formatPrice(amount, currency)}
                      </Text>
                    ))}
                  </YStack>
                </XStack>
                <XStack
                  role={onChangeStatus ? "button" : undefined}
                  aria-label={onChangeStatus ? t("statusChangeNow", { status: t(style.label) }) : undefined}
                  onPress={onChangeStatus ? () => onChangeStatus(order) : undefined}
                  pressStyle={onChangeStatus ? { opacity: 0.85 } : undefined}
                  minHeight={44}
                  paddingHorizontal={4}
                  alignItems="center"
                  justifyContent="center"
                >
                  <StatusBadge label={t(style.label)} color={style.accent} />
                </XStack>
              </XStack>
            </YStack>
          );
        })}
      </YStack>
    ) : null}
    {showAdd ? (
      <XStack>
        <SectionActionPill
          accent="orders"
          action={{ label: t("ordersAddOrder"), ariaLabel: t("ordersAddOrderLabel", { name }), onPress: onAddOrder }}
        />
      </XStack>
    ) : null}
  </YStack>
);
