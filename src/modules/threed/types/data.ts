import type { BodyPart } from "./ik";
import type { BoneTransformMap, FKBodyGroup } from "./fk";

// =============================================================================
// Primitives
// =============================================================================

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

// =============================================================================
// Hand Presets
// =============================================================================

export interface HandPresetRef {
  presetId: string;
  wristRotation: Quat;
}

// PresetBoneData is actually BoneTransformMap (Record<boneName, BoneTransform>)
export type PresetBoneData = BoneTransformMap;

// =============================================================================
// Technique Data (stored as JSON in techniques.data)
// =============================================================================

export interface TechniqueData {
  bodyPart: BodyPart;
  targets: Record<string, Vec3>;
  handPresets?: {
    left?: HandPresetRef;
    right?: HandPresetRef;
  };
}

// =============================================================================
// Step Data (stored as JSON in sequence_steps.data)
// =============================================================================

export interface ActorData {
  targets: Record<string, Vec3>;
  handPresets: {
    left: HandPresetRef;
    right: HandPresetRef;
  };
  rootPosition: Vec3;
  rootRotation: Quat;
}

export interface StepData {
  mainActor: ActorData;
  partner?: ActorData & { color: string };
}

// =============================================================================
// V2 Data Structures (FK per-bone transforms)
// =============================================================================

export interface ActorDataV2 {
  version: 2;
  boneTransforms: BoneTransformMap;
  handPresets: {
    left: HandPresetRef;
    right: HandPresetRef;
  };
  rootPosition: Vec3;
  rootRotation: Quat;
}

export interface StepDataV2 {
  version: 2;
  mainActor: ActorDataV2;
  partner?: ActorDataV2 & { color: string };
}

export interface TechniqueDataV2 {
  version: 2;
  bodyGroup: FKBodyGroup;
  boneTransforms: BoneTransformMap;
  handPresets?: {
    left?: HandPresetRef;
    right?: HandPresetRef;
  };
}

// =============================================================================
// V3 Data Structures (IK world-space targets + optional FK overrides)
// =============================================================================

export interface ActorDataV3 {
  version: 3;
  ikTargets: Record<string, Vec3>;
  boneTransforms?: BoneTransformMap;
  handPresets: {
    left: HandPresetRef;
    right: HandPresetRef;
  };
  rootPosition: Vec3;
  rootRotation: Quat;
}

export interface StepDataV3 {
  version: 3;
  mainActor: ActorDataV3;
  partner?: ActorDataV3 & { color: string };
}

export interface TechniqueDataV3 {
  version: 3;
  bodyGroup: FKBodyGroup;
  ikTargets: Record<string, Vec3>;
  boneTransforms?: BoneTransformMap;
}

// =============================================================================
// Union types for backward-compatible deserialization
// =============================================================================

export type AnyStepData = StepData | StepDataV2 | StepDataV3;
export type AnyTechniqueData = TechniqueData | TechniqueDataV2 | TechniqueDataV3;
