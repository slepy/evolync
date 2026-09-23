import { MemberStatus } from './enums';

export const getDisplayStatus = (
  status: MemberStatus,
  userId?: string | null,
): MemberStatus => {
  if (!userId) return MemberStatus.OFFLINE;
  return status;
};
