import type { Quat, Vec3 } from "./data";

// =============================================================================
// FK Bone Names — runtime names after Three.js GLTFLoader sanitization.
// GLTFLoader strips dots from node names: "DEF-spine.001" → "DEF-spine001",
// "DEF-shoulder.L" → "DEF-shoulderL", etc.
// =============================================================================

export const FK_BONES = [
  "DEF-hips",
  "DEF-spine001",
  "DEF-spine002",
  "DEF-spine003",
  "DEF-neck",
  "DEF-head",
  "DEF-shoulderL",
  "DEF-upper_armL",
  "DEF-forearmL",
  "DEF-handL",
  // Left hand fingers
  "DEF-thumb01L",
  "DEF-thumb02L",
  "DEF-thumb03L",
  "DEF-f_index01L",
  "DEF-f_index02L",
  "DEF-f_index03L",
  "DEF-f_middle01L",
  "DEF-f_middle02L",
  "DEF-f_middle03L",
  "DEF-f_ring01L",
  "DEF-f_ring02L",
  "DEF-f_ring03L",
  "DEF-f_pinky01L",
  "DEF-f_pinky02L",
  "DEF-f_pinky03L",
  "DEF-shoulderR",
  "DEF-upper_armR",
  "DEF-forearmR",
  "DEF-handR",
  // Right hand fingers
  "DEF-thumb01R",
  "DEF-thumb02R",
  "DEF-thumb03R",
  "DEF-f_index01R",
  "DEF-f_index02R",
  "DEF-f_index03R",
  "DEF-f_middle01R",
  "DEF-f_middle02R",
  "DEF-f_middle03R",
  "DEF-f_ring01R",
  "DEF-f_ring02R",
  "DEF-f_ring03R",
  "DEF-f_pinky01R",
  "DEF-f_pinky02R",
  "DEF-f_pinky03R",
  "DEF-thighL",
  "DEF-shinL",
  "DEF-footL",
  "DEF-toeL",
  "DEF-thighR",
  "DEF-shinR",
  "DEF-footR",
  "DEF-toeR",
] as const;

export type FKBoneName = (typeof FK_BONES)[number];

// =============================================================================
// Per-bone transform
// =============================================================================

export interface BoneTransform {
  rotation: Quat; // Quaternion delta relative to rest pose
  position?: Vec3; // Local position offset (mainly useful for DEF-hips)
}

export type BoneTransformMap = Record<string, BoneTransform>;

// =============================================================================
// Gizmo mode
// =============================================================================

export type GizmoMode = "rotate" | "translate";

// =============================================================================
// Display name mapping (i18n keys)
// =============================================================================

export const FK_BONE_DISPLAY_KEYS: Record<FKBoneName, string> = {
  "DEF-hips": "boneHips",
  "DEF-spine001": "boneLowerSpine",
  "DEF-spine002": "boneMiddleSpine",
  "DEF-spine003": "boneUpperSpine",
  "DEF-neck": "boneNeck",
  "DEF-head": "boneHead",
  "DEF-shoulderL": "boneLeftShoulder",
  "DEF-upper_armL": "boneLeftUpperArm",
  "DEF-forearmL": "boneLeftForearm",
  "DEF-handL": "boneLeftHand",
  // Left hand fingers
  "DEF-thumb01L": "fingerLeftThumb1",
  "DEF-thumb02L": "fingerLeftThumb2",
  "DEF-thumb03L": "fingerLeftThumb3",
  "DEF-f_index01L": "fingerLeftIndex1",
  "DEF-f_index02L": "fingerLeftIndex2",
  "DEF-f_index03L": "fingerLeftIndex3",
  "DEF-f_middle01L": "fingerLeftMiddle1",
  "DEF-f_middle02L": "fingerLeftMiddle2",
  "DEF-f_middle03L": "fingerLeftMiddle3",
  "DEF-f_ring01L": "fingerLeftRing1",
  "DEF-f_ring02L": "fingerLeftRing2",
  "DEF-f_ring03L": "fingerLeftRing3",
  "DEF-f_pinky01L": "fingerLeftPinky1",
  "DEF-f_pinky02L": "fingerLeftPinky2",
  "DEF-f_pinky03L": "fingerLeftPinky3",
  "DEF-shoulderR": "boneRightShoulder",
  "DEF-upper_armR": "boneRightUpperArm",
  "DEF-forearmR": "boneRightForearm",
  "DEF-handR": "boneRightHand",
  // Right hand fingers
  "DEF-thumb01R": "fingerRightThumb1",
  "DEF-thumb02R": "fingerRightThumb2",
  "DEF-thumb03R": "fingerRightThumb3",
  "DEF-f_index01R": "fingerRightIndex1",
  "DEF-f_index02R": "fingerRightIndex2",
  "DEF-f_index03R": "fingerRightIndex3",
  "DEF-f_middle01R": "fingerRightMiddle1",
  "DEF-f_middle02R": "fingerRightMiddle2",
  "DEF-f_middle03R": "fingerRightMiddle3",
  "DEF-f_ring01R": "fingerRightRing1",
  "DEF-f_ring02R": "fingerRightRing2",
  "DEF-f_ring03R": "fingerRightRing3",
  "DEF-f_pinky01R": "fingerRightPinky1",
  "DEF-f_pinky02R": "fingerRightPinky2",
  "DEF-f_pinky03R": "fingerRightPinky3",
  "DEF-thighL": "boneLeftThigh",
  "DEF-shinL": "boneLeftShin",
  "DEF-footL": "boneLeftFoot",
  "DEF-toeL": "boneLeftToe",
  "DEF-thighR": "boneRightThigh",
  "DEF-shinR": "boneRightShin",
  "DEF-footR": "boneRightFoot",
  "DEF-toeR": "boneRightToe",
};

// =============================================================================
// Mirror mapping (Left ↔ Right)
// =============================================================================

export const FK_MIRROR_MAP: Partial<Record<FKBoneName, FKBoneName>> = {
  "DEF-shoulderL": "DEF-shoulderR",
  "DEF-upper_armL": "DEF-upper_armR",
  "DEF-forearmL": "DEF-forearmR",
  "DEF-handL": "DEF-handR",
  // Left hand fingers ↔ Right hand fingers
  "DEF-thumb01L": "DEF-thumb01R",
  "DEF-thumb02L": "DEF-thumb02R",
  "DEF-thumb03L": "DEF-thumb03R",
  "DEF-f_index01L": "DEF-f_index01R",
  "DEF-f_index02L": "DEF-f_index02R",
  "DEF-f_index03L": "DEF-f_index03R",
  "DEF-f_middle01L": "DEF-f_middle01R",
  "DEF-f_middle02L": "DEF-f_middle02R",
  "DEF-f_middle03L": "DEF-f_middle03R",
  "DEF-f_ring01L": "DEF-f_ring01R",
  "DEF-f_ring02L": "DEF-f_ring02R",
  "DEF-f_ring03L": "DEF-f_ring03R",
  "DEF-f_pinky01L": "DEF-f_pinky01R",
  "DEF-f_pinky02L": "DEF-f_pinky02R",
  "DEF-f_pinky03L": "DEF-f_pinky03R",
  "DEF-thighL": "DEF-thighR",
  "DEF-shinL": "DEF-shinR",
  "DEF-footL": "DEF-footR",
  "DEF-toeL": "DEF-toeR",
  "DEF-shoulderR": "DEF-shoulderL",
  "DEF-upper_armR": "DEF-upper_armL",
  "DEF-forearmR": "DEF-forearmL",
  "DEF-handR": "DEF-handL",
  // Right hand fingers ↔ Left hand fingers
  "DEF-thumb01R": "DEF-thumb01L",
  "DEF-thumb02R": "DEF-thumb02L",
  "DEF-thumb03R": "DEF-thumb03L",
  "DEF-f_index01R": "DEF-f_index01L",
  "DEF-f_index02R": "DEF-f_index02L",
  "DEF-f_index03R": "DEF-f_index03L",
  "DEF-f_middle01R": "DEF-f_middle01L",
  "DEF-f_middle02R": "DEF-f_middle02L",
  "DEF-f_middle03R": "DEF-f_middle03L",
  "DEF-f_ring01R": "DEF-f_ring01L",
  "DEF-f_ring02R": "DEF-f_ring02L",
  "DEF-f_ring03R": "DEF-f_ring03L",
  "DEF-f_pinky01R": "DEF-f_pinky01L",
  "DEF-f_pinky02R": "DEF-f_pinky02L",
  "DEF-f_pinky03R": "DEF-f_pinky03L",
  "DEF-thighR": "DEF-thighL",
  "DEF-shinR": "DEF-shinL",
  "DEF-footR": "DEF-footL",
  "DEF-toeR": "DEF-toeL",
};

// =============================================================================
// Body part groups (for technique saving)
// =============================================================================

export const FK_BODY_GROUPS = {
  leftArm: [
    "DEF-shoulderL",
    "DEF-upper_armL",
    "DEF-forearmL",
    "DEF-handL",
    "DEF-thumb01L",
    "DEF-thumb02L",
    "DEF-thumb03L",
    "DEF-f_index01L",
    "DEF-f_index02L",
    "DEF-f_index03L",
    "DEF-f_middle01L",
    "DEF-f_middle02L",
    "DEF-f_middle03L",
    "DEF-f_ring01L",
    "DEF-f_ring02L",
    "DEF-f_ring03L",
    "DEF-f_pinky01L",
    "DEF-f_pinky02L",
    "DEF-f_pinky03L",
  ],
  rightArm: [
    "DEF-shoulderR",
    "DEF-upper_armR",
    "DEF-forearmR",
    "DEF-handR",
    "DEF-thumb01R",
    "DEF-thumb02R",
    "DEF-thumb03R",
    "DEF-f_index01R",
    "DEF-f_index02R",
    "DEF-f_index03R",
    "DEF-f_middle01R",
    "DEF-f_middle02R",
    "DEF-f_middle03R",
    "DEF-f_ring01R",
    "DEF-f_ring02R",
    "DEF-f_ring03R",
    "DEF-f_pinky01R",
    "DEF-f_pinky02R",
    "DEF-f_pinky03R",
  ],
  leftHand: [
    "DEF-thumb01L",
    "DEF-thumb02L",
    "DEF-thumb03L",
    "DEF-f_index01L",
    "DEF-f_index02L",
    "DEF-f_index03L",
    "DEF-f_middle01L",
    "DEF-f_middle02L",
    "DEF-f_middle03L",
    "DEF-f_ring01L",
    "DEF-f_ring02L",
    "DEF-f_ring03L",
    "DEF-f_pinky01L",
    "DEF-f_pinky02L",
    "DEF-f_pinky03L",
  ],
  rightHand: [
    "DEF-thumb01R",
    "DEF-thumb02R",
    "DEF-thumb03R",
    "DEF-f_index01R",
    "DEF-f_index02R",
    "DEF-f_index03R",
    "DEF-f_middle01R",
    "DEF-f_middle02R",
    "DEF-f_middle03R",
    "DEF-f_ring01R",
    "DEF-f_ring02R",
    "DEF-f_ring03R",
    "DEF-f_pinky01R",
    "DEF-f_pinky02R",
    "DEF-f_pinky03R",
  ],
  leftLeg: ["DEF-thighL", "DEF-shinL", "DEF-footL", "DEF-toeL"],
  rightLeg: ["DEF-thighR", "DEF-shinR", "DEF-footR", "DEF-toeR"],
  spine: [
    "DEF-hips",
    "DEF-spine001",
    "DEF-spine002",
    "DEF-spine003",
    "DEF-neck",
    "DEF-head",
  ],
  fullbody: [...FK_BONES],
} as const;

export type FKBodyGroup = keyof typeof FK_BODY_GROUPS;

// =============================================================================
// Finger types
// =============================================================================

export const FINGER_TYPE = {
  THUMB: "thumb",
  INDEX: "index",
  MIDDLE: "middle",
  RING: "ring",
  PINKY: "pinky",
} as const;

export type FingerType = (typeof FINGER_TYPE)[keyof typeof FINGER_TYPE];

/** Bone prefix used in DEF-<prefix>0<segment><side> pattern */
export const FINGER_BONE_PREFIX: Record<FingerType, string> = {
  thumb: "thumb",
  index: "f_index",
  middle: "f_middle",
  ring: "f_ring",
  pinky: "f_pinky",
};

export const FINGER_LABEL_KEYS: Record<FingerType, string> = {
  thumb: "fingerThumb",
  index: "fingerIndex",
  middle: "fingerMiddle",
  ring: "fingerRing",
  pinky: "fingerPinky",
};

/** Returns the FK bone name for a finger segment on a given side. */
export function getFingerBone(
  finger: FingerType,
  segment: 1 | 2 | 3,
  side: "L" | "R",
): FKBoneName {
  return `DEF-${FINGER_BONE_PREFIX[finger]}0${segment}${side}` as FKBoneName;
}

/**
 * Determine which body group a bone belongs to.
 * Returns the most specific group (not fullbody).
 */
export function getBoneBodyGroup(boneName: string): FKBodyGroup | null {
  for (const [group, bones] of Object.entries(FK_BODY_GROUPS)) {
    if (group === "fullbody") continue;
    if ((bones as readonly string[]).includes(boneName)) {
      return group as FKBodyGroup;
    }
  }
  return null;
}
