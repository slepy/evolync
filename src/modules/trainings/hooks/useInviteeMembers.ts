import { StudentRepository } from "@/modules/students/repositories";
import { MemberStatus } from "@/modules/students/types";
import { from, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { TrainingInviteeRepository } from "../repositories";
import { useObservableValue } from "./useObservableList";

export interface InviteeMember {
  id: string; // school_member id
  name: string;
  avatarUrl?: string;
  schoolId?: string;
  /** Archived or removed members stay listed, greyed out. */
  inactive: boolean;
}

const EMPTY: InviteeMember[] = [];

/**
 * Invitees of a training with their member names. With `schoolId`, only
 * that school's invitees are returned (school dashboard view).
 */
export const useInviteeMembers = (trainingId: string | undefined, schoolId?: string) => {
  const { value, isLoading } = useObservableValue(
    () =>
      trainingId
        ? TrainingInviteeRepository.observeByTrainingId(trainingId).pipe(
            switchMap((invitees) => {
              const ids = invitees.map((i) => i.schoolMemberId);
              if (ids.length === 0) return of(EMPTY);
              return from(StudentRepository.findByIds(ids)).pipe(
                map((members) => {
                  const byId = new Map(members.map((m) => [m.id, m]));
                  return ids
                    .map((id): InviteeMember => {
                      const member = byId.get(id);
                      return {
                        id,
                        name: member?.displayName || member?.email || t("unknown"),
                        avatarUrl: member?.avatarUrl,
                        schoolId: member?.schoolId,
                        inactive: !member || member.status === MemberStatus.ARCHIVED,
                      };
                    })
                    .filter((m) => !schoolId || m.schoolId === schoolId)
                    .sort((a, b) => a.name.localeCompare(b.name));
                }),
              );
            }),
          )
        : null,
    EMPTY,
    [trainingId, schoolId],
    "useInviteeMembers",
  );
  return { invitees: value, isLoading };
};
