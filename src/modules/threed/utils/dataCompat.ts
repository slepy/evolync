import type {
  StepData,
  StepDataV2,
  StepDataV3,
  TechniqueData,
  TechniqueDataV2,
  TechniqueDataV3,
  Vec3,
  Quat,
  BoneTransformMap,
  AnyStepData,
  AnyTechniqueData,
} from "../types";

const IDENTITY_QUAT: Quat = { x: 0, y: 0, z: 0, w: 1 };

// =============================================================================
// Version detection
// =============================================================================

export function isV2StepData(data: AnyStepData): data is StepDataV2 {
  return (data as StepDataV2).version === 2;
}

export function isV3StepData(data: AnyStepData): data is StepDataV3 {
  return (data as StepDataV3).version === 3;
}

export function isV2TechniqueData(
  data: AnyTechniqueData,
): data is TechniqueDataV2 {
  return (data as TechniqueDataV2).version === 2;
}

export function isV3TechniqueData(
  data: AnyTechniqueData,
): data is TechniqueDataV3 {
  return (data as TechniqueDataV3).version === 3;
}

// =============================================================================
// V1 → V2 conversion (lossy: IK positions cannot map to FK rotations)
// =============================================================================

/**
 * Best-effort conversion from V1 IK step data to V2 FK format.
 * Only the hips position is preserved as a bone position offset.
 * Other IK targets (wrist/ankle positions) are discarded because
 * they cannot be meaningfully converted to FK bone rotations
 * without running an IK solve.
 */
export function convertV1StepToV2(v1: StepData): StepDataV2 {
  return {
    version: 2,
    mainActor: {
      version: 2,
      boneTransforms: convertIKTargetsToFK(v1.mainActor.targets),
      handPresets: v1.mainActor.handPresets,
      rootPosition: v1.mainActor.rootPosition,
      rootRotation: v1.mainActor.rootRotation,
    },
    partner: v1.partner
      ? {
          version: 2,
          boneTransforms: convertIKTargetsToFK(v1.partner.targets),
          handPresets: v1.partner.handPresets,
          rootPosition: v1.partner.rootPosition,
          rootRotation: v1.partner.rootRotation,
          color: v1.partner.color,
        }
      : undefined,
  };
}

export function convertV1TechniqueToV2(v1: TechniqueData): TechniqueDataV2 {
  return {
    version: 2,
    bodyGroup: "fullbody",
    boneTransforms: convertIKTargetsToFK(v1.targets),
    handPresets: v1.handPresets,
  };
}

function convertIKTargetsToFK(
  targets: Record<string, Vec3>,
): BoneTransformMap {
  const transforms: BoneTransformMap = {};

  // Only the hips IK target can be meaningfully mapped to FK
  if (targets.hips) {
    transforms["DEF-hips"] = {
      rotation: IDENTITY_QUAT,
      position: targets.hips,
    };
  }

  return transforms;
}

// =============================================================================
// V1 → V3 conversion (preserves IK targets directly)
// =============================================================================

export function convertV1StepToV3(v1: StepData): StepDataV3 {
  return {
    version: 3,
    mainActor: {
      version: 3,
      ikTargets: { ...v1.mainActor.targets },
      handPresets: v1.mainActor.handPresets,
      rootPosition: v1.mainActor.rootPosition,
      rootRotation: v1.mainActor.rootRotation,
    },
    partner: v1.partner
      ? {
          version: 3,
          ikTargets: { ...v1.partner.targets },
          handPresets: v1.partner.handPresets,
          rootPosition: v1.partner.rootPosition,
          rootRotation: v1.partner.rootRotation,
          color: v1.partner.color,
        }
      : undefined,
  };
}

export function convertV1TechniqueToV3(v1: TechniqueData): TechniqueDataV3 {
  return {
    version: 3,
    bodyGroup: "fullbody",
    ikTargets: { ...v1.targets },
  };
}

// =============================================================================
// V2 → V3 conversion (FK-only data: empty ikTargets, boneTransforms preserved)
// =============================================================================

export function convertV2StepToV3(v2: StepDataV2): StepDataV3 {
  return {
    version: 3,
    mainActor: {
      version: 3,
      ikTargets: {},
      boneTransforms: v2.mainActor.boneTransforms,
      handPresets: v2.mainActor.handPresets,
      rootPosition: v2.mainActor.rootPosition,
      rootRotation: v2.mainActor.rootRotation,
    },
    partner: v2.partner
      ? {
          version: 3,
          ikTargets: {},
          boneTransforms: v2.partner.boneTransforms,
          handPresets: v2.partner.handPresets,
          rootPosition: v2.partner.rootPosition,
          rootRotation: v2.partner.rootRotation,
          color: v2.partner.color,
        }
      : undefined,
  };
}

export function convertV2TechniqueToV3(v2: TechniqueDataV2): TechniqueDataV3 {
  return {
    version: 3,
    bodyGroup: v2.bodyGroup,
    ikTargets: {},
    boneTransforms: v2.boneTransforms,
  };
}

// =============================================================================
// Normalize to V2 (for FK-only consumers, backward compat)
// =============================================================================

export function normalizeStepData(data: AnyStepData): StepDataV2 {
  if (isV3StepData(data)) {
    const v3 = data as StepDataV3;
    return {
      version: 2,
      mainActor: {
        version: 2,
        boneTransforms: v3.mainActor.boneTransforms ?? {},
        handPresets: v3.mainActor.handPresets,
        rootPosition: v3.mainActor.rootPosition,
        rootRotation: v3.mainActor.rootRotation,
      },
      partner: v3.partner
        ? {
            version: 2,
            boneTransforms: v3.partner.boneTransforms ?? {},
            handPresets: v3.partner.handPresets,
            rootPosition: v3.partner.rootPosition,
            rootRotation: v3.partner.rootRotation,
            color: v3.partner.color,
          }
        : undefined,
    };
  }
  if (isV2StepData(data)) return data;
  return convertV1StepToV2(data as StepData);
}

export function normalizeTechniqueData(
  data: AnyTechniqueData,
): TechniqueDataV2 {
  if (isV3TechniqueData(data)) {
    const v3 = data as TechniqueDataV3;
    return {
      version: 2,
      bodyGroup: v3.bodyGroup,
      boneTransforms: v3.boneTransforms ?? {},
    };
  }
  if (isV2TechniqueData(data)) return data;
  return convertV1TechniqueToV2(data as TechniqueData);
}

// =============================================================================
// Normalize to V3 (for IK-aware consumers)
// =============================================================================

export function normalizeStepDataV3(data: AnyStepData): StepDataV3 {
  if (isV3StepData(data)) return data;
  if (isV2StepData(data)) return convertV2StepToV3(data);
  return convertV1StepToV3(data);
}

export function normalizeTechniqueDataV3(
  data: AnyTechniqueData,
): TechniqueDataV3 {
  if (isV3TechniqueData(data)) return data;
  if (isV2TechniqueData(data)) return convertV2TechniqueToV3(data);
  return convertV1TechniqueToV3(data);
}

/** Main-actor bone transforms of a stored step (`sequence_steps.data`); empty for a blank or unreadable step. */
export function stepBoneTransforms(data: string | null | undefined): BoneTransformMap {
  if (!data) return {};
  try {
    return normalizeStepData(JSON.parse(data)).mainActor.boneTransforms ?? {};
  } catch {
    return {};
  }
}
