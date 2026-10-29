import { useEffect } from "react";
import { combineLatest } from "rxjs";
import { useStore } from "@/store";
import { safeStorageSet } from "@/modules/auth/services/secureStorage";
import { StudentRepository } from "@/modules/students/repositories";
import { SchoolRepository } from "../repositories";
import { mergeLocalMemberships } from "../ownMemberships";

/**
 * Keeps the signed-in user's school list current between launches: when a
 * sync brings an approved join request (the user's new active member row and
 * its school), the school is added to the store and its cache, so the student
 * dashboard and the context switcher show it without signing in again.
 */
export function useOwnMembershipsWatcher() {
  const userId = useStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId) return;

    const subscription = combineLatest([
      StudentRepository.observeActiveByUserId(userId),
      SchoolRepository.observeAll(),
    ]).subscribe(([members, schools]) => {
      const state = useStore.getState();
      if (state.user?.id !== userId) return;

      const next = mergeLocalMemberships(state.schoolMemberships, members, schools);
      if (!next) return;

      state.setSchoolMemberships(next);
      safeStorageSet("schoolMemberships", JSON.stringify(next)).catch(console.warn);
      if (!state.activeMembershipId) {
        state.setActiveMembershipId(next[0].memberId);
        safeStorageSet("activeMembershipId", next[0].memberId).catch(console.warn);
      }
    });

    return () => subscription.unsubscribe();
  }, [userId]);
}
