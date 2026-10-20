import {
  ListCard,
  ListImage,
  ListRow,
  ListSection,
  PrimaryButton,
  StatusFilter,
  SubScreenPage,
  ViewSwitch,
} from "@/core/components";
import { LoadingScreen } from "@/core/components";
import * as Clipboard from "expo-clipboard";
import { ClipboardList, Copy, Package, ShoppingBag } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Alert } from "react-native";
import { Text, YStack } from "tamagui";
import type { OrderListEntry } from "../hooks/useOrdersList";
import { canAddOrder, type OrdersScope } from "./orderAccess";
import {
  ORDER_STATUSES,
  ORDER_STATUS_STYLE,
  SHOPPING_CHIPS,
  buildShoppingList,
  countOrdersByStatus,
  countShoppingChips,
  filterOrdersByStatus,
  filterShoppingOrders,
  shoppingListText,
  shoppingVariantsLine,
  type OrderStatusChip,
  type ShoppingChip,
} from "./orderListState";
import { OrderRow } from "./OrderRow";

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
 * Orders (12A) and Shopping list (12B). Status chips with counts filter the
 * orders; staff rows show the member (photo or initials), the student's rows
 * the ordered product. The shopping list has its own chips (To order =
 * Placed + Paid, Processing, Ready), lists the products of those orders with
 * their sizes and copies them as text.
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
  const [shoppingChip, setShoppingChip] = useState<ShoppingChip>("to_order");

  const counts = useMemo(() => countOrdersByStatus(entries), [entries]);
  const filtered = useMemo(() => filterOrdersByStatus(entries, status), [entries, status]);
  const shoppingCounts = useMemo(() => countShoppingChips(entries), [entries]);
  const shoppingOrders = useMemo(() => filterShoppingOrders(entries, shoppingChip), [entries, shoppingChip]);
  const shoppingList = useMemo(() => buildShoppingList(shoppingOrders), [shoppingOrders]);
  const shoppingPieces = shoppingList.reduce((sum, product) => sum + product.totalQuantity, 0);
  const student = scope === "student";
  const tabs = student ? null : (
    <ViewSwitch
      accent="orders"
      aria-label={t("orders")}
      active={tab === "orders" ? "first" : "second"}
      first={{ icon: ShoppingBag, label: t("orders"), onPress: () => setTab("orders") }}
      second={{
        icon: ClipboardList,
        label: t("ordersTabShoppingList"),
        onPress: () => setTab("shopping"),
      }}
    />
  );
  const shoppingChipLabel = (chip: ShoppingChip) =>
    chip === "to_order" ? t("ordersToOrder") : t(ORDER_STATUS_STYLE[chip].label);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(shoppingListText(shoppingList));
    Alert.alert(t("success"), t("ordersCopiedToClipboard"));
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SubScreenPage
      title={t("orders")}
      subtitle={subtitle}
      footer={
        tab === "shopping" && shoppingList.length > 0 ? (
          <PrimaryButton label={t("copy")} icon={Copy} accent="orders" onPress={handleCopy} />
        ) : undefined
      }
    >
      {tabs}
      {tab === "orders" ? (
        <StatusFilter
          aria-label={t("status")}
          accent="orders"
          value={status}
          onChange={setStatus}
          options={(["all", ...ORDER_STATUSES] as OrderStatusChip[]).map((chip) => ({
            value: chip,
            label: chip === "all" ? t("all") : t(ORDER_STATUS_STYLE[chip].label),
            color: chip === "all" ? undefined : ORDER_STATUS_STYLE[chip].accent,
            count: counts[chip],
          }))}
        />
      ) : (
        <StatusFilter
          aria-label={t("status")}
          accent="orders"
          value={shoppingChip}
          onChange={setShoppingChip}
          options={SHOPPING_CHIPS.map((chip) => ({
            value: chip,
            label: shoppingChipLabel(chip),
            color: chip === "to_order" ? undefined : ORDER_STATUS_STYLE[chip].accent,
            count: shoppingCounts[chip],
          }))}
        />
      )}

      {error ? (
        <Text fontSize={13} fontWeight="$secondary" color="$trashText">
          {error}
        </Text>
      ) : null}

      {tab === "orders" ? (
        <ListSection
          title={student ? t("ordersYourOrders") : t("orders")}
          accent="orders"
          action={canAddOrder(scope) && onAdd ? { label: t("addNew"), onPress: onAdd } : undefined}
        >
          {filtered.length > 0 ? (
            <ListCard aria-label={t("orders")}>
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
          title={shoppingChipLabel(shoppingChip)}
          subtitle={[
            t("ordersCount", { count: shoppingOrders.length }),
            t("piecesCount", { count: shoppingPieces }),
            shoppingChip === "to_order" ? t("ordersToOrderStatuses") : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          accent="orders"
        >
          {shoppingList.length > 0 ? (
            <ListCard aria-label={t("ordersTabShoppingList")}>
              {shoppingList.map((product) => (
                <ListRow
                  key={product.productId}
                  size="md"
                  title={product.productName}
                  subtitle={shoppingVariantsLine(product)}
                  leading={<ListImage uri={product.imageUrl} icon={Package} accent="products" size={44} />}
                  trailing={
                    <Text fontSize={14} fontWeight="$rowTitle" color="$neutralText" flexShrink={0}>
                      {t("piecesCount", { count: product.totalQuantity })}
                    </Text>
                  }
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

interface EmptyCardProps {
  text: string;
}

function EmptyCard({ text }: EmptyCardProps) {
  return (
    <YStack padding={20} borderRadius="$card" borderWidth={1} borderColor="$neutralCardBorder" backgroundColor="$neutralCard">
      <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" textAlign="center">
        {text}
      </Text>
    </YStack>
  );
}
