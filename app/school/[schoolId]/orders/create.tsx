import { OrderFormScreen } from "@/modules/orders";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** New order of a school (12E) with the STUDENT field. Route: /school/[schoolId]/orders/create */
export default function SchoolCreateOrderScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  return <OrderFormScreen scope="school" schoolId={schoolId} onCreated={() => router.back()} />;
}
