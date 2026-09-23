import { database } from "@/database";
import { OrderStatus } from "@/modules/orders/types";
import { Q } from "@nozbe/watermelondb";
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
    const subscriptions: Subscription[] = [];

    const setupObservables = async () => {
      try {
        // Observe schools
        const schoolsCollection = database.get("schools");
        const schoolsQuery = schoolsCollection.query(
          Q.where("organization_id", organizationId),
          Q.where("deleted_at", null),
        );

        const schoolsSubscription = schoolsQuery
          .observe()
          .subscribe(async (schools) => {
            const schoolIds = schools.map((s) => s.id);

            // Query pending orders
            const ordersCollection = database.get("orders");
            const pendingOrders = await ordersCollection
              .query(
                Q.where("school_id", Q.oneOf(schoolIds)),
                Q.where("status", OrderStatus.PLACED),
                Q.where("deleted_at", null),
              )
              .fetch();

            const pendingOrdersAllSchools = pendingOrders.length;

            setDashboardData({
              pendingOrdersAllSchools,
            });

            setIsLoading(false);
          });

        subscriptions.push(schoolsSubscription);
      } catch (error) {
        console.error("Error setting up dashboard observables:", error);
        setIsLoading(false);
      }
    };

    setupObservables();

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [organizationId]);

  return { dashboardData, isLoading };
};
