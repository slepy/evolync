/** Badge label for an unread count: hidden at 0, capped at "99+". */
export const formatUnreadBadge = (count: number): string | null => {
  if (!Number.isFinite(count) || count <= 0) return null;
  return count > 99 ? "99+" : String(Math.floor(count));
};
