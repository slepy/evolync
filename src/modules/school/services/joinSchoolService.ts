import { sync } from "@/database/sync";
import { StudentRepository } from "@/modules/students/repositories";
import { SchoolInviteRepository, SchoolRepository } from "../repositories";
import { SchoolJoinRequestRepository } from "../repositories/schoolJoinRequestRepository";

// Import supabase using require to avoid Metro bundler issues.
// This one remaining direct call is a deliberate, narrow exception: an invite
// code is a public, short-lived lookup key with no privacy stakes, and the
// joining student's device has no local copy of a school they don't belong to
// yet (sync is scoped to the user's own memberships) — a WatermelonDB-only
// lookup would break joining by code across devices entirely.
const { supabase } = require("@/config/supabase");

/**
 * Join school using invite code
 *
 * New logic (join-request flow):
 * 1. If code doesn't exist or expired → throw error
 * 2. If user already has a pending request for this school → throw joinRequestPending
 * 3. If user is already an active member → throw alreadySchoolMember
 * 4. Create a row in school_join_requests (owner must approve before SchoolMember is created)
 *
 * Strategy for finding invite:
 * - First check local WatermelonDB (fast, works offline)
 * - If not found locally, query Supabase directly (invite created on another device)
 */
export const joinSchool = async (
  code: string,
  userId: string,
  userEmail: string,
  displayName: string,
  avatarUrl?: string,
): Promise<void> => {
  // ── 1. Resolve invite ────────────────────────────────────────────────────────
  let invite = await SchoolInviteRepository.findByCode(code);

  if (!invite) {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("school_invites")
        .select("*")
        .eq("code", code)
        .gt("expires_at", now)
        .is("deleted_at", null)
        .single();

      if (error) {
        throw new Error("invalidSchoolCode");
      }

      if (data) {
        invite = {
          id: data.id,
          schoolId: data.school_id,
          roleId: data.role_id,
          code: data.code,
          expiresAt: data.expires_at,
          createdAt: data.created_at,
          deletedAt: data.deleted_at,
        } as any;
      }
    } catch (error) {
      console.error("[joinSchool] Error querying Supabase:", error);
      throw new Error("invalidSchoolCode");
    }
  }

  if (!invite) {
    throw new Error("invalidSchoolCode");
  }

  // ── 2. Guard: duplicate pending request ─────────────────────────────────────
  const existingRequest =
    await SchoolJoinRequestRepository.findByUserIdAndSchoolId(
      userId,
      invite.schoolId,
    );

  if (existingRequest) {
    throw new Error("joinRequestPending");
  }

  // ── 3. Guard: already an active member ──────────────────────────────────────
  // Both guards now check local WatermelonDB only (per CLAUDE.md's direct-Supabase
  // allow-list). If this device has never synced a record for this user/school
  // yet, the check fails open (no local record found) — Supabase's own unique
  // constraints on school_join_requests/school_members are the backstop, exactly
  // as already documented for the offline/never-synced case.
  const existingMember = await StudentRepository.findByUserIdAndSchoolId(
    userId,
    invite.schoolId,
  );

  if (existingMember?.status === "active") {
    throw new Error("alreadySchoolMember");
  }

  // ── 4. Create join request locally ──────────────────────────────────────────
  await SchoolJoinRequestRepository.create({
    schoolId: invite.schoolId,
    userId,
    displayName,
    email: userEmail,
    avatarUrl,
  });

  // ── 5. Sync & update store ───────────────────────────────────────────────────
  sync()
    .then(async () => {
      try {
        // After approval the member record will exist; for now just ensure
        // the school is known locally so the dashboard can display it.
        await SchoolRepository.findByIdOrFetchFromSupabase(invite.schoolId);
      } catch (error) {
        console.error("[joinSchool] Failed to prefetch school:", error);
      }
    })
    .catch((error) => {
      console.error("[joinSchool] Sync error:", error);
    });
};
