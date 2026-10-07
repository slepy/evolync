import { NAV_HOME_HREF, useNavHome } from "@/core/components";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import type { NotificationTarget } from "../types";
import { planNotificationContext } from "../utils";

/**
 * Opens a notification's route in the context of its recipient role: a
 * student notification over the student dashboard of its school, an owner
 * notification over the organization dashboard. When the app shows another
 * context the stack is reset to that dashboard first, so Back never lands in
 * the other role's screens. Returns false when the user no longer has that
 * role (nothing is opened).
 */
export function useOpenNotification() {
  const router = useRouter();
  const home = useNavHome();
  const ownsOrganization = useStore((s) => !!s.organization);
  const memberships = useStore((s) => s.schoolMemberships);
  const activeMembershipId = useStore((s) => s.activeMembershipId);
  const setActiveMembershipId = useStore((s) => s.setActiveMembershipId);

  return useCallback(
    (notification: Pick<NotificationTarget, "type" | "schoolId">, route: string): boolean => {
      const plan = planNotificationContext(notification, {
        ownsOrganization,
        memberships,
        activeMembershipId,
        home,
      });
      if (!plan) return false;

      if (plan.membershipId && plan.membershipId !== activeMembershipId) {
        setActiveMembershipId(plan.membershipId);
        const AsyncStorage = require("@react-native-async-storage/async-storage").default;
        AsyncStorage.setItem("activeMembershipId", plan.membershipId).catch(console.error);
      }

      if (plan.switchContext) {
        if (router.canDismiss()) router.dismissAll();
        router.replace(NAV_HOME_HREF[plan.home] as any);
      }
      router.push(route as any);
      return true;
    },
    [router, home, ownsOrganization, memberships, activeMembershipId, setActiveMembershipId],
  );
}
