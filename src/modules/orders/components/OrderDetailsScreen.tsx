import {
  ListAvatar,
  ListCard,
  ListRow,
  PrimaryButton,
  SelectField,
  StatusBadge,
  SubScreenPage,
  TrashButton,
  memberInitials,
} from "@/core/components";
import { LoadingScreen } from "@/modules/core/components";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useProducts } from "@/modules/inventory/hooks";
import React, { useEffect, useState } from "react";
import { Text, YStack } from "tamagui";
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
import { OrderStatusSheet, StatusDot } from "./OrderStatusSheet";

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
 * Order details (12D). Staff (organization / school) see the member, change
 * the status (12C) and the products in every status; the student sees their
 * own order and changes or deletes it only while it is placed. Save appears
 * after a change.
 */
export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ scope, orderId, memberId, onDone }) => {
  const { orderDetails, isLoading, isUpdating, error, updateStatus, updateItems, deleteOrder } =
    useOrderDetails(orderId);
  const organizationId = useOrganizationIdOfSchool(orderDetails?.order.schoolId);
  const { products } = useProducts(organizationId ?? "");

  const [cart, setCart] = useState<CartItem[] | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [sheet, setSheet] = useState<"status" | "product" | null>(null);

  useEffect(() => {
    if (orderDetails && cart === null) setCart(toCart(orderDetails.items));
  }, [orderDetails, cart]);

  if (isLoading || (orderDetails && cart === null)) return <LoadingScreen />;

  const notOwn = scope === "student" && orderDetails?.order.schoolMemberId !== memberId;
  if (!orderDetails || !cart || notOwn) {
    return (
      <SubScreenPage title={t("ordersDetailsTitle")}>
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

  const statusStyle = ORDER_STATUS_STYLE[currentStatus];

  return (
    <SubScreenPage
      title={t("ordersDetailsTitle")}
      subtitle={formatOrderDateTime(order.createdAt)}
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
            <PrimaryButton
              label={t("save")}
              accent="orders"
              onPress={handleSave}
              loading={isUpdating}
              disabled={cart.length === 0}
            />
          </YStack>
        ) : undefined
      }
    >
      {scope !== "student" ? (
        <ListCard>
          <ListRow
            title={memberName}
            subtitle={member?.email && member.email !== memberName ? member.email : undefined}
            leading={<ListAvatar size={48} initials={memberInitials(memberName)} uri={member?.avatarUrl} />}
          />
        </ListCard>
      ) : null}

      {canChangeOrderStatus(scope) ? (
        <SelectField
          label={t("status")}
          value={t(statusStyle.label)}
          leading={<StatusDot status={currentStatus} />}
          accent="orders"
          open={sheet === "status"}
          onPress={() => setSheet("status")}
        />
      ) : (
        <ListCard>
          <ListRow
            size="md"
            title={t("status")}
            leading={<StatusDot status={currentStatus} />}
            trailing={<StatusBadge label={t(statusStyle.label)} color={statusStyle.accent} />}
          />
        </ListCard>
      )}

      <OrderProductsSection
        cart={cart}
        onChange={editable ? setCart : undefined}
        onAddProduct={editable ? () => setSheet("product") : undefined}
      />

      {!editable ? (
        <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {t("ordersLockedHint")}
        </Text>
      ) : null}

      <OrderStatusSheet
        open={sheet === "status"}
        onOpenChange={(open) => setSheet(open ? "status" : null)}
        value={currentStatus}
        onSelect={setStatus}
      />
      <AddProductSheet
        open={sheet === "product"}
        onOpenChange={(open) => setSheet(open ? "product" : null)}
        products={products}
        cart={cart}
        onAdd={setCart}
      />
    </SubScreenPage>
  );
};
