import { Database } from '@/database/supabase';

// Helper types to access Database definitions
type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

// ==========================================
// 1. Synchronization (Core)
// ==========================================

/**
 * Represents the changes for a specific table during synchronization.
 * Used in both Pull Response and Push Request.
 */
export type SyncChangeSet<T extends keyof Tables> = {
  created: Tables[T]['Row'][];
  updated: Tables[T]['Row'][];
  deleted: string[]; // IDs of deleted records
};

/**
 * Map of changes keyed by table name.
 * We make it partial because a sync might not involve all tables.
 */
export type SyncDatabaseChanges = {
  [K in keyof Tables]?: SyncChangeSet<K>;
};

/**
 * Response from GET /sync/pull
 */
export interface SyncPullResponse {
  changes: SyncDatabaseChanges;
  timestamp: number;
}

/**
 * Request body for POST /sync/push
 */
export interface SyncPushRequest {
  changes: SyncDatabaseChanges;
  last_pulled_at: number;
}

// ==========================================
// 2. Authentication & Onboarding
// ==========================================

/**
 * Request body for RPC: join_school_by_code
 */
export interface JoinSchoolByCodeRequest {
  code: string;
}

/**
 * Response from RPC: join_school_by_code
 */
export interface JoinSchoolByCodeResponse {
  success: boolean;
  school_id: string;
  member_status: Enums['member_status'];
}

// ==========================================
// 3. School Management (Instructor)
// ==========================================

/**
 * Response from RPC: get_organization_roles
 * Returns a list of roles for the organization.
 */
export type GetOrganizationRolesResponse = Tables['organization_roles']['Row'][];

/**
 * Request body for RPC: generate_invite_code
 */
export interface GenerateInviteCodeRequest {
  school_id: string;
  role_id: string;
  validity_days: number;
}

/**
 * Response from RPC: generate_invite_code
 */
export interface GenerateInviteCodeResponse {
  code: string;
  expires_at: string; // ISO timestamp
}

/**
 * Request body for RPC: manage_student_request
 * Approves or rejects a pending student request.
 */
export interface ManageStudentRequestRequest {
  member_id: string;
  action: 'approve' | 'reject';
}

/**
 * Request body for RPC: link_shadow_user
 * Links a shadow user to a real email address.
 */
export interface LinkShadowUserRequest {
  shadow_member_id: string;
  email: string;
}

// ==========================================
// 4. Finance & Orders
// ==========================================

/**
 * Request body for RPC: record_manual_payment
 */
export interface RecordManualPaymentRequest {
  school_member_id: string;
  amount: number;
  period_start: string; // ISO date string (YYYY-MM-DD)
  period_end: string;   // ISO date string (YYYY-MM-DD)
  method: Enums['payment_method'];
}

/**
 * Request body for RPC: update_order_status
 */
export interface UpdateOrderStatusRequest {
  order_id: string;
  status: Enums['order_status'];
}

// ==========================================
// 5. 3D Assets (Metadata & Sharing)
// ==========================================

/**
 * Response from RPC: get_shared_library
 * Returns shared assets within the organization.
 */
export interface GetSharedLibraryResponse {
  techniques: Tables['techniques']['Row'][];
  sequences: Tables['sequences']['Row'][];
}
