import { OrderStatus } from "@/modules/orders/types";
import { OrderRepository } from "@/modules/orders/repositories";
import { PaymentCycleRepository } from "@/modules/payments/repositories/paymentCycleRepository";
import { PaymentRecordRepository } from "@/modules/payments/repositories/paymentRecordRepository";
import { PaymentStatus } from "@/database/models/PaymentRecord";
import { SchoolJoinRequestRepository } from "@/modules/school/repositories/schoolJoinRequestRepository";
import { useEffect, useState } from "react";
import type { Subscription } from "rxjs";
import type { SchoolDashboardCounts } from "./schoolTileSubtitles";

type SchoolDashboardData = SchoolDashboardCounts;

/**
 * Custom hook for observing school dashboard data from WatermelonDB
 * Provides real-time updates when data changes
 */
export const useSchoolDashboard = (schoolId: string) => {
  const [dashboardData, setDashboardData] = useState<SchoolDashboardData>({
    pendingOrders: 0,
    pendingJoinRequests: 0,
    overduePayments: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const subscriptions: Subscription[] = [];
    let overdueRecordsSubscription: Subscription | undefined;

    // Same count as the organization dashboard's Orders tile, for this school only.
    const ordersSubscription = OrderRepository.observeCountBySchoolIds(
      [schoolId],
      OrderStatus.PLACED,
    ).subscribe((pendingOrders) => {
      setDashboardData((prev) => ({ ...prev, pendingOrders }));
      setIsLoading(false);
    });

    const joinRequestsSubscription = SchoolJoinRequestRepository.observeBySchoolId(
      schoolId,
    ).subscribe((requests) => {
      setDashboardData((prev) => ({
        ...prev,
        pendingJoinRequests: requests.length,
      }));
    });

    const cyclesSubscription = PaymentCycleRepository.observeBySchoolId(
      schoolId,
    ).subscribe((cycles) => {
      overdueRecordsSubscription?.unsubscribe();

      const now = Date.now();
      const overdueCycleIds = cycles
        .filter((cycle) => cycle.periodEnd.getTime() < now)
        .map((cycle) => cycle.id);

      if (overdueCycleIds.length === 0) {
        setDashboardData((prev) => ({ ...prev, overduePayments: 0 }));
        return;
      }

      overdueRecordsSubscription = PaymentRecordRepository.observeByCycleIds(
        overdueCycleIds,
      ).subscribe((records) => {
        const overduePayments = records.filter(
          (record) => record.status === PaymentStatus.PENDING,
        ).length;
        setDashboardData((prev) => ({ ...prev, overduePayments }));
      });
    });

    subscriptions.push(ordersSubscription, joinRequestsSubscription, cyclesSubscription);

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
      overdueRecordsSubscription?.unsubscribe();
    };
  }, [schoolId]);

  return { dashboardData, isLoading };
};
