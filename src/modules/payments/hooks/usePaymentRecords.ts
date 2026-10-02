import { useCallback, useEffect, useState } from "react";
import PaymentRecord, {
  type PaymentMethod,
  type PaymentStatus,
  PaymentStatus as PaymentStatusEnum,
  DEFAULT_PAYMENT_STATUS,
} from "@/database/models/PaymentRecord";
import SchoolMember from "@/database/models/SchoolMember";
import { useStore } from "@/store";
import { PaymentRecordRepository } from "../repositories";
import { StudentRepository } from "@/modules/students/repositories";
import { bulkSavePaymentList } from "../services";

/**
 * Extended payment record with member info
 */
export interface PaymentWithMember {
  record: PaymentRecord | null;
  member: SchoolMember;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
}

/**
 * Hook for managing payment records for a payment cycle
 *
 * Features:
 * - Shows ONLY members who have payment records in this cycle
 * - Members added after cycle creation will NOT appear
 * - Local state management for status changes
 * - Reactive to local database changes via repositories
 * - Save all payments at once via service
 */
export const usePaymentRecords = (
  cycleId: string | undefined,
  schoolId: string | undefined,
) => {
  // Local payment state (editable)
  const [paymentList, setPaymentList] = useState<PaymentWithMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { performSync } = useStore();

  // Load payment data via repositories
  useEffect(() => {
    if (!cycleId || !schoolId) {
      setPaymentList([]);
      setIsLoading(false);
      return;
    }

    // Only observe payment records - members are loaded based on records
    const recordsSub = PaymentRecordRepository.observeByCycleId(cycleId).subscribe({
      next: async (records: PaymentRecord[]) => {
        try {
          // Get member IDs from payment records
          const memberIds = records.map((r) => r.schoolMemberId);

          if (memberIds.length === 0) {
            setPaymentList([]);
            setIsLoading(false);
            return;
          }

          // Load members for these payment records
          const members = await StudentRepository.findByIds(memberIds);
          const memberById = new Map(members.map((m) => [m.id, m]));

          // Build payment list with member data
          const list: PaymentWithMember[] = records
            .map((record): PaymentWithMember | null => {
              const member = memberById.get(record.schoolMemberId);
              if (!member) return null;

              return {
                record,
                member,
                amount: record.amount,
                currency: record.currency,
                status: record.status,
                method: record.method,
              };
            })
            .filter((item): item is PaymentWithMember => item !== null);

          // Sort by display name
          list.sort((a, b) =>
            (a.member.displayName || "").localeCompare(b.member.displayName || ""),
          );

          setPaymentList(list);
          setIsLoading(false);
        } catch (err) {
          console.error("[usePaymentRecords] Error loading members:", err);
          setError(t("errorLoadingFailed"));
          setIsLoading(false);
        }
      },
      error: (err: Error) => {
        console.error("[usePaymentRecords] Records observer error:", err);
        setError(t("errorLoadingFailed"));
        setIsLoading(false);
      },
    });

    return () => {
      recordsSub.unsubscribe();
    };
  }, [cycleId, schoolId]);

  // Update local payment state (updates local state only)
  const updateLocal = useCallback(
    (
      memberId: string,
      data: {
        status: PaymentStatus;
        amount: number;
        currency: string;
        method: PaymentMethod;
      },
    ) => {
      setPaymentList((prev) =>
        prev.map((item) =>
          item.member.id === memberId
            ? {
                ...item,
                status: data.status,
                amount: data.amount,
                currency: data.currency,
                method: data.method,
              }
            : item,
        ),
      );
    },
    [],
  );

  // Save all payments via service
  const saveAll = useCallback(async () => {
    if (!cycleId || paymentList.length === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await bulkSavePaymentList(
        cycleId,
        paymentList.map((item) => ({
          memberId: item.member.id,
          status: item.status,
          amount: item.amount,
          currency: item.currency,
          method: item.method,
        }))
      );
    } catch (err) {
      console.error("[usePaymentRecords] Save error:", err);
      const message =
        err instanceof Error ? err.message : t("errorSaveFailed");
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [cycleId, paymentList]);

  // Calculate amount breakdown by currency for a given status
  const getAmountByCurrency = (status: PaymentStatus) => {
    const breakdown: Record<string, number> = {};
    paymentList
      .filter((p) => p.status === status)
      .forEach((p) => {
        breakdown[p.currency] = (breakdown[p.currency] || 0) + p.amount;
      });
    return breakdown;
  };

  // Get payment statistics
  const stats = {
    total: paymentList.length,
    paid: paymentList.filter((p) => p.status === PaymentStatusEnum.PAID).length,
    pending: paymentList.filter((p) => p.status === PaymentStatusEnum.PENDING)
      .length,
    cancelled: paymentList.filter(
      (p) => p.status === PaymentStatusEnum.CANCELLED,
    ).length,
    paidByCurrency: getAmountByCurrency(PaymentStatusEnum.PAID),
    pendingByCurrency: getAmountByCurrency(PaymentStatusEnum.PENDING),
    cancelledByCurrency: getAmountByCurrency(PaymentStatusEnum.CANCELLED),
  };

  // Manual refresh - triggers global sync
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await performSync(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorLoadingFailed");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [performSync]);

  return {
    paymentList,
    stats,
    isLoading,
    isSaving,
    error,
    updateLocal,
    saveAll,
    refresh,
  };
};
