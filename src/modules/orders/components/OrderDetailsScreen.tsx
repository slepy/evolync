import {
  ListAvatar,
  ListCard,
  PrimaryButton,
  SubScreenPage,
  TrashButton,
  memberInitials,
  resolveListAccent,
} from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { LoadingScreen } from "@/modules/core/components";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useProducts } from "@/modules/inventory/hooks";
import React, { useEffect, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useOrderDetails, type OrderItemDetails } from "../hooks/useOrderDetails";
import { useOrganizationIdOfSchool } from "../hooks/useOrganizationIdOfSchool";
import type { OrderStatus } from "../types";
import type { CartItem } from "../types/dto";
import { AddProductSheet, ProductSizesSheet } from "./AddProductSheet";
import { canChangeOrderStatus, canDeleteOrder, canEditOrder, type OrdersScope } from "./orderAccess";
import { diffCart, hasCartChanges } from "./orderCart";
import { formatOrderDateTime } from "./orderFormat";
import { ORDER_STATUS_STYLE } from "./orderListState";
import { OrderProductsSection } from "./OrderProductsSection";
import { OrderStatusPill } from "./OrderStatusChips";
import { OrderStatusSheet } from "./OrderStatusSheet";

interface OrderDetailsScreenProps {
  scope: OrdersScope;
  orderId: string;
  /** Student scope: the member's id; another member's order shows as not found. */
  memberId?: string;
  /** After Save and after Delete. */
  onDone: () => void;
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
 * Order (12D): member, Status (Change opens 12C), Created / Updated, then
 * the products (tap to change sizes, trash removes, Add new opens 12F).
 * Staff edit in every status; the student only while placed and never the
 * status. Save appears after a change.
 */
export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ scope, orderId, memberId, onDone }) => {
  const { orderDetails, isLoading, isUpdating, error, updateStatus, updateItems, deleteOrder } =
    useOrderDetails(orderId);
  const organizationId = useOrganizationIdOfSchool(orderDetails?.order.schoolId);
  const { products } = useProducts(organizationId ?? "");

  const [cart, setCart] = useState<CartItem[] | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [sheet, setSheet] = useState<"status" | "add" | { productId: string } | null>(null);

  useEffect(() => {
    if (orderDetails && cart === null) setCart(toCart(orderDetails.items));
  }, [orderDetails, cart]);

  if (isLoading || (orderDetails && cart === null)) return <LoadingScreen />;

  const notOwn = scope === "student" && orderDetails?.order.schoolMemberId !== memberId;
  if (!orderDetails || !cart || notOwn) {
    return (
      <SubScreenPage title={t("ordersOrder")}>
        <Text fontSize={15} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {t("errorNotFound")}
        </Text>
      </SubScreenPage>
    );
  }

  const { order, member, items } = orderDetails;
  const currentStatus = status ?? order.status;
  const editable = canEditOrder(scope, order.status);
  const statusChanged = currentStatus !== order.status;
  const changed = statusChanged || hasCartChanges(items, cart);
  const memberName = member?.displayName || member?.email || t("unknownMember");
  const statusStyle = ORDER_STATUS_STYLE[currentStatus];
  const sizesProduct = typeof sheet === "object" && sheet ? products.find((p) => p.id === sheet.productId) ?? null : null;

  const handleSave = async () => {
    try {
      if (statusChanged) await updateStatus(currentStatus);
      const diff = diffCart(items, cart);
      if (diff.itemIdsToRemove.length || diff.itemsToAdd.length || diff.quantityUpdates.length) {
        await updateItems(diff.itemIdsToRemove, diff.itemsToAdd, diff.quantityUpdates);
      }
      onDone();
    } catch {
      // The hook keeps the error, shown above the button.
    }
  };

  const handleDelete = () =>
    confirmDelete(t("ordersDeleteTitle"), t("ordersDeleteMessage"), async () => {
      try {
        await deleteOrder();
        onDone();
      } catch {
        // The hook keeps the error.
      }
    });

  return (
    <SubScreenPage
      title={t("ordersOrder")}
      right={
        canDeleteOrder(scope, order.status) ? (
          <TrashButton label={t("ordersDeleteTitle")} onPress={handleDelete} disabled={isUpdating} />
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
            <PrimaryButton label={t("save")} accent="orders" onPress={handleSave} loading={isUpdating} disabled={cart.length === 0} />
          </YStack>
        ) : undefined
      }
    >
      <ListCard>
        {scope !== "student" ? (
          <XStack alignItems="center" gap={12} paddingVertical={14} paddingHorizontal={16}>
            <ListAvatar size={48} initials={memberInitials(memberName)} uri={member?.avatarUrl} />
            <YStack flex={1} minWidth={0} gap={3}>
              <Text fontSize={17} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
                {memberName}
              </Text>
              {member?.email && member.email !== memberName ? (
                <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
                  {member.email}
                </Text>
              ) : null}
            </YStack>
          </XStack>
        ) : null}
        <XStack
          role={canChangeOrderStatus(scope) ? "button" : undefined}
          aria-label={t("ordersChangeStatusNow", { status: t(statusStyle.label) })}
          onPress={canChangeOrderStatus(scope) ? () => setSheet("status") : undefined}
          pressStyle={canChangeOrderStatus(scope) ? { opacity: 0.85 } : undefined}
          alignItems="center"
          gap={12}
          minHeight={56}
          paddingVertical={8}
          paddingHorizontal={16}
        >
          <Text flex={1} fontSize={14} fontWeight="700" color="$neutralMuted">
            {t("status")}
          </Text>
          <OrderStatusPill size="md" label={t(statusStyle.label)} tint={statusStyle.tint} fill={statusStyle.fill} />
          {canChangeOrderStatus(scope) ? (
            <Text fontSize={14} fontWeight="$rowTitle" color={resolveListAccent("orders").tint}>
              {t("ordersChange")}
            </Text>
          ) : null}
        </XStack>
        <XStack gap={12} paddingTop={12} paddingBottom={14} paddingHorizontal={16}>
          <DateCell label={t("ordersCreated")} date={order.createdAt} />
          <DateCell label={t("ordersUpdated")} date={order.updatedAt} />
        </XStack>
      </ListCard>

      <OrderProductsSection
        cart={cart}
        editable={editable}
        onAddProduct={() => setSheet("add")}
        onProductPress={(productId) => setSheet({ productId })}
        onRemove={(itemId) => setCart(cart.filter((item) => item.id !== itemId))}
        hint={editable ? t("ordersDetailsHint") : t("ordersLockedHint")}
      />

      <OrderStatusSheet
        open={sheet === "status"}
        onOpenChange={(open) => setSheet(open ? "status" : null)}
        subtitle={scope !== "student" ? t("ordersStatusFor", { name: memberName }) : undefined}
        value={currentStatus}
        current={order.status}
        onSave={setStatus}
      />
      <AddProductSheet
        open={sheet === "add"}
        onOpenChange={(open) => setSheet(open ? "add" : null)}
        products={products}
        cart={cart}
        onAdd={setCart}
      />
      <ProductSizesSheet
        open={!!sizesProduct}
        onOpenChange={(open) => (open ? undefined : setSheet(null))}
        product={sizesProduct}
        cart={cart}
        onSave={setCart}
      />
    </SubScreenPage>
  );
};

function DateCell({ label, date }: { label: string; date: Date }) {
  return (
    <YStack flex={1} gap={2}>
      <Text fontSize={12} fontWeight="700" color={neutral.placeholder}>
        {label}
      </Text>
      <Text fontSize={14} fontWeight="700" color="$neutralText">
        {formatOrderDateTime(date)}
      </Text>
    </YStack>
  );
}
