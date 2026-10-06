import { PaymentPeriodsScreen } from "@/modules/payments";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** Billing periods of one school (14A). Route: /school/[schoolId]/payments */
export default function SchoolPaymentsScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();

  return (
    <PaymentPeriodsScreen
      schoolId={schoolId}
      onPeriodPress={(cycleId) => router.push(`/school/${schoolId}/payments/${cycleId}`)}
      onAdd={() => router.push(`/school/${schoolId}/payments/create`)}
    />
  );
}
