import { MemberAvatar, PrimaryButton, SelectField, SubScreenPage, TextField } from "@/core/components";
import { useProducts } from "@/modules/inventory/hooks";
import React, { useState } from "react";
import { Text, YStack } from "tamagui";
import { useCreateOrder } from "../hooks/useCreateOrder";
import { useOrganizationIdOfSchool } from "../hooks/useOrganizationIdOfSchool";
import { useSchoolStudents } from "../hooks/useSchoolStudents";
import type { CartItem } from "../types/dto";
import { AddProductSheet } from "./AddProductSheet";
import { choosesStudent, studentFieldMode, type OrdersScope } from "./orderAccess";
import { toOrderItemDto } from "./orderCart";
import { OrderProductsSection } from "./OrderProductsSection";
import { StudentSelectSheet } from "./StudentSelectSheet";

interface OrderFormScreenProps {
  scope: Exclude<OrdersScope, "organization">;
  schoolId: string | undefined;
  /** Student scope: the ordering member (no STUDENT field). */
  memberId?: string;
  /** Staff scope: the student is fixed (STUDENT shown locked, 10D Add order). */
  fixedStudent?: { id: string; name: string };
  /** The event the order is for: "For the event {name}" under STUDENT. */
  event?: { id: string; name: string };
  /** Products to start from (editing an event order draft). */
  initialCart?: CartItem[];
  /**
   * Keeps the order instead of storing it (10D: event orders are stored with
   * the participants Save). Without it Create stores the order right away.
   * A draft being edited may be emptied: it is then removed.
   */
  onSubmitDraft?: (studentId: string, cart: CartItem[]) => void;
  onCreated: () => void;
}

/**
 * New order (12E): the school picks the STUDENT (12E1 sheet, 12E2 chosen),
 * the student orders for themselves; products come from Add product (12F).
 * Create is active once there is a student and at least one product.
 */
export const OrderFormScreen: React.FC<OrderFormScreenProps> = ({
  scope,
  schoolId,
  memberId,
  fixedStudent,
  event,
  initialCart,
  onSubmitDraft,
  onCreated,
}) => {
  const mode = studentFieldMode(scope, fixedStudent?.id);
  const staff = choosesStudent(scope);
  const students = useSchoolStudents(mode === "choose" ? schoolId : undefined);
  const organizationId = useOrganizationIdOfSchool(schoolId);
  const { products } = useProducts(organizationId ?? "");
  const { createOrder, isLoading, error } = useCreateOrder();

  const [studentId, setStudentId] = useState<string | undefined>(
    mode === "fixed" ? fixedStudent?.id : staff ? undefined : memberId,
  );
  const [cart, setCart] = useState<CartItem[]>(initialCart ?? []);
  const [sheet, setSheet] = useState<"student" | "product" | null>(null);
  const [focusProductId, setFocusProductId] = useState<string | null>(null);

  const openProducts = (productId: string | null) => {
    setFocusProductId(productId);
    setSheet("product");
  };

  const student = students.find((s) => s.id === studentId);
  const editingDraft = !!onSubmitDraft && !!initialCart?.length;
  const canCreate = !!schoolId && !!studentId && (cart.length > 0 || editingDraft);

  const handleCreate = async () => {
    if (!schoolId || !studentId) return;
    if (onSubmitDraft) {
      onSubmitDraft(studentId, cart);
      onCreated();
      return;
    }
    const order = await createOrder(schoolId, studentId, cart.map(toOrderItemDto), event?.id);
    if (order) onCreated();
  };

  return (
    <SubScreenPage
      title={t("ordersCreateTitle")}
      footer={
        <YStack gap={10}>
          {error ? (
            <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
              {error}
            </Text>
          ) : null}
          <PrimaryButton
            label={editingDraft ? t("save") : t("create")}
            accent="orders"
            onPress={handleCreate}
            loading={isLoading}
            disabled={!canCreate}
          />
        </YStack>
      }
    >
      {mode === "fixed" ? (
        <TextField
          label={t("student")}
          value={fixedStudent?.name ?? ""}
          onChangeText={() => {}}
          locked
          hint={event ? t("ordersForEvent", { name: event.name }) : undefined}
        />
      ) : mode === "choose" ? (
        <SelectField
          label={t("student")}
          value={student?.name}
          placeholder={t("ordersChooseStudent")}
          leading={
            student ? (
              <MemberAvatar size={36} name={student.name} uri={student.avatarUrl} rankId={student.rankId} />
            ) : undefined
          }
          accent="orders"
          open={sheet === "student"}
          onPress={() => setSheet("student")}
        />
      ) : null}

      <OrderProductsSection
        cart={cart}
        onChange={setCart}
        onAddProduct={() => openProducts(null)}
        onEditProduct={openProducts}
        showUnitPrice
        hint={t("ordersProductsHint")}
        emptyText={t("ordersAddProductsHint")}
      />

      {mode === "choose" ? (
        <StudentSelectSheet
          open={sheet === "student"}
          onOpenChange={(open) => setSheet(open ? "student" : null)}
          students={students}
          value={studentId}
          onSelect={setStudentId}
        />
      ) : null}
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
