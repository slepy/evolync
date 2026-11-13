import { MemberStatus } from './enums';

/**
 * Status a student is shown with: `archived` stays archived (16H / 16G1);
 * otherwise a member without an app account is `offline` ("No account").
 */
export const getDisplayStatus = (
  status: MemberStatus,
  userId?: string | null,
): MemberStatus => {
  if (status === MemberStatus.ARCHIVED) return MemberStatus.ARCHIVED;
  if (!userId) return MemberStatus.OFFLINE;
  return status;
};
