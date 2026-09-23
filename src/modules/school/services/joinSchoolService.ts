import { sync } from "@/database/sync";
import { SchoolInviteRepository, SchoolRepository } from "../repositories";
import { SchoolJoinRequestRepository } from "../repositories/schoolJoinRequestRepository";

// Import supabase using require to avoid Metro bundler issues
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

  // Also check Supabase in case the record isn't synced locally yet
  try {
    const { data } = await supabase
      .from("school_join_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("school_id", invite.schoolId)
      .is("deleted_at", null)
      .maybeSingle();

    if (data) {
      throw new Error("joinRequestPending");
    }
  } catch (err: any) {
    if (err?.message === "joinRequestPending") throw err;
    // Network error: ignore and continue (offline-first)
  }

  // ── 3. Guard: already an active member ──────────────────────────────────────
  try {
    const { data } = await supabase
      .from("school_members")
      .select("id, status")
      .eq("user_id", userId)
      .eq("school_id", invite.schoolId)
      .is("deleted_at", null)
      .maybeSingle();

    if (data?.status === "active") {
      throw new Error("alreadySchoolMember");
    }
  } catch (err: any) {
    if (err?.message === "alreadySchoolMember") throw err;
    // Network error: ignore and continue
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
