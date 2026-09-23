import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { Dashboard } from "@/modules/organization/components/Dashboard";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React from "react";
import { useEffect } from "react";

/**
 * Organization-level dashboard screen.
 * Displays overview, aggregated stats, and quick actions across all schools.
 */
export default function OrganizationDashboardScreen() {
  const router = useRouter();
  const { organization, user } = useStore();

  useEffect(() => {
    if (!user?.id) {
      router.replace("/auth/login" as any);
    }
  }, [user?.id, router]);

  if (!organization) {
    return <LoadingScreen />;
  }

  return <Dashboard organization={organization} />;
}
