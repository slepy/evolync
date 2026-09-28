import { GradingRankEditScreen } from "@/modules/grading/components/GradingRankEditScreen";
import React from "react";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

export default function EditGradingRankRoute() {
  useRequireOrganizationOwner();
  return <GradingRankEditScreen />;
}
