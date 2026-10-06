import { GradingRankRepository } from "@/modules/grading/repositories";
import { useEffect, useState } from "react";
import { memberInitials } from "../AudienceChoice/initials";
import { ListAvatar, type ListAvatarSize } from "../List";

/** Belt color of a rank, live; undefined without a rank or once it is deleted. */
export function useRankColor(rankId?: string | null): string | undefined {
  const [color, setColor] = useState<string | undefined>();

  useEffect(() => {
    if (!rankId) {
      setColor(undefined);
      return;
    }
    const subscription = GradingRankRepository.observeById(rankId).subscribe({
      next: (rank) => setColor(rank?.color || undefined),
      error: () => setColor(undefined),
    });
    return () => subscription.unsubscribe();
  }, [rankId]);

  return color;
}

export interface MemberAvatarProps {
  /** Full name; the initials come from it. */
  name: string;
  uri?: string | null;
  /** The member's current rank (`school_members.current_rank_id`): its belt color cuts the corner. */
  rankId?: string | null;
  size?: ListAvatarSize;
  dimmed?: boolean;
}

/**
 * Avatar of a school member in any list or sheet (16A): photo or initials,
 * with the rank corner in the belt color loaded from the grading ranks.
 */
export function MemberAvatar({ name, uri, rankId, size, dimmed }: MemberAvatarProps) {
  const rankColor = useRankColor(rankId);
  return <ListAvatar initials={memberInitials(name)} uri={uri} size={size} rankColor={rankColor} dimmed={dimmed} />;
}
