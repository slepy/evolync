import { sync } from "@/database/sync";
import { useStore } from "@/store";
import { SchoolInviteRepository } from "../repositories/schoolInviteRepository";

/**
 * Creates a new school invite in the local database
 * Enforces one active invite per school rule by invalidating existing ones.
 *
 * @param schoolId - ID of the school to create invite for
 * @param expiresAt - Expiration timestamp
 * @returns Promise<SchoolInvite> - Created invite model
 */
export const createInvite = async (
  schoolId: string,
  expiresAt: number,
): Promise<any> => {
  const { user } = useStore.getState();
  if (!user?.id) {
    throw new Error("User must be logged in to create an invite");
  }
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await SchoolInviteRepository.invalidateActiveInvites(schoolId);
  const invite = await SchoolInviteRepository.create({
    schoolId,
    code,
    expiresAt,
    createdBy: user.id,
  });
  sync().catch((err) => {
    console.error("[inviteService] Sync after create failed:", err);
  });
  return invite;
};
