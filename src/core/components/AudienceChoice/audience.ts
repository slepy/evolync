/** Who an event or a training is for (same values as their `visibility`). */
export const AUDIENCE = {
  ORGANIZATION: "organization",
  SCHOOL: "school",
  WHITELIST: "whitelist",
} as const;

export type Audience = (typeof AUDIENCE)[keyof typeof AUDIENCE];

export interface AudienceMember {
  id: string;
  displayName: string;
  schoolName?: string;
  /** Profile photo shown instead of the initials. */
  avatarUrl?: string;
  /** Current rank: its belt color cuts the avatar corner. */
  rankId?: string;
}
