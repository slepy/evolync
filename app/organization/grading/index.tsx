import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { GradingConfigScreen } from "@/modules/grading/components/GradingConfigScreen";
import { useStore } from "@/store";
import React from "react";

export default function OrganizationGradingRoute() {
  const { organization } = useStore();

  if (!organization) {
    return <LoadingScreen />;
  }

  return <GradingConfigScreen />;
}
