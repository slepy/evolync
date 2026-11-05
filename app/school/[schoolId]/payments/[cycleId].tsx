import { PaymentPeriodScreen } from "@/modules/payments";
import { useLocalSearchParams } from "expo-router";
import React from "react";

/** One billing period: mark who paid, edit amount (14B / 14C). Route: /school/[schoolId]/payments/[cycleId] */
export default function SchoolPaymentPeriodScreen() {
  const { schoolId, cycleId } = useLocalSearchParams<{ schoolId: string; cycleId: string }>();

  return <PaymentPeriodScreen schoolId={schoolId} cycleId={cycleId} />;
}
