import { database } from "@/database";
import { sync } from "@/database/sync";
import School from "@/database/models/School";
import SchoolMember from "@/database/models/SchoolMember";
import { MemberStatus, type CreateStudentDto } from "../types";
import { StudentRepository } from "../repositories";
import { SchoolJoinRequestRepository } from "@/modules/school/repositories/schoolJoinRequestRepository";
import { SchoolSettingsRepository } from "@/modules/school/repositories";
import { PaymentRecordRepository } from "@/modules/payments/repositories/paymentRecordRepository";
import { memberPaymentAmount } from "@/modules/payments/paymentPeriod";
import { EventParticipantRepository } from "@/modules/events/repositories/eventParticipantRepository";

import { Q } from "@nozbe/watermelondb";
import OrganizationRole from "@/database/models/OrganizationRole";

/**
 * Service for managing students (school members) in offline-first architecture
 *
 * Key principles:
 * 1. All operations write to local WatermelonDB first
 * 2. Background sync propagates changes to Supabase
 * 3. UI is reactive to local database changes
 */

// ============================================================================
// Helper: Get Student Role ID
// ============================================================================

/**
 * Fetches the "Student" role ID for the given organization from Supabase
 * Returns undefined if fetch fails (offline mode - role will be set on sync)
 */
const getStudentRoleId = async (
  organizationId: string,
): Promise<string | undefined> => {
  try {
    const roles = await database
      .get<OrganizationRole>("organization_roles")
      .query(
        Q.where("organization_id", organizationId),
        Q.where("name", "Student"),
        Q.where("deleted_at", null),
      )
      .fetch();

    return roles[0]?.id;
  } catch (err) {
    console.warn("[getStudentRoleId] Failed to fetch role from local DB:", err);
    return undefined;
  }
};

// ============================================================================
// Create Student (Shadow User) - Offline-First
// ============================================================================

/**
 * Creates a new student (Shadow User) in the local database
 *
 * Flow (US-003a):
 * 1. Generates UUID v4 for the student
 * 2. Fetches "Student" role ID from organization_roles (if online)
 * 3. Writes to WatermelonDB with status 'active' (no approval needed for shadow users)
 * 4. Returns created school member model
 * 5. Background sync will push to Supabase (handled by WatermelonDB Sync Adapter)
 *
 * @param schoolId - School ID to add student to
 * @param data - Student creation data (displayName required, email optional)
 * @returns Promise<SchoolMember> - Created school member model from WatermelonDB
 * @throws Error if database write fails
 */
export const createStudent = async (
  schoolId: string,
  data: CreateStudentDto,
): Promise<SchoolMember> => {
  console.log(
    "[createStudent] schoolId received:",
    schoolId,
    "type:",
    typeof schoolId,
  );

  // Validate schoolId
  if (!schoolId || schoolId === "undefined") {
    throw new Error("Invalid schoolId: " + schoolId);
  }

  // 1. Get the school to find organizationId
  const schoolsCollection = database.get<School>("schools");
  const school = await schoolsCollection.find(schoolId);
  const organizationId = school.organizationId;

  // 2. Fetch "Student" role ID (best-effort - may be undefined if offline)
  const studentRoleId = await getStudentRoleId(organizationId);

  // 3. Use StudentRepository to create member (includes UUID generation and date fields)
  const member = await StudentRepository.create({
    schoolId: schoolId,
    displayName: data.displayName,
    email: data.email || undefined,
    phoneNumber: data.phoneNumber || undefined,
    userId: undefined, // Shadow users don't have a user_id (null means offline user)
    roleId: studentRoleId, // Student role (may be undefined if offline - will be set on sync)
    status: MemberStatus.OFFLINE, // Shadow users are immediately active (no approval needed)
  });

  // 5. Trigger sync to push changes to Supabase
  sync().catch((err) => {
    console.error("[createStudent] Sync failed:", err);
  });

  // 6. Return created member
  return member;
};

// ============================================================================
// Update Student - Offline-First
// ============================================================================

/**
 * Updates editable student fields (displayName, email, phoneNumber)
 * Writes to local WatermelonDB, then triggers background sync.
 */
export const updateStudent = async (
  studentId: string,
  data: { displayName?: string; email?: string; phoneNumber?: string },
): Promise<void> => {
  await StudentRepository.update(studentId, data as Partial<SchoolMember>);
  sync().catch((err) => {
    console.error("[updateStudent] Sync failed:", err);
  });
};

// ============================================================================
// Archive Student - Offline-First
// ============================================================================

/**
 * Archives a student by setting their status to 'archived'.
 * Does NOT soft-delete the record so history is preserved.
 * Triggers background sync.
 */
export const archiveStudent = async (studentId: string): Promise<void> => {
  await StudentRepository.update(studentId, {
    status: MemberStatus.ARCHIVED,
  } as Partial<SchoolMember>);
  sync().catch((err) => {
    console.error("[archiveStudent] Sync failed:", err);
  });
};

// ============================================================================
// Approve Join Request
// ============================================================================

/**
 * Approves a school join request.
 *
 * Flow:
 * 1. Find the join request record
 * 2. If mode=existing and existingMemberId provided → activate that specific member
 *    If mode=new or no match → look for shadow member with matching email, else create new
 * 3. Soft-delete the join request
 * 4. Trigger sync
 */
export const approveJoinRequest = async (
  requestId: string,
  schoolId: string,
  options?: {
    mode?: "new" | "existing";
    existingMemberId?: string;
    cycleIds?: string[];
    eventIds?: string[];
  },
): Promise<void> => {
  const collection = database.get<any>("school_join_requests");
  const request = await collection.find(requestId);

  if (!request || request.deletedAt) {
    throw new Error("joinRequestNotFound");
  }

  const { mode = "new", existingMemberId, cycleIds = [], eventIds = [] } =
    options ?? {};

  let memberId: string;

  if (mode === "existing" && existingMemberId) {
    const targetMember = await StudentRepository.findById(existingMemberId);
    if (
      !targetMember ||
      targetMember.schoolId !== schoolId ||
      targetMember.status !== MemberStatus.OFFLINE
    ) {
      throw new Error("existingMemberNotEligible");
    }

    // Activate the explicitly selected offline member
    await StudentRepository.update(existingMemberId, {
      userId: request.userId,
      displayName: request.displayName,
      email: request.email,
      phoneNumber: request.phoneNumber,
      avatarUrl: request.avatarUrl,
      status: MemberStatus.ACTIVE,
    } as Partial<SchoolMember>);
    memberId = existingMemberId;
  } else {
    // Fetch student role id best-effort
    const schoolsCollection = database.get<School>("schools");
    const school = await schoolsCollection.find(schoolId);
    const studentRoleId = await getStudentRoleId(school.organizationId);

    const newMember = await StudentRepository.create({
      schoolId,
      userId: request.userId,
      email: request.email,
      displayName: request.displayName,
      phoneNumber: request.phoneNumber,
      avatarUrl: request.avatarUrl,
      status: MemberStatus.ACTIVE,
      roleId: studentRoleId,
    });
    memberId = newMember.id;
  }

  // Add to selected payment cycles
  if (cycleIds.length > 0) {
    const schoolSettings = await SchoolSettingsRepository.findBySchoolId(schoolId);
    const member = await StudentRepository.findById(memberId);
    const { amount, currency } = memberPaymentAmount(member ?? {}, {
      amount: schoolSettings?.defaultPaymentAmount ?? 0,
      currency: schoolSettings?.defaultCurrency ?? "PLN",
    });
    for (const cycleId of cycleIds) {
      await PaymentRecordRepository.bulkCreate(cycleId, [memberId], amount, currency);
    }
  }

  // Add to selected events
  for (const eventId of eventIds) {
    await EventParticipantRepository.create({
      eventId,
      schoolMemberId: memberId,
      status: "absent",
    });
  }

  // Remove the join request
  await SchoolJoinRequestRepository.softDelete(requestId);

  sync().catch((err) => {
    console.error("[approveJoinRequest] Sync failed:", err);
  });
};

// ============================================================================
// Reject Join Request
// ============================================================================

/**
 * Rejects a school join request without creating a member. The request row is
 * marked 'rejected' (not soft-deleted) so the student can see the outcome on
 * their dashboard; it's soft-deleted later when they dismiss that card.
 */
export const rejectJoinRequest = async (requestId: string): Promise<void> => {
  await SchoolJoinRequestRepository.markRejected(requestId);

  sync().catch((err) => {
    console.error("[rejectJoinRequest] Sync failed:", err);
  });
};

// ============================================================================
// Observe Students Count
// ============================================================================

/**
 * Returns an observable for the count of students in a school
 * Used for reactive UI updates in dashboards
 *
 * @param schoolId - School ID to count students for
 * @returns Observable<number> - Observable count of students
 */
export const observeStudentsCount = (schoolId: string) => {
  return StudentRepository.observeCount(schoolId);
};

// ============================================================================
// Assign Rank
// ============================================================================

/**
 * Sets (or clears) a student's current grading rank.
 */
export const assignRankToStudent = async (
  studentId: string,
  rankId: string | null,
): Promise<void> => {
  await StudentRepository.update(studentId, {
    currentRankId: rankId ?? undefined,
  } as any);

  sync().catch(console.error);
};

/**
 * Sets the student's own fee for new payment periods (e.g. half the amount
 * for a child); `null` goes back to the school's default amount.
 * Existing payments keep their amounts.
 */
export const setStudentPaymentAmount = async (
  studentId: string,
  fee: { amount: number; currency: string } | null,
): Promise<void> => {
  if (fee && (!(fee.amount >= 0) || !fee.currency)) {
    throw new Error(t("amountInvalidType"));
  }
  await StudentRepository.update(studentId, {
    paymentAmount: fee?.amount ?? null,
    paymentCurrency: fee?.currency ?? null,
  });

  sync().catch(console.error);
};
