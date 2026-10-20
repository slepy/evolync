import { matchesSearch } from "@/core/components/SearchField/matchesSearch";
import type { EntityTag } from "@/modules/tags";
import { intlLocaleTag } from "@/core/i18n/localeTags";

/** One row of "Your sequences" (D2): steps · date, tags under it. */
export interface SequenceListItem {
  id: string;
  title: string;
  createdAt: Date;
  stepCount: number;
  tags: EntityTag[];
}

/** One row of "Your techniques" / "Starting positions" (D3, D4). */
export interface TechniqueListItem {
  id: string;
  title: string;
  bodyPart: string;
  createdAt: Date;
}

/**
 * Chips of the techniques filter (D3): All, Arms, Hands, Legs, Spine. The
 * board's "Full body" chip is left out: full-body poses are the Positions tab.
 */
export const BODY_PART_FILTERS = ["all", "arms", "hands", "legs", "spine"] as const;
export type BodyPartFilter = (typeof BODY_PART_FILTERS)[number];

export const BODY_PART_FILTER_KEYS: Record<BodyPartFilter, string> = {
  all: "all",
  arms: "threedFilterArms",
  hands: "threedFilterHands",
  legs: "threedFilterLegs",
  spine: "threedBodySpine",
};

/**
 * Stored `body_part` → label key ("Right arm"). V2 saves FK body groups; V1
 * techniques still carry IK targets (wrists, ankles, hips).
 */
const BODY_PART_LABEL_KEYS: Record<string, string> = {
  leftArm: "threedBodyLeftArm",
  rightArm: "threedBodyRightArm",
  leftHand: "boneLeftHand",
  rightHand: "boneRightHand",
  leftLeg: "threedBodyLeftLeg",
  rightLeg: "threedBodyRightLeg",
  spine: "threedBodySpine",
  fullbody: "threedBodyFullbody",
  leftWrist: "threedBodyLeftArm",
  rightWrist: "threedBodyRightArm",
  leftAnkle: "threedBodyLeftLeg",
  rightAnkle: "threedBodyRightLeg",
  hips: "threedBodySpine",
};

const BODY_PART_FILTER_OF: Record<string, Exclude<BodyPartFilter, "all">> = {
  leftArm: "arms",
  rightArm: "arms",
  leftWrist: "arms",
  rightWrist: "arms",
  leftHand: "hands",
  rightHand: "hands",
  leftLeg: "legs",
  rightLeg: "legs",
  leftAnkle: "legs",
  rightAnkle: "legs",
  spine: "spine",
  hips: "spine",
};

export const bodyPartLabelKey = (bodyPart: string): string => BODY_PART_LABEL_KEYS[bodyPart] ?? "threedBodyFullbody";

/** Filter chip a stored body part belongs to; null for full-body poses. */
export const bodyPartFilterOf = (bodyPart: string): BodyPartFilter | null => BODY_PART_FILTER_OF[bodyPart] ?? null;

/** Sequences whose title or tag names match the search. */
export function filterSequences(sequences: SequenceListItem[], query: string): SequenceListItem[] {
  return sequences.filter((s) => matchesSearch(query, s.title, ...s.tags.map((tag) => tag.name)));
}

/** Techniques of the chosen body part (or all) whose title or body-part label matches the search. */
export function filterTechniques<T extends TechniqueListItem>(
  techniques: T[],
  query: string,
  filter: BodyPartFilter,
  label: (bodyPart: string) => string,
): T[] {
  return techniques.filter(
    (tech) =>
      (filter === "all" || bodyPartFilterOf(tech.bodyPart) === filter) &&
      matchesSearch(query, tech.title, label(tech.bodyPart)),
  );
}

/** Step counts per sequence from the live (not deleted) steps. */
export function countStepsBySequence(steps: Array<{ sequenceId: string }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const step of steps) counts.set(step.sequenceId, (counts.get(step.sequenceId) ?? 0) + 1);
  return counts;
}

/** "2 Oct" / "2 paź" under a sequence or technique title. */
export function formatThreeDDate(date: Date, language: string): string {
  return date.toLocaleDateString(intlLocaleTag(language, "en-GB"), { day: "numeric", month: "short" });
}
