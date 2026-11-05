import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type PaymentStatus,
  type PaymentMethod,
} from "@/database/models/PaymentRecord";
import type PaymentRecord from "@/database/models/PaymentRecord";
import {
  PaymentCycleRepository,
  PaymentRecordRepository,
} from "../repositories";
import { bulkUpdatePaymentRecords } from "../services";
import { currentPeriodsFirst, localDayKey, storedDayKey } from "../paymentPeriod";

/**
 * Plain object representation of payment cycle for display
 */
export interface StudentPaymentCycle {
  id: string;
  periodStart: Date;
  periodEnd: Date;
}

/** A payment of a locked period can't be changed (status button disabled, lock glyph). */
export interface StudentPaymentRow extends StudentPaymentItem {
  locked: boolean;
}

/**
 * Original payment data for change tracking
 */
interface OriginalPaymentData {
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
}

/**
 * Payment item with editable fields (local state)
 */
export interface StudentPaymentItem {
  recordId: string;
  cycle: StudentPaymentCycle;
  // Editable fields (local state)
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
}

/**
 * Hook for observing and editing payment records for a specific student
 *
 * Uses local state pattern like usePaymentRecords:
 * - updateLocal() for immediate UI updates
 * - saveAll() to commit all changes to database via service
 * - discardChanges() to revert to saved state
 *
 * Reactive: the underlying records are observed via WatermelonDB, so a change
 * made elsewhere (e.g. another screen editing the same student's payments)
 * is reflected here live. Any locally pending (unsaved) edit for a record is
 * preserved across a live update — only records with no pending edit re-seed
 * from the fresh data.
 */
export const useStudentPayments = (studentId: string | undefined) => {
  const [payments, setPayments] = useState<StudentPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lockedCycleIds, setLockedCycleIds] = useState<ReadonlySet<string>>(new Set());

  // Track original (last-known-committed) data for change detection
  const originalDataRef = useRef<Map<string, OriginalPaymentData>>(new Map());
  // Track the current in-render payments so the observe callback can preserve
  // unsaved local edits when new data streams in.
  const paymentsRef = useRef<StudentPaymentItem[]>([]);
  paymentsRef.current = payments;

  useEffect(() => {
    if (!studentId) {
      setPayments([]);
      originalDataRef.current.clear();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const subscription = PaymentRecordRepository.observeByMemberId(
      studentId,
    ).subscribe(async (records: PaymentRecord[]) => {
      try {
        const cycleIds = [...new Set(records.map((r) => r.paymentCycleId))];
        const cycles = await PaymentCycleRepository.findByIds(cycleIds);
        const cycleMap = new Map(cycles.map((c) => [c.id, c]));

        const previousById = new Map(
          paymentsRef.current.map((item) => [item.recordId, item]),
        );

        const items: StudentPaymentItem[] = records
          .map((record) => {
            const cycle = cycleMap.get(record.paymentCycleId);
            if (!cycle) return null;

            const original = originalDataRef.current.get(record.id);
            const previous = previousById.get(record.id);
            const hasPendingEdit =
              previous !== undefined &&
              original !== undefined &&
              (previous.status !== original.status ||
                previous.amount !== original.amount ||
                previous.currency !== original.currency ||
                previous.method !== original.method);

            return {
              recordId: record.id,
              cycle: {
                id: cycle.id,
                periodStart: cycle.periodStart,
                periodEnd: cycle.periodEnd,
              },
              // Preserve an unsaved local edit; otherwise seed from the fresh record
              status: hasPendingEdit ? previous!.status : record.status,
              amount: hasPendingEdit ? previous!.amount : record.amount,
              currency: hasPendingEdit ? previous!.currency : record.currency,
              method: hasPendingEdit ? previous!.method : record.method,
            };
          })
          .filter((item): item is StudentPaymentItem => item !== null);

        items.sort(
          (a, b) => b.cycle.periodEnd.getTime() - a.cycle.periodEnd.getTime(),
        );
        const sorted = currentPeriodsFirst(
          items,
          (item) => ({
            start: storedDayKey(item.cycle.periodStart),
            end: storedDayKey(item.cycle.periodEnd),
          }),
          localDayKey(new Date()),
        );

        // Original data always reflects the latest committed (DB) state
        originalDataRef.current.clear();
        records.forEach((record) => {
          originalDataRef.current.set(record.id, {
            status: record.status,
            amount: record.amount,
            currency: record.currency,
            method: record.method,
          });
        });

        setPayments(sorted);
      } catch (err) {
        console.error("[useStudentPayments] Error loading:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [studentId]);

  // Locks are watched apart from the records: locking a period changes no record.
  const cycleIdsKey = [...new Set(payments.map((item) => item.cycle.id))].sort().join(",");
  useEffect(() => {
    const ids = cycleIdsKey ? cycleIdsKey.split(",") : [];
    if (ids.length === 0) {
      setLockedCycleIds(new Set());
      return;
    }
    const subscription = PaymentCycleRepository.observeByIds(ids).subscribe({
      next: (cycles) => setLockedCycleIds(new Set(cycles.filter((c) => c.lockedAt).map((c) => c.id))),
      error: (err: Error) => console.error("[useStudentPayments] Cycles observer error:", err),
    });
    return () => subscription.unsubscribe();
  }, [cycleIdsKey]);

  const rows = useMemo<StudentPaymentRow[]>(
    () => payments.map((item) => ({ ...item, locked: lockedCycleIds.has(item.cycle.id) })),
    [payments, lockedCycleIds],
  );

  // Update local payment state (UI only, no database write)
  const updateLocal = useCallback(
    (
      recordId: string,
      data: {
        status: PaymentStatus;
        amount: number;
        currency: string;
        method: PaymentMethod;
      }
    ) => {
      setPayments((prev) =>
        prev.map((item) =>
          item.recordId === recordId
            ? {
                ...item,
                status: data.status,
                amount: data.amount,
                currency: data.currency,
                method: data.method,
              }
            : item
        )
      );
    },
    []
  );

  // Check if a single payment has changes
  const hasPaymentChanged = useCallback(
    (item: StudentPaymentItem): boolean => {
      const original = originalDataRef.current.get(item.recordId);
      if (!original) return false;
      return (
        item.status !== original.status ||
        item.amount !== original.amount ||
        item.currency !== original.currency ||
        item.method !== original.method
      );
    },
    []
  );

  // Check if there are any unsaved changes
  const hasChanges = payments.some(hasPaymentChanged);

  // Save all changed payments via service
  const saveAll = useCallback(async () => {
    const changedPayments = payments.filter(hasPaymentChanged);
    if (changedPayments.length === 0) return;

    setIsSaving(true);
    try {
      await bulkUpdatePaymentRecords(
        changedPayments.map((item) => ({
          recordId: item.recordId,
          status: item.status,
          amount: item.amount,
          currency: item.currency,
          method: item.method,
        }))
      );

      // Update original data after successful save
      changedPayments.forEach((item) => {
        originalDataRef.current.set(item.recordId, {
          status: item.status,
          amount: item.amount,
          currency: item.currency,
          method: item.method,
        });
      });
    } catch (err) {
      console.error("[useStudentPayments] Save error:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [payments, hasPaymentChanged]);

  // Discard all pending changes
  const discardChanges = useCallback(() => {
    setPayments((prev) =>
      prev.map((item) => {
        const original = originalDataRef.current.get(item.recordId);
        if (!original) return item;
        return {
          ...item,
          status: original.status,
          amount: original.amount,
          currency: original.currency,
          method: original.method,
        };
      })
    );
  }, []);

  // Calculate statistics from local state
  const paidPayments = payments.filter((p) => p.status === "paid");
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const cancelledPayments = payments.filter((p) => p.status === "cancelled");

  const calculateByCurrency = (items: StudentPaymentItem[]) => {
    return items.reduce(
      (acc, item) => {
        acc[item.currency] = (acc[item.currency] || 0) + item.amount;
        return acc;
      },
      {} as Record<string, number>
    );
  };

  const stats = {
    total: payments.length,
    paid: paidPayments.length,
    pending: pendingPayments.length,
    cancelled: cancelledPayments.length,
    paidByCurrency: calculateByCurrency(paidPayments),
    pendingByCurrency: calculateByCurrency(pendingPayments),
    cancelledByCurrency: calculateByCurrency(cancelledPayments),
  };

  return {
    payments: rows,
    stats,
    isLoading,
    isSaving,
    hasChanges,
    updateLocal,
    saveAll,
    discardChanges,
  };
};
