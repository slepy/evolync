import {
  MemberAvatar,
  ListCard,
  ListChip,
  ListIcon,
  ListRow,
  PrimaryButton,
  StatusBadge,
  SubScreenPage,
  TrashButton,
  resolveListAccent,
} from "@/core/components";
import { useLeaveScreen } from "@/core/hooks";
import { neutral } from "@/core/theme/tokens";
import { formatEventDates } from "@/modules/events/components/formatEventDates";
import { timestampToDay } from "@/modules/trainings/types/helpers";
import { CalendarDays } from "lucide-react-native";
import { LoadingScreen } from "@/core/components";
import { confirmDelete } from "@/core/utils/confirmDelete";
import { useProducts } from "@/modules/inventory/hooks";
import React, { useEffect, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useOrderDetails, type OrderItemDetails } from "../hooks/useOrderDetails";
import { useOrganizationIdOfSchool } from "../hooks/useOrganizationIdOfSchool";
import type { OrderStatus } from "../types";
import type { CartItem } from "../types/dto";
import { AddProductSheet } from "./AddProductSheet";
import { canChangeOrderStatus, canDeleteOrder, canEditOrder, type OrdersScope } from "./orderAccess";
import { diffCart, hasCartChanges } from "./orderCart";
import { formatOrderDateTime } from "./orderFormat";
import { ORDER_STATUS_STYLE } from "./orderListState";
import { OrderProductsSection } from "./OrderProductsSection";
import { OrderStatusSheet } from "./OrderStatusSheet";

interface OrderDetailsScreenProps {
  scope: OrdersScope;
  orderId: string;
  /** Student scope: the member's id; another member's order shows as not found. */
  memberId?: string;
  /** After Save and after Delete. */
  onDone: () => void;
  /** Opens the event of an event order; without it the Event row does nothing. */
  onOpenEvent?: (eventId: string) => void;
}

const toCart = (items: OrderItemDetails[]): CartItem[] =>
  items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    variantName: item.variantName,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    currency: item.currency,
    imageUrl: item.productImageUrl,
  }));

/**
 * Order details (12D). One card with the member, the Status row ("Change"
 * opens 12C) and Created / Updated; then the products (tap one to change its
 * size or quantity, trash removes it) with a Total per currency. Staff
 * (organization / school) change the status and the products in every status;
 * the student sees their own order and changes or deletes it only while it is
 * placed. Save appears after a change.
 */
export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  scope,
  orderId,
  memberId,
  onDone,
  onOpenEvent,
}) => {
  const { orderDetails, isLoading, isUpdating, error, updateStatus, updateItems, deleteOrder } =
    useOrderDetails(orderId);
  const organizationId = useOrganizationIdOfSchool(orderDetails?.order.schoolId);
  const { products } = useProducts(organizationId ?? "");

  const [cart, setCart] = useState<CartItem[] | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [sheet, setSheet] = useState<"status" | "product" | null>(null);
  const [focusProductId, setFocusProductId] = useState<string | null>(null);
  // The saved / deleted order re-emits (Save hides, a deleted order reads "not found"): the screen stays as it is until it is popped (Android black screen).
  const { leaving, leave, hold } = useLeaveScreen();

  const openProducts = (productId: string | null) => {
    setFocusProductId(productId);
    setSheet("product");
  };

  useEffect(() => {
    if (orderDetails && cart === null) setCart(toCart(orderDetails.items));
  }, [orderDetails, cart]);

  if (isLoading || (orderDetails && cart === null)) return hold(<LoadingScreen />);

  const notOwn = scope === "student" && orderDetails?.order.schoolMemberId !== memberId;
  if (!orderDetails || !cart || notOwn) {
    return hold(
      <SubScreenPage title={t("ordersDetailsTitle")}>
        <Text fontSize={15} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {t("errorNotFound")}
        </Text>
      </SubScreenPage>
    );
  }

  const { order, member, event, items } = orderDetails;
  const currentStatus = status ?? order.status;
  const editable = canEditOrder(scope, order.status);
  const statusChanged = currentStatus !== order.status;
  const changed = statusChanged || hasCartChanges(items, cart);
  const memberName = member?.displayName || member?.email || t("unknownMember");

  const handleSave = async () => {
    try {
      await leave(async () => {
        if (statusChanged) await updateStatus(currentStatus);
        const diff = diffCart(items, cart);
        if (diff.itemIdsToRemove.length || diff.itemsToAdd.length || diff.quantityUpdates.length) {
          await updateItems(diff.itemIdsToRemove, diff.itemsToAdd, diff.quantityUpdates);
        }
      }, onDone);
    } catch {
      // The hook keeps the error, shown above the button.
    }
  };

  const handleDelete = () =>
    confirmDelete(t("ordersDeleteTitle"), t("ordersDeleteMessage"), async () => {
      try {
        await leave(deleteOrder, onDone);
      } catch {
        // The hook keeps the error.
      }
    });

  const statusStyle = ORDER_STATUS_STYLE[currentStatus];
  const changeStatus = canChangeOrderStatus(scope);

  return hold(
    <SubScreenPage
      title={t("ordersDetailsTitle")}
      right={
        canDeleteOrder(scope, order.status) ? (
          <TrashButton label={t("ordersDeleteTitle")} onPress={handleDelete} disabled={isUpdating || leaving} />
        ) : undefined
      }
      footer={
        changed && editable ? (
          <YStack gap={10}>
            {error ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                {error}
              </Text>
            ) : null}
            <PrimaryButton
              label={t("save")}
              accent="orders"
              onPress={handleSave}
              loading={isUpdating || leaving}
              disabled={cart.length === 0}
            />
          </YStack>
        ) : undefined
      }
    >
      <ListCard>
        {scope !== "student" ? (
          <ListRow
            title={memberName}
            subtitle={member?.email && member.email !== memberName ? member.email : undefined}
            leading={<MemberAvatar size={48} name={memberName} uri={member?.avatarUrl} rankId={member?.currentRankId} />}
          />
        ) : null}
        {event ? (
          <ListRow
            size="md"
            title={event.name}
            aria-label={`${t("event")}, ${event.name}`}
            subtitle={`${t("event")} · ${formatEventDates(timestampToDay(event.startDate), timestampToDay(event.endDate))}`}
            badge={event.cancelled ? <ListChip accent="danger" label={t("statusCancelled")} /> : undefined}
            leading={<ListIcon icon={CalendarDays} accent="events" size={44} />}
            onPress={onOpenEvent ? () => onOpenEvent(event.id) : undefined}
            role={onOpenEvent ? "link" : undefined}
          />
        ) : null}
        <XStack
          role={changeStatus ? "button" : undefined}
          aria-label={changeStatus ? t("statusChangeNow", { status: t(statusStyle.label) }) : undefined}
          onPress={changeStatus ? () => setSheet("status") : undefined}
          pressStyle={changeStatus ? { opacity: 0.85 } : undefined}
          alignItems="center"
          gap={12}
          minHeight={56}
          paddingVertical={8}
          paddingHorizontal={16}
        >
          <Text flex={1} fontSize={14} fontWeight="$button" color="$neutralMuted">
            {t("status")}
          </Text>
          <StatusBadge size="md" label={t(statusStyle.label)} color={statusStyle.accent} />
          {changeStatus ? (
            <Text fontSize={14} fontWeight="$rowTitle" color={resolveListAccent("orders").tint}>
              {t("change")}
            </Text>
          ) : null}
        </XStack>
        <XStack gap={12} paddingTop={12} paddingBottom={14} paddingHorizontal={16}>
          <OrderDate label={t("created")} date={order.createdAt} />
          <OrderDate label={t("updated")} date={order.updatedAt} />
        </XStack>
      </ListCard>

      <OrderProductsSection
        cart={cart}
        onChange={editable ? setCart : undefined}
        onAddProduct={editable ? () => openProducts(null) : undefined}
        onEditProduct={editable ? openProducts : undefined}
        hint={t("ordersProductsEditHint")}
      />

      {!editable ? (
        <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {t("ordersLockedHint")}
        </Text>
      ) : null}

      <OrderStatusSheet
        open={sheet === "status"}
        onOpenChange={(open) => setSheet(open ? "status" : null)}
        subtitle={memberName}
        value={currentStatus}
        onSelect={setStatus}
      />
      <AddProductSheet
        open={sheet === "product"}
        onOpenChange={(open) => setSheet(open ? "product" : null)}
        products={products}
        cart={cart}
        onAdd={setCart}
        focusProductId={focusProductId}
      />
    </SubScreenPage>
  );
};

interface OrderDateProps {
  label: string;
  date: Date;
}

function OrderDate({ label, date }: OrderDateProps) {
  return (
    <YStack flex={1} gap={2}>
      <Text fontSize={12} fontWeight="$button" color={neutral.placeholder}>
        {label}
      </Text>
      <Text fontSize={14} fontWeight="$button" color="$neutralText">
        {formatOrderDateTime(date)}
      </Text>
    </YStack>
  );
}
