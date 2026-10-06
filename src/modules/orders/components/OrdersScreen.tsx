import {
  ListAvatar,
  ListCard,
  ListImage,
  ListRow,
  ListSection,
  PrimaryButton,
  SubScreenPage,
  TabSwitch,
  memberInitials,
  resolveListAccent,
} from "@/core/components";
import { LoadingScreen } from "@/modules/core/components";
import * as Clipboard from "expo-clipboard";
import { ClipboardList, Copy, Package, Plus, ShoppingBag } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Alert } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import type { OrderListEntry } from "../hooks/useOrdersList";
import { canAddOrder, type OrdersScope } from "./orderAccess";
import { formatOrderDay } from "./orderFormat";
import {
  ORDER_FILTERS,
  ORDER_STATUS_STYLE,
  SHOPPING_FILTERS,
  amountLines,
  buildShoppingList,
  countByFilter,
  matchesOrderFilter,
  matchesShoppingFilter,
  sizesLine,
  shoppingListText,
  totalPieces,
  type OrderFilter,
  type ShoppingFilter,
} from "./orderListState";
import { OrderStatusChips, OrderStatusPill, type StatusChip } from "./OrderStatusChips";

type OrdersTab = "orders" | "shopping";

interface OrdersScreenProps {
  scope: OrdersScope;
  entries: OrderListEntry[];
  isLoading: boolean;
  error?: string | null;
  /** Add new (12E); not shown where adding is not allowed (organization). */
  onAdd?: () => void;
  onOrderPress: (entry: OrderListEntry) => void;
  /** Muted line under the title ("All schools"). */
  subtitle?: string;
}

const ordersAccent = resolveListAccent("orders");

const orderChip = (filter: OrderFilter, count: number): StatusChip<OrderFilter> =>
  filter === "open"
    ? { key: filter, label: t("ordersFilterOpen"), count, tint: ordersAccent.tint, fill: ordersAccent.fill }
    : { key: filter, label: t(ORDER_STATUS_STYLE[filter].label), count, dot: true, tint: ORDER_STATUS_STYLE[filter].tint, fill: ORDER_STATUS_STYLE[filter].fill };

const shoppingChip = (filter: ShoppingFilter, count: number): StatusChip<ShoppingFilter> =>
  filter === "toOrder"
    ? { key: filter, label: t("ordersToOrder"), count, tint: ordersAccent.tint, fill: ordersAccent.fill }
    : { key: filter, label: t(ORDER_STATUS_STYLE[filter].label), count, dot: true, tint: ORDER_STATUS_STYLE[filter].tint, fill: ORDER_STATUS_STYLE[filter].fill };

/**
 * Orders (12A) and Shopping list (12B). Orders: status chips with counts
 * (Open first), rows with the member (photo or initials), "N items · date",
 * the total per currency and the status pill on the right. Shopping list:
 * To order / Processing / Ready, one row per product with its sizes, Copy
 * pinned at the bottom.
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
  const [filter, setFilter] = useState<OrderFilter>("open");
  const [shopping, setShopping] = useState<ShoppingFilter>("toOrder");
  const staff = scope !== "student";

  const orderCounts = useMemo(() => countByFilter(entries, ORDER_FILTERS, matchesOrderFilter), [entries]);
  const shoppingCounts = useMemo(() => countByFilter(entries, SHOPPING_FILTERS, matchesShoppingFilter), [entries]);
  const orders = useMemo(() => entries.filter((e) => matchesOrderFilter(e.status, filter)), [entries, filter]);
  const shoppingOrders = useMemo(() => entries.filter((e) => matchesShoppingFilter(e.status, shopping)), [entries, shopping]);
  const shoppingList = useMemo(() => buildShoppingList(shoppingOrders), [shoppingOrders]);
  const showShopping = staff && tab === "shopping";

  const handleCopy = async () => {
    await Clipboard.setStringAsync(shoppingListText(shoppingList));
    Alert.alert(t("success"), t("ordersCopiedToClipboard"));
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SubScreenPage
      title={t("ordersTitle")}
      subtitle={subtitle}
      footer={
        showShopping && shoppingList.length > 0 ? (
          <PrimaryButton label={t("copy")} icon={Copy} accent="orders" onPress={handleCopy} />
        ) : undefined
      }
    >
      <YStack gap={16}>
        {staff ? (
          <TabSwitch
            aria-label={t("ordersTitle")}
            accent="orders"
            value={tab}
            onChange={setTab}
            options={[
              { value: "orders", label: t("ordersTabOrders"), icon: ShoppingBag },
              { value: "shopping", label: t("ordersTabShoppingList"), icon: ClipboardList },
            ]}
          />
        ) : null}

        {showShopping ? (
          <OrderStatusChips
            aria-label={t("ordersToInclude")}
            chips={SHOPPING_FILTERS.map((f) => shoppingChip(f, shoppingCounts[f]))}
            value={shopping}
            onChange={setShopping}
          />
        ) : (
          <OrderStatusChips
            aria-label={t("status")}
            chips={ORDER_FILTERS.map((f) => orderChip(f, orderCounts[f]))}
            value={filter}
            onChange={setFilter}
          />
        )}
      </YStack>

      {error ? (
        <Text fontSize={13} fontWeight="$secondary" color="$trashText">
          {error}
        </Text>
      ) : null}

      {showShopping ? (
        <ListSection
          title={shoppingChip(shopping, 0).label}
          subtitle={[
            t("ordersOrdersCount", { count: shoppingOrders.length }),
            t("ordersPiecesCount", { count: totalPieces(shoppingOrders) }),
            shopping === "toOrder" ? t("ordersPlacedAndPaid") : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        >
          <ListCard aria-label={t("ordersTabShoppingList")}>
            {shoppingList.map((item) => (
              <ListRow
                key={item.productId}
                size="md"
                title={item.productName}
                subtitle={sizesLine(item)}
                leading={<ListImage uri={item.imageUrl} icon={Package} accent="products" size={44} />}
                trailing={<Amount text={t("ordersPiecesCount", { count: item.totalQuantity })} />}
              />
            ))}
            {shoppingList.length === 0 ? <EmptyRow text={t("ordersNoProductsWithStatus")} /> : null}
          </ListCard>
        </ListSection>
      ) : (
        <YStack gap={12}>
          <XStack alignItems="center" justifyContent="space-between" gap={12} minHeight={44}>
            <Text flexShrink={1} fontSize="$section" fontWeight="$section" letterSpacing={-0.2} color="$neutralText" numberOfLines={1}>
              {filter === "open" ? "" : t(ORDER_STATUS_STYLE[filter].title)}
            </Text>
            {canAddOrder(scope) && onAdd ? <AddNewPill onPress={onAdd} /> : null}
          </XStack>
          <ListCard aria-label={t("ordersTitle")}>
            {orders.map((entry) => (
              <OrderRow key={entry.orderId} scope={scope} entry={entry} onPress={() => onOrderPress(entry)} />
            ))}
            {orders.length === 0 ? <EmptyRow text={t("ordersNoOrdersWithStatus")} /> : null}
          </ListCard>
        </YStack>
      )}
    </SubScreenPage>
  );
};

function OrderRow({ scope, entry, onPress }: { scope: OrdersScope; entry: OrderListEntry; onPress: () => void }) {
  const style = ORDER_STATUS_STYLE[entry.status];
  const meta = `${t("ordersItemsCount", { count: entry.itemCount })} · ${formatOrderDay(entry.createdAt)}`;
  const firstItem = entry.items[0];
  const trailing = (
    <YStack alignItems="flex-end" gap={5} flexShrink={0}>
      <YStack alignItems="flex-end" gap={1}>
        {amountLines(entry.totalsByCurrency).map((line) => (
          <Amount key={line} text={line} />
        ))}
      </YStack>
      <OrderStatusPill label={t(style.label)} tint={style.tint} fill={style.fill} />
    </YStack>
  );

  if (scope === "student") {
    // The student's own orders: what was ordered instead of their own name.
    return (
      <ListRow
        size="md"
        title={
          entry.items.length === 1 && firstItem ? firstItem.productName : t("ordersItemsCount", { count: entry.itemCount })
        }
        subtitle={meta}
        leading={<ListImage uri={firstItem?.imageUrl} icon={Package} accent="products" size={44} />}
        trailing={trailing}
        onPress={onPress}
      />
    );
  }

  return (
    <ListRow
      size="md"
      title={entry.memberName}
      subtitle={meta}
      leading={<ListAvatar initials={memberInitials(entry.memberName)} uri={entry.memberAvatarUrl} />}
      trailing={trailing}
      onPress={onPress}
    />
  );
}

function Amount({ text }: { text: string }) {
  return (
    <Text fontSize={14} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
      {text}
    </Text>
  );
}

/** 44px "Add new" pill of the list header (12A). */
export function AddNewPill({ onPress, label }: { onPress: () => void; label?: string }) {
  return (
    <XStack
      role="button"
      aria-label={label ?? t("addNew")}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      alignItems="center"
      gap={6}
      height={44}
      paddingLeft={12}
      paddingRight={16}
      borderRadius={22}
      backgroundColor={ordersAccent.fill}
      flexShrink={0}
    >
      <Plus size={16} color={ordersAccent.tint} strokeWidth={2.8} />
      <Text fontSize="$button" fontWeight="$button" color={ordersAccent.tint}>
        {label ?? t("addNew")}
      </Text>
    </XStack>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <YStack paddingVertical={20} paddingHorizontal={16}>
      <Text fontSize={14} fontWeight="600" color="$neutralMuted">
        {text}
      </Text>
    </YStack>
  );
}
