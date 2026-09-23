import { useCallback, useEffect, useRef, useState } from "react";
import {
  type PaymentStatus,
  type PaymentMethod,
} from "@/database/models/PaymentRecord";
import {
  PaymentCycleRepository,
  PaymentRecordRepository,
} from "../repositories";
import { bulkUpdatePaymentRecords } from "../services";

/**
 * Plain object representation of payment cycle for display
 */
export interface StudentPaymentCycle {
  id: string;
  periodStart: Date;
  periodEnd: Date;
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
 * Hook for fetching and editing payment records for a specific student
 *
 * Uses local state pattern like usePaymentRecords:
 * - updateLocal() for immediate UI updates
 * - saveAll() to commit all changes to database via service
 * - discardChanges() to revert to saved state
 */
export const useStudentPayments = (studentId: string | undefined) => {
  const [payments, setPayments] = useState<StudentPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Track if we've done initial load to prevent re-loading on every render
  const hasLoaded = useRef(false);

  // Track original data for change detection
  const originalDataRef = useRef<Map<string, OriginalPaymentData>>(new Map());

  // Load payment data via repositories (one-time load, not continuous observation)
  useEffect(() => {
    if (!studentId) {
      setPayments([]);
      setIsLoading(false);
      return;
    }

    // Only load once per studentId
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadData = async () => {
      try {
        const records = await PaymentRecordRepository.findByMemberId(studentId);

        const cycleIds = [...new Set(records.map((r) => r.paymentCycleId))];
        const cycles = await PaymentCycleRepository.findByIds(cycleIds);
        const cycleMap = new Map(cycles.map((c) => [c.id, c]));

        const items: StudentPaymentItem[] = records
          .map((record) => {
            const cycle = cycleMap.get(record.paymentCycleId);
            if (!cycle) return null;
            return {
              recordId: record.id,
              cycle: {
                id: cycle.id,
                periodStart: cycle.periodStart,
                periodEnd: cycle.periodEnd,
              },
              // Editable fields
              status: record.status,
              amount: record.amount,
              currency: record.currency,
              method: record.method,
            };
          })
          .filter((item): item is StudentPaymentItem => item !== null);

        // Sort by period end date (most recent first)
        items.sort(
          (a, b) => b.cycle.periodEnd.getTime() - a.cycle.periodEnd.getTime()
        );

        // Store original data for change tracking
        originalDataRef.current.clear();
        items.forEach((item) => {
          originalDataRef.current.set(item.recordId, {
            status: item.status,
            amount: item.amount,
            currency: item.currency,
            method: item.method,
          });
        });

        setPayments(items);
      } catch (err) {
        console.error("[useStudentPayments] Error loading:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [studentId]);

  // Reset hasLoaded when studentId changes
  useEffect(() => {
    hasLoaded.current = false;
  }, [studentId]);

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
    payments,
    stats,
    isLoading,
    isSaving,
    hasChanges,
    updateLocal,
    saveAll,
    discardChanges,
  };
};
