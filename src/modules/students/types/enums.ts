export type MemberStatus = 'pending' | 'active' | 'archived' | 'rejected' | 'offline';

export const MemberStatus = {
  PENDING: 'pending' as const,
  ACTIVE: 'active' as const,
  ARCHIVED: 'archived' as const,
  REJECTED: 'rejected' as const,
  OFFLINE: 'offline' as const,
};

export type StudentsTab = "students" | "requests";
