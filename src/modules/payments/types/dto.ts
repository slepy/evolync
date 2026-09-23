import type {
  PaymentMethod,
  PaymentStatus,
} from "@/database/models/PaymentRecord";

/**
 * DTO for creating a new payment cycle
 */
export interface CreatePaymentCycleDto {
  schoolId: string;
  periodStart: string; // ISO date string (YYYY-MM-DD)
  periodEnd: string; // ISO date string (YYYY-MM-DD)
  notes?: string;
}

/**
 * DTO for updating a payment cycle
 */
export interface UpdatePaymentCycleDto {
  notes?: string;
}

/**
 * DTO for creating/updating a payment record
 */
export interface UpsertPaymentRecordDto {
  paymentCycleId: string;
  schoolMemberId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  paymentDate?: string; // ISO date string
}

/**
 * Response DTO for payment cycle
 */
export interface PaymentCycleResponseDto {
  id: string;
  schoolId: string;
  periodStart: Date;
  periodEnd: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for payment record with member info
 */
export interface PaymentRecordResponseDto {
  id: string;
  paymentCycleId: string;
  schoolMemberId: string;
  memberDisplayName?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Combined response for a cycle with all payment records
 */
export interface CycleWithPaymentsDto {
  cycle: PaymentCycleResponseDto;
  records: PaymentRecordResponseDto[];
}
