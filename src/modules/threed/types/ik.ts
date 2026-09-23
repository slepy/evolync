// =============================================================================
// IK Target Names (used throughout the 3D engine and UI)
// =============================================================================

export const IK_TARGET = {
  LEFT_WRIST: "leftWrist",
  RIGHT_WRIST: "rightWrist",
  LEFT_ANKLE: "leftAnkle",
  RIGHT_ANKLE: "rightAnkle",
  HIPS: "hips",
} as const;

export type IKTargetName = (typeof IK_TARGET)[keyof typeof IK_TARGET];

export const ALL_IK_TARGETS: IKTargetName[] = [
  IK_TARGET.LEFT_WRIST,
  IK_TARGET.RIGHT_WRIST,
  IK_TARGET.LEFT_ANKLE,
  IK_TARGET.RIGHT_ANKLE,
  IK_TARGET.HIPS,
];

// =============================================================================
// Body Part (database column for technique categorization)
// Maps 1:1 with IK targets + "fullbody" for complete poses
// =============================================================================

export const BODY_PART = {
  LEFT_WRIST: "leftWrist",
  RIGHT_WRIST: "rightWrist",
  LEFT_ANKLE: "leftAnkle",
  RIGHT_ANKLE: "rightAnkle",
  HIPS: "hips",
  FULLBODY: "fullbody",
} as const;

export type BodyPart = (typeof BODY_PART)[keyof typeof BODY_PART];

/**
 * Mapping: body_part → related IK targets (for masking)
 * Partial techniques affect only their specific target.
 * Fullbody techniques affect all targets.
 */
export const BODY_PART_TARGETS: Record<BodyPart, IKTargetName[]> = {
  [BODY_PART.LEFT_WRIST]: [IK_TARGET.LEFT_WRIST],
  [BODY_PART.RIGHT_WRIST]: [IK_TARGET.RIGHT_WRIST],
  [BODY_PART.LEFT_ANKLE]: [IK_TARGET.LEFT_ANKLE],
  [BODY_PART.RIGHT_ANKLE]: [IK_TARGET.RIGHT_ANKLE],
  [BODY_PART.HIPS]: [IK_TARGET.HIPS],
  [BODY_PART.FULLBODY]: ALL_IK_TARGETS,
};

/**
 * Reverse mapping: IK target → body part
 */
export const TARGET_TO_BODY_PART: Record<IKTargetName, BodyPart> = {
  [IK_TARGET.LEFT_WRIST]: BODY_PART.LEFT_WRIST,
  [IK_TARGET.RIGHT_WRIST]: BODY_PART.RIGHT_WRIST,
  [IK_TARGET.LEFT_ANKLE]: BODY_PART.LEFT_ANKLE,
  [IK_TARGET.RIGHT_ANKLE]: BODY_PART.RIGHT_ANKLE,
  [IK_TARGET.HIPS]: BODY_PART.HIPS,
};
