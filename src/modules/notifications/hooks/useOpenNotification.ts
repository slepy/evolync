import { NAV_HOME_HREF, useNavHome } from "@/core/components";
import { useStore } from "@/store";
import { StackActions } from "@react-navigation/native";
import { useNavigationContainerRef, useRouter } from "expo-router";
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
  const navigationRef = useNavigationContainerRef();
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
        // Pop the root stack (router.dismissAll only pops the focused, possibly
        // nested, stack), then swap its first screen for the recipient's dashboard.
        const root = navigationRef.getRootState();
        if (root?.type === "stack" && root.routes.length > 1) {
          navigationRef.dispatch({ ...StackActions.popToTop(), target: root.key });
        }
        router.replace(NAV_HOME_HREF[plan.home] as any);
      }
      router.push(route as any);
      return true;
    },
    [router, navigationRef, home, ownsOrganization, memberships, activeMembershipId, setActiveMembershipId],
  );
}
