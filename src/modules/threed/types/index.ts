// IK & Body Part constants (kept for V1 backward compatibility)
export {
  IK_TARGET,
  ALL_IK_TARGETS,
  BODY_PART,
  BODY_PART_TARGETS,
  TARGET_TO_BODY_PART,
} from "./ik";
export type { IKTargetName, BodyPart } from "./ik";

// FK constants & types
export {
  FK_BONES,
  FK_BONE_DISPLAY_KEYS,
  FK_MIRROR_MAP,
  FK_BODY_GROUPS,
  FINGER_TYPE,
  FINGER_BONE_PREFIX,
  FINGER_LABEL_KEYS,
  getFingerBone,
  getBoneBodyGroup,
} from "./fk";
export type {
  FKBoneName,
  BoneTransform,
  BoneTransformMap,
  GizmoMode,
  FKBodyGroup,
  FingerType,
} from "./fk";

// 3D Data structures (V1 + V2 + V3)
export type {
  Vec3,
  Quat,
  HandPresetRef,
  TechniqueData,
  ActorData,
  StepData,
  PresetBoneData,
  ActorDataV2,
  StepDataV2,
  TechniqueDataV2,
  ActorDataV3,
  StepDataV3,
  TechniqueDataV3,
  AnyStepData,
  AnyTechniqueData,
} from "./data";

// DTOs
export type {
  CreateSequenceDto,
  UpdateSequenceDto,
  CreateTechniqueDto,
  UpdateTechniqueDto,
  AddStepDto,
} from "./dto";

// Tabs
export { THREED_TAB } from "./tabs";
export type { ThreeDTabValue, ThreeDTab } from "./tabs";
