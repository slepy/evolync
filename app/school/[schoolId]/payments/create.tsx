import { PaymentPeriodFormScreen } from "@/modules/payments";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** New billing period (14D / 14D1). Route: /school/[schoolId]/payments/create */
export default function SchoolPaymentPeriodCreateScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();

  return (
    <PaymentPeriodFormScreen
      schoolId={schoolId}
      onCreated={(cycleId) => router.replace(`/school/${schoolId}/payments/${cycleId}`)}
    />
  );
}
