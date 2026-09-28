import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useStore } from "@/store";

/**
 * Defense-in-depth guard for owner-only screens (org dashboard, school
 * management). Not a replacement for server-side RLS — just prevents a
 * confusing client-side UI state if a non-owner navigates here directly.
 */
export const useRequireOrganizationOwner = (): void => {
  const organization = useStore((s) => s.organization);
  const router = useRouter();

  useEffect(() => {
    if (organization === null) {
      router.replace("/");
    }
  }, [organization, router]);
};
