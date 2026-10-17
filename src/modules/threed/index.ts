// ============================================================================
// 3D Module Exports
// ============================================================================

// Components
export {
  ThreeDCanvas,
  HumanModel,
  BoneMarker,
  BoneMarkerGroup,
  SequenceCard,
  TechniqueCard,
  TechniqueLibrarySheet,
  SaveTechniqueSheet,
} from "./components";

// Repositories
export {
  BodyPosePresetRepository,
  TechniqueRepository,
  SequenceRepository,
  SequenceStepRepository,
} from "./repositories";

// Hooks
export {
  useSequences,
  useSequenceSteps,
  useTechniques,
  useSequenceEditor,
  useSequenceViewer,
} from "./hooks";

// Services
export {
  createSequence,
  updateSequence,
  updateSequenceCoverImage,
  deleteSequence,
  addStepToSequence,
  updateStep,
  deleteStep,
  saveTechnique,
  updateTechnique,
} from "./services";

// Types (V1 kept for backward compat, V2 for new FK system)
export type {
  Vec3,
  Quat,
  HandPresetRef,
  PresetBoneData,
  TechniqueData,
  ActorData,
  StepData,
  ActorDataV2,
  StepDataV2,
  TechniqueDataV2,
  AnyStepData,
  AnyTechniqueData,
  BoneTransform,
  BoneTransformMap,
  FKBoneName,
  GizmoMode,
  FKBodyGroup,
  CreateSequenceDto,
  UpdateSequenceDto,
  CreateTechniqueDto,
  UpdateTechniqueDto,
  AddStepDto,
} from "./types";

export {
  FK_BONES,
  FK_BONE_DISPLAY_KEYS,
  FK_MIRROR_MAP,
  FK_BODY_GROUPS,
  getBoneBodyGroup,
} from "./types";

// Legacy IK exports (kept for V1 data deserialization)
export { IK_TARGET, BODY_PART, BODY_PART_TARGETS, TARGET_TO_BODY_PART } from "./types";
