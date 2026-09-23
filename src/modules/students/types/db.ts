import type { MemberStatus } from './enums';

export interface SchoolMemberRecord {
  id: string;
  school_id: string;
  user_id?: string | null;
  role_id?: string | null;
  display_name?: string | null;
  email?: string | null;
  status: MemberStatus;
  joined_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
