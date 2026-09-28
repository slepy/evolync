import { useEffect, useState } from "react";
import type SchoolJoinRequest from "@/database/models/SchoolJoinRequest";
import { SchoolJoinRequestRepository } from "../repositories/schoolJoinRequestRepository";

/**
 * Reactive list of the current user's own pending school join requests
 * (a join request row exists only until it's approved/rejected — see
 * SchoolMember creation on approval, soft-delete on reject).
 */
export const usePendingJoinRequests = (
  userId: string | undefined,
): SchoolJoinRequest[] => {
  const [requests, setRequests] = useState<SchoolJoinRequest[]>([]);

  useEffect(() => {
    if (!userId) {
      setRequests([]);
      return;
    }

    const subscription =
      SchoolJoinRequestRepository.observeByUserId(userId).subscribe(
        setRequests,
      );

    return () => subscription.unsubscribe();
  }, [userId]);

  return requests;
};
