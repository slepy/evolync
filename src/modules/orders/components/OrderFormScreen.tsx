import { ListAvatar, PrimaryButton, SelectField, SubScreenPage, memberInitials } from "@/core/components";
import { useProducts } from "@/modules/inventory/hooks";
import React, { useState } from "react";
import { Text, YStack } from "tamagui";
import { useCreateOrder } from "../hooks/useCreateOrder";
import { useOrganizationIdOfSchool } from "../hooks/useOrganizationIdOfSchool";
import { useSchoolStudents } from "../hooks/useSchoolStudents";
import type { CartItem } from "../types/dto";
import { AddProductSheet, ProductSizesSheet } from "./AddProductSheet";
import { choosesStudent, type OrdersScope } from "./orderAccess";
import { toOrderItemDto } from "./orderCart";
import { OrderProductsSection } from "./OrderProductsSection";
import { StudentSelectSheet } from "./StudentSelectSheet";

interface OrderFormScreenProps {
  scope: Exclude<OrdersScope, "organization">;
  schoolId: string | undefined;
  /** Student scope: the ordering member (no STUDENT field). */
  memberId?: string;
  onCreated: () => void;
}

/**
 * New order (12E / 12E2): the school picks the STUDENT (12E1 sheet) before
 * adding products; the student orders for themselves. Products come from
 * Add new (12F); a tapped product opens its sizes, the trash removes it.
 * Create is pinned at the bottom.
 */
export const OrderFormScreen: React.FC<OrderFormScreenProps> = ({ scope, schoolId, memberId, onCreated }) => {
  const staff = choosesStudent(scope);
  const students = useSchoolStudents(staff ? schoolId : undefined);
  const organizationId = useOrganizationIdOfSchool(schoolId);
  const { products } = useProducts(organizationId ?? "");
  const { createOrder, isLoading, error } = useCreateOrder();

  const [studentId, setStudentId] = useState<string | undefined>(staff ? undefined : memberId);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sheet, setSheet] = useState<"student" | "add" | { productId: string } | null>(null);

  const student = students.find((s) => s.id === studentId);
  const canCreate = !!schoolId && !!studentId && cart.length > 0;
  const sizesProduct = typeof sheet === "object" && sheet ? products.find((p) => p.id === sheet.productId) ?? null : null;

  const handleCreate = async () => {
    if (!schoolId || !studentId) return;
    const order = await createOrder(schoolId, studentId, cart.map(toOrderItemDto));
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
          <PrimaryButton label={t("create")} accent="orders" onPress={handleCreate} loading={isLoading} disabled={!canCreate} />
        </YStack>
      }
    >
      {staff ? (
        <SelectField
          label={t("ordersStudent")}
          value={student?.name}
          valueHint={student?.email}
          placeholder={t("ordersChooseStudent")}
          hint={student ? undefined : t("ordersStudentHint")}
          leading={student ? <ListAvatar size={36} initials={memberInitials(student.name)} uri={student.avatarUrl} /> : undefined}
          accent="orders"
          open={sheet === "student"}
          onPress={() => setSheet("student")}
        />
      ) : null}

      <OrderProductsSection
        cart={cart}
        editable
        canAdd={!!studentId}
        onAddProduct={() => setSheet("add")}
        onProductPress={(productId) => setSheet({ productId })}
        onRemove={(itemId) => setCart(cart.filter((item) => item.id !== itemId))}
        emptyText={studentId ? t("ordersAddProductsHint") : t("ordersPickStudentFirst")}
        hint={t("ordersFormHint")}
      />

      {staff ? (
        <StudentSelectSheet
          open={sheet === "student"}
          onOpenChange={(open) => setSheet(open ? "student" : null)}
          students={students}
          value={studentId}
          onSelect={setStudentId}
        />
      ) : null}
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
