/**
 * DTO types for Students module
 */

import type { MemberStatus } from './db';

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
