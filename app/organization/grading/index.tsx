import { LoadingScreen } from "@/core/components";
import { GradingConfigScreen } from "@/modules/grading/components/GradingConfigScreen";
import { useStore } from "@/store";
import React from "react";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

export default function OrganizationGradingRoute() {
  useRequireOrganizationOwner();
  const { organization } = useStore();

  if (!organization) {
    return <LoadingScreen />;
  }

  return <GradingConfigScreen />;
}
