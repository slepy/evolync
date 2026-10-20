/**
 * DTO types for Students module
 */

import type { MemberStatus } from './enums';

/**
 * Student response DTO - used for displaying student information
 */
export interface StudentResponseDto {
  id: string;
  schoolId: string;
  userId?: string | null;
  displayName?: string | null;
  email?: string | null;
  status: MemberStatus;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create student DTO - used when adding a new student
 */
export interface CreateStudentDto {
  displayName: string;
  email?: string;
  phoneNumber?: string;
}

/**
 * Update student status DTO
 */
export interface UpdateStudentStatusDto {
  status: MemberStatus;
}

/** Values edited in the sheet; the amount stays text while typing. */
export interface StudentPaymentAmountDraft {
  useDefault: boolean;
  amount: string;
  currency: string;
}
