import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { createInvite } from "@/modules/school/services";
import { InviteCreateScreen } from "@/modules/students/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** New invite code (16D); replaces the school's active code. */
export default function GenerateInviteRoute() {
  useRequireOrganizationOwner();
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();

  if (!schoolId) return null;

  return (
    <InviteCreateScreen
      onSubmit={async (expiresAt) => {
        await createInvite(schoolId, expiresAt);
        router.back();
      }}
    />
  );
}
