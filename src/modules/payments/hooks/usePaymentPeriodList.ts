import PaymentCycle from "@/database/models/PaymentCycle";
import PaymentRecord from "@/database/models/PaymentRecord";
import { useEffect, useMemo, useState } from "react";
import { countPeriods, storedDayKey, type DayKey } from "../paymentPeriod";
import { PaymentCycleRepository, PaymentRecordRepository } from "../repositories";

export interface PaymentPeriodEntry {
  cycle: PaymentCycle;
  start: DayKey;
  end: DayKey;
  paid: number;
  total: number;
}

/**
 * Billing periods of a school, newest first, with paid / total counts (14A).
 * Periods and records are observed side by side; the list waits for both so
 * a chip never flashes "0/0".
 */
export const usePaymentPeriodList = (schoolId: string | undefined) => {
  const [cycles, setCycles] = useState<PaymentCycle[] | null>(null);
  const [records, setRecords] = useState<PaymentRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) {
      setCycles([]);
      setRecords([]);
      return;
    }
    const onError = (err: Error) => {
      console.error("[usePaymentPeriodList] Observer error:", err);
      setError(t("errorLoadingFailed"));
      setCycles((c) => c ?? []);
      setRecords((r) => r ?? []);
    };
    const cyclesSub = PaymentCycleRepository.observeBySchoolId(schoolId).subscribe({ next: setCycles, error: onError });
    const recordsSub = PaymentRecordRepository.observeBySchoolId(schoolId).subscribe({ next: setRecords, error: onError });
    return () => {
      cyclesSub.unsubscribe();
      recordsSub.unsubscribe();
    };
  }, [schoolId]);

  const periods = useMemo<PaymentPeriodEntry[]>(() => {
    const counts = countPeriods(records ?? []);
    return (cycles ?? []).map((cycle) => ({
      cycle,
      start: storedDayKey(cycle.periodStart),
      end: storedDayKey(cycle.periodEnd),
      paid: counts[cycle.id]?.paid ?? 0,
      total: counts[cycle.id]?.total ?? 0,
    }));
  }, [cycles, records]);

  return { periods, isLoading: cycles === null || records === null, error };
};
