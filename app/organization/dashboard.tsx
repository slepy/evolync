import { LaunchScreen } from "@/core/components";
import { Dashboard } from "@/modules/organization/components/Dashboard";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
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
  useRequireOrganizationOwner();

  useEffect(() => {
    if (!user?.id) {
      router.replace("/auth/login" as any);
    }
  }, [user?.id, router]);

  if (!organization) {
    return <LaunchScreen />;
  }

  return <Dashboard organization={organization} />;
}
