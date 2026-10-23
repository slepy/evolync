import { MemberAvatar, ListImage, ListRow, StatusBadge } from "@/core/components";
import { ShoppingBag } from "lucide-react-native";
import type { OrderListEntry } from "../hooks/useOrdersList";
import type { OrdersScope } from "./orderAccess";
import { formatOrderDay, formatOrderTotals } from "./orderFormat";
import { ORDER_STATUS_STYLE } from "./orderListState";
import { OrderEventLine } from "./OrderEventLine";

export interface OrderRowProps {
  scope: OrdersScope;
  entry: OrderListEntry;
  onPress: () => void;
}

export function OrderRow({ scope, entry, onPress }: OrderRowProps) {
  const style = ORDER_STATUS_STYLE[entry.status];
  const statusChip = <StatusBadge label={t(style.label)} color={style.accent} />;
  const firstItem = entry.items[0];
  const total = formatOrderTotals(entry.totalsByCurrency);
  const eventLine = entry.eventName ? <OrderEventLine name={entry.eventName} /> : undefined;

  if (scope === "student") {
    return (
      <ListRow
        title={
          entry.items.length === 1 && firstItem
            ? firstItem.productName
            : t("ordersItemsCount", { count: entry.itemCount })
        }
        subtitle={[formatOrderDay(entry.createdAt), total].filter(Boolean).join(" · ")}
        meta={eventLine}
        leading={<ListImage uri={firstItem?.imageUrl} icon={ShoppingBag} accent="orders" />}
        trailing={statusChip}
        onPress={onPress}
      />
    );
  }

  return (
    <ListRow
      title={entry.memberName}
      subtitle={[t("ordersItemsCount", { count: entry.itemCount }), formatOrderDay(entry.createdAt)].join(" · ")}
      meta={eventLine}
      leading={<MemberAvatar size={48} name={entry.memberName} uri={entry.memberAvatarUrl} rankId={entry.memberRankId} />}
      trailing={statusChip}
      onPress={onPress}
    />
  );
}
