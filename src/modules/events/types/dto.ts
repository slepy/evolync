import type {
  EventStatus,
  EventVisibility,
} from "@/database/models/Event";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";

/**
 * DTO for creating a new event
 */
export interface CreateEventDto {
  organizationId: string;
  schoolId?: string; // Required when visibility = 'school'
  name: string;
  typeId?: string;
  shortNote?: string;
  address?: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  price: number;
  currency: string;
  visibility: EventVisibility;
  createdBy: string;
}

/**
 * DTO for updating an event
 */
export interface UpdateEventDto {
  name?: string;
  typeId?: string;
  shortNote?: string;
  address?: string;
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD)
  price?: number;
  currency?: string;
  visibility?: EventVisibility;
  schoolId?: string;
  status?: EventStatus;
}

/**
 * DTO for creating/updating an event participant
 */
export interface UpsertEventParticipantDto {
  eventId: string;
  schoolMemberId: string;
  status: EventParticipantStatus;
  statusChangedBy?: string;
}

/**
 * DTO for batch adding participants to an event (whitelist)
 */
export interface AddEventParticipantsDto {
  eventId: string;
  schoolMemberIds: string[];
}

/**
 * Response DTO for event
 */
export interface EventResponseDto {
  id: string;
  organizationId: string;
  schoolId?: string;
  name: string;
  typeId?: string;
  shortNote?: string;
  address?: string;
  startDate: Date;
  endDate: Date;
  price: number;
  currency: string;
  visibility: EventVisibility;
  status: EventStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for event participant with member info
 */
export interface EventParticipantResponseDto {
  id: string;
  eventId: string;
  schoolMemberId: string;
  memberDisplayName?: string;
  status: EventParticipantStatus;
  statusChangedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Combined response for an event with all participants
 */
export interface EventWithParticipantsDto {
  event: EventResponseDto;
  participants: EventParticipantResponseDto[];
}

/**
 * Filter options for querying events
 */
export interface EventFilterOptions {
  organizationId?: string;
  schoolId?: string;
  visibility?: EventVisibility;
  status?: EventStatus;
  upcoming?: boolean; // Only events with start_date >= today
  historical?: boolean; // Only events with end_date < today
}

/**
 * DTO for creating an event type (organization-scoped, name only)
 */
export interface CreateEventTypeDto {
  organizationId: string;
  name: string;
  createdBy: string;
}
