import { SchoolRepository } from "@/modules/school/repositories";
import { OrderRepository } from "@/modules/orders/repositories";
import { OrderStatus } from "@/modules/orders/types";
import { useEffect, useState } from "react";
import type { Subscription } from "rxjs";

interface DashboardData {
  pendingOrdersAllSchools: number;
}

/**
 * Custom hook for observing organization dashboard data from WatermelonDB
 * Provides real-time updates when data changes
 */
export const useOrganizationDashboard = (organizationId: string) => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pendingOrdersAllSchools: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let pendingOrdersSubscription: Subscription | undefined;

    const schoolsSubscription = SchoolRepository.observeByOrganizationId(
      organizationId,
    ).subscribe((schools) => {
      pendingOrdersSubscription?.unsubscribe();

      const schoolIds = schools.map((s) => s.id);

      if (schoolIds.length === 0) {
        setDashboardData({ pendingOrdersAllSchools: 0 });
        setIsLoading(false);
        return;
      }

      pendingOrdersSubscription = OrderRepository.observeCountBySchoolIds(
        schoolIds,
        OrderStatus.PLACED,
      ).subscribe((pendingOrdersAllSchools) => {
        setDashboardData({ pendingOrdersAllSchools });
        setIsLoading(false);
      });
    });

    return () => {
      schoolsSubscription.unsubscribe();
      pendingOrdersSubscription?.unsubscribe();
    };
  }, [organizationId]);

  return { dashboardData, isLoading };
};
