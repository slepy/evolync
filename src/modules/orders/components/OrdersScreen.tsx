import {
  ListAvatar,
  ListCard,
  ListChip,
  ListImage,
  ListRow,
  ListSection,
  PillGroup,
  SubScreenPage,
  memberInitials,
} from "@/core/components";
import { LoadingScreen } from "@/modules/core/components";
import * as Clipboard from "expo-clipboard";
import { Copy, ShoppingBag } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Alert } from "react-native";
import { Text, YStack } from "tamagui";
import type { OrderListEntry } from "../hooks/useOrdersList";
import { canAddOrder, showsSchoolName, type OrdersScope } from "./orderAccess";
import { formatOrderDay, formatOrderTotals } from "./orderFormat";
import {
  ORDER_STATUS_STYLE,
  buildShoppingList,
  countOrdersByStatus,
  filterOrdersByStatus,
  isStandardVariant,
  shoppingListText,
  type OrderStatusChip,
} from "./orderListState";
import { OrderStatusChips } from "./OrderStatusChips";

type OrdersTab = "orders" | "shopping";

interface OrdersScreenProps {
  scope: OrdersScope;
  entries: OrderListEntry[];
  isLoading: boolean;
  error?: string | null;
  /** Add new (12E); ignored where adding is not allowed (organization). */
  onAdd?: () => void;
  onOrderPress: (entry: OrderListEntry) => void;
  /** Muted line under the title (school name, "All schools"). */
  subtitle?: string;
}

/**
 * Orders (12A) and Shopping list (12B). Status chips with counts filter both
 * tabs; staff rows show the member (photo or initials), the student's rows
 * the ordered product. The shopping list sums the products of the filtered
 * orders and copies them as text.
 */
export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  scope,
  entries,
  isLoading,
  error,
  onAdd,
  onOrderPress,
  subtitle,
}) => {
  const [tab, setTab] = useState<OrdersTab>("orders");
  const [status, setStatus] = useState<OrderStatusChip>("all");

  const counts = useMemo(() => countOrdersByStatus(entries), [entries]);
  const filtered = useMemo(() => filterOrdersByStatus(entries, status), [entries, status]);
  const shoppingList = useMemo(() => buildShoppingList(filtered), [filtered]);
  const student = scope === "student";
  const tabs = student ? null : (
    <PillGroup
      accent="orders"
      value={tab}
      onChange={(next) => {
        setTab(next);
        // The shopping list is what has to be bought: products of placed orders by default.
        if (next === "shopping" && status === "all") setStatus("placed");
      }}
      options={[
        { value: "orders", label: t("ordersTabOrders") },
        { value: "shopping", label: t("ordersTabShoppingList") },
      ]}
    />
  );

  const handleCopy = async () => {
    await Clipboard.setStringAsync(shoppingListText(shoppingList));
    Alert.alert(t("success"), t("ordersCopiedToClipboard"));
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SubScreenPage title={t("ordersTitle")} subtitle={subtitle}>
      {tabs}
      <OrderStatusChips value={status} counts={counts} onChange={setStatus} showAll={tab === "orders"} />

      {error ? (
        <Text fontSize={13} fontWeight="$secondary" color="$trashText">
          {error}
        </Text>
      ) : null}

      {tab === "orders" ? (
        <ListSection
          title={student ? t("ordersYourOrders") : t("ordersTitle")}
          accent="orders"
          action={canAddOrder(scope) && onAdd ? { label: t("addNew"), onPress: onAdd } : undefined}
        >
          {filtered.length > 0 ? (
            <ListCard aria-label={t("ordersTitle")}>
              {filtered.map((entry) => (
                <OrderRow key={entry.orderId} scope={scope} entry={entry} onPress={() => onOrderPress(entry)} />
              ))}
            </ListCard>
          ) : (
            <EmptyCard text={status === "all" ? t("emptyNoOrders") : t("emptyNoOrdersFiltered")} />
          )}
        </ListSection>
      ) : (
        <ListSection
          title={t("ordersTabShoppingList")}
          accent="orders"
          action={shoppingList.length > 0 ? { label: t("copy"), icon: Copy, onPress: handleCopy } : undefined}
        >
          {shoppingList.length > 0 ? (
            <ListCard aria-label={t("ordersTabShoppingList")}>
              {shoppingList.map((item) => (
                <ListRow
                  key={item.variantId}
                  title={item.productName}
                  subtitle={[
                    isStandardVariant(item.variantName) ? null : item.variantName,
                    t("ordersInOrders", { count: item.orderCount }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  leading={<ListImage uri={item.imageUrl} icon={ShoppingBag} accent="orders" />}
                  trailing={<ListChip label={`×${item.totalQuantity}`} accent="orders" />}
                />
              ))}
            </ListCard>
          ) : (
            <EmptyCard text={t("emptyNoProductsFiltered")} />
          )}
        </ListSection>
      )}
    </SubScreenPage>
  );
};

function OrderRow({ scope, entry, onPress }: { scope: OrdersScope; entry: OrderListEntry; onPress: () => void }) {
  const style = ORDER_STATUS_STYLE[entry.status];
  const statusChip = <ListChip label={t(style.label)} accent={style.accent} />;
  const firstItem = entry.items[0];
  const total = formatOrderTotals(entry.totalsByCurrency);

  if (scope === "student") {
    return (
      <ListRow
        title={
          entry.items.length === 1 && firstItem
            ? firstItem.productName
            : t("ordersItemsCount", { count: entry.itemCount })
        }
        subtitle={[formatOrderDay(entry.createdAt), total].filter(Boolean).join(" · ")}
        leading={<ListImage uri={firstItem?.imageUrl} icon={ShoppingBag} accent="orders" />}
        trailing={statusChip}
        onPress={onPress}
      />
    );
  }

  return (
    <ListRow
      title={entry.memberName}
      subtitle={[
        showsSchoolName(scope) ? entry.schoolName : null,
        t("ordersItemsCount", { count: entry.itemCount }),
        formatOrderDay(entry.createdAt),
      ]
        .filter(Boolean)
        .join(" · ")}
      leading={<ListAvatar size={48} initials={memberInitials(entry.memberName)} uri={entry.memberAvatarUrl} />}
      trailing={statusChip}
      onPress={onPress}
    />
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <YStack padding={20} borderRadius="$card" borderWidth={1} borderColor="$neutralCardBorder" backgroundColor="$neutralCard">
      <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" textAlign="center">
        {text}
      </Text>
    </YStack>
  );
}
