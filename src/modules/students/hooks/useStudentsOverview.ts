import type SchoolInvite from "@/database/models/SchoolInvite";
import type SchoolJoinRequest from "@/database/models/SchoolJoinRequest";
import type SchoolMember from "@/database/models/SchoolMember";
import { SchoolRepository } from "@/modules/school/repositories";
import { SchoolInviteRepository } from "@/modules/school/repositories/schoolInviteRepository";
import { SchoolJoinRequestRepository } from "@/modules/school/repositories/schoolJoinRequestRepository";
import { useEffect, useState } from "react";
import { StudentRepository } from "../repositories";

/**
 * Data of the Students screen (16A / 16B), live from WatermelonDB: the school's
 * students (archived ones are hidden), its pending join requests and active
 * invite codes, and the organization the school belongs to.
 */
export const useStudentsOverview = (schoolId: string) => {
  const [students, setStudents] = useState<SchoolMember[]>([]);
  const [requests, setRequests] = useState<SchoolJoinRequest[]>([]);
  const [invites, setInvites] = useState<SchoolInvite[]>([]);
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const subscriptions = [
      StudentRepository.observeBySchoolId(schoolId).subscribe({
        next: (result: SchoolMember[]) => {
          setStudents(result);
          setIsLoading(false);
        },
        error: (err: Error) => {
          console.error("[useStudentsOverview] Students error:", err);
          setIsLoading(false);
        },
      }),
      SchoolJoinRequestRepository.observeBySchoolId(schoolId).subscribe({
        next: setRequests,
        error: (err: Error) => console.error("[useStudentsOverview] Requests error:", err),
      }),
      SchoolInviteRepository.observeActiveBySchoolId(schoolId).subscribe({
        next: setInvites,
        error: (err: Error) => console.error("[useStudentsOverview] Invites error:", err),
      }),
    ];
    SchoolRepository.findById(schoolId)
      .then((school) => setOrganizationId(school?.organizationId))
      .catch((err) => console.error("[useStudentsOverview] School error:", err));
    return () => subscriptions.forEach((s) => s.unsubscribe());
  }, [schoolId]);

  return { students, requests, invites, organizationId, isLoading };
};
