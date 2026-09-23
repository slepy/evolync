import { database } from "@/database";
import { OrderStatus } from "@/modules/orders/types";
import { Q } from "@nozbe/watermelondb";
import { useEffect, useState } from "react";
import type { Subscription } from "rxjs";

interface SchoolDashboardData {
  pendingOrders: number;
  pendingJoinRequests: number;
}

/**
 * Custom hook for observing school dashboard data from WatermelonDB
 * Provides real-time updates when data changes
 */
export const useSchoolDashboard = (schoolId: string) => {
  const [dashboardData, setDashboardData] = useState<SchoolDashboardData>({
    pendingOrders: 0,
    pendingJoinRequests: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const subscriptions: Subscription[] = [];

    const setupObservables = async () => {
      try {
        // Observe pending orders for this school
        const ordersCollection = database.get("orders");
        const ordersQuery = ordersCollection.query(
          Q.where("school_id", schoolId),
          Q.where("status", OrderStatus.PLACED),
          Q.where("deleted_at", null),
        );

        // Observe pending join requests for this school
        const joinRequestsCollection = database.get("school_join_requests");
        const joinRequestsQuery = joinRequestsCollection.query(
          Q.where("school_id", schoolId),
          Q.where("deleted_at", null),
        );

        const ordersSubscription = ordersQuery.observe().subscribe((orders) => {
          setDashboardData((prev) => ({
            ...prev,
            pendingOrders: orders.length,
          }));
          setIsLoading(false);
        });

        const joinRequestsSubscription = joinRequestsQuery
          .observe()
          .subscribe((requests) => {
            setDashboardData((prev) => ({
              ...prev,
              pendingJoinRequests: requests.length,
            }));
          });

        subscriptions.push(ordersSubscription, joinRequestsSubscription);
      } catch (error) {
        console.error("Error setting up school dashboard observables:", error);
        setIsLoading(false);
      }
    };

    setupObservables();

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [schoolId]);

  return { dashboardData, isLoading };
};
