import { useState, useCallback, useMemo, useRef } from "react";

import type Technique from "@/database/models/Technique";
import type SequenceStep from "@/database/models/SequenceStep";
import {
  addStepToSequence,
  updateStep,
} from "../services/sequenceService";
import { saveTechnique } from "../services/techniqueService";
import {
  FK_MIRROR_MAP,
  FK_BODY_GROUPS,
  getBoneBodyGroup,
} from "../types/fk";
import type {
  FKBoneName,
  BoneTransformMap,
  GizmoMode,
  FKBodyGroup,
} from "../types/fk";
import type { Quat, Vec3, StepDataV2, TechniqueDataV2 } from "../types/data";
import type { RestPoseData } from "../utils/fkSystem";
import { normalizeTechniqueData, normalizeStepData } from "../utils/dataCompat";

const IDENTITY_QUAT: Quat = { x: 0, y: 0, z: 0, w: 1 };
const EMPTY_HANDPRESET = { presetId: "", wristRotation: IDENTITY_QUAT };

export const useSequenceEditor = (sequenceId: string) => {
  const [boneTransforms, setBoneTransforms] = useState<BoneTransformMap>({});
  const restPoseRef = useRef<RestPoseData | null>(null);
  const [selectedBone, setSelectedBone] = useState<FKBoneName | null>(null);
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>("rotate");
  const [partnerEnabled, setPartnerEnabled] = useState(false);

  // Step navigation state
  const [currentStep, setCurrentStep] = useState<SequenceStep | null>(null);

  /** Called by HumanModel once the skeleton rest pose is extracted */
  const handleRestPoseReady = useCallback((restPose: RestPoseData) => {
    if (restPoseRef.current) return;
    restPoseRef.current = restPose;
    setBoneTransforms({});
  }, []);

  // Derive selected body group from selected FK bone
  const selectedBodyGroup = useMemo<FKBodyGroup | null>(() => {
    if (!selectedBone) return null;
    return getBoneBodyGroup(selectedBone);
  }, [selectedBone]);

  // --- FK bone manipulation ---

  const handleBoneRotationChange = useCallback(
    (boneName: string, newDeltaQuat: Quat) => {
      setBoneTransforms((prev) => ({
        ...prev,
        [boneName]: {
          ...prev[boneName],
          rotation: newDeltaQuat,
          position: prev[boneName]?.position,
        },
      }));
    },
    [],
  );

  const handleBonePositionChange = useCallback(
    (boneName: string, newDeltaPos: Vec3) => {
      setBoneTransforms((prev) => ({
        ...prev,
        [boneName]: {
          rotation: prev[boneName]?.rotation ?? IDENTITY_QUAT,
          position: newDeltaPos,
        },
      }));
    },
    [],
  );

  const handleDeselectAll = useCallback(() => {
    setSelectedBone(null);
  }, []);

  // --- Step actions ---

  /** Load a step into the editor (sets boneTransforms from saved step data) */
  const loadStep = useCallback((step: SequenceStep) => {
    setCurrentStep(step);
    try {
      const raw = step.data ? JSON.parse(step.data) : null;
      if (raw) {
        const normalized = normalizeStepData(raw);
        setBoneTransforms(normalized.mainActor.boneTransforms ?? {});
      } else {
        setBoneTransforms({});
      }
    } catch {
      setBoneTransforms({});
    }
    setSelectedBone(null);
  }, []);

  /** Save current pose: updates existing step if one is loaded, otherwise adds new */
  const saveCurrentStep = useCallback(async () => {
    const stepData: StepDataV2 = {
      version: 2,
      mainActor: {
        version: 2,
        boneTransforms: { ...boneTransforms },
        handPresets: {
          left: EMPTY_HANDPRESET,
          right: EMPTY_HANDPRESET,
        },
        rootPosition: { x: 0, y: 0, z: 0 },
        rootRotation: IDENTITY_QUAT,
      },
    };

    if (currentStep) {
      await updateStep(currentStep.id, stepData);
    } else {
      const saved = await addStepToSequence(sequenceId, stepData);
      setCurrentStep(saved);
    }
  }, [sequenceId, boneTransforms, currentStep]);

  /** Add a new step after the current one, copying the current pose */
  const addNextStep = useCallback(async () => {
    const stepData: StepDataV2 = {
      version: 2,
      mainActor: {
        version: 2,
        boneTransforms: { ...boneTransforms },
        handPresets: {
          left: EMPTY_HANDPRESET,
          right: EMPTY_HANDPRESET,
        },
        rootPosition: { x: 0, y: 0, z: 0 },
        rootRotation: IDENTITY_QUAT,
      },
    };

    const saved = await addStepToSequence(sequenceId, stepData);
    setCurrentStep(saved);
  }, [sequenceId, boneTransforms]);

  // --- Technique actions ---

  const saveTechniqueFromSelection = useCallback(
    async (title: string) => {
      if (!selectedBodyGroup) return;

      const groupBones = FK_BODY_GROUPS[selectedBodyGroup];
      const filteredTransforms: BoneTransformMap = {};
      for (const bone of groupBones) {
        if (boneTransforms[bone]) {
          filteredTransforms[bone] = boneTransforms[bone];
        }
      }

      const techniqueData: TechniqueDataV2 = {
        version: 2,
        bodyGroup: selectedBodyGroup,
        boneTransforms: filteredTransforms,
      };

      await saveTechnique({
        title,
        bodyPart: selectedBodyGroup,
        techniqueData,
      });
    },
    [selectedBodyGroup, boneTransforms],
  );

  const saveAsStartingPosition = useCallback(
    async (title: string) => {
      const techniqueData: TechniqueDataV2 = {
        version: 2,
        bodyGroup: "fullbody",
        boneTransforms: { ...boneTransforms },
      };

      await saveTechnique({
        title,
        bodyPart: "fullbody",
        techniqueData,
      });
    },
    [boneTransforms],
  );

  const applyTechnique = useCallback((technique: Technique) => {
    const rawData = technique.techniqueData;
    const data = normalizeTechniqueData(rawData);

    if (data.boneTransforms) {
      setBoneTransforms((prev) => ({ ...prev, ...data.boneTransforms }));
    }
  }, []);

  // --- Pose manipulation ---

  const resetPose = useCallback(() => {
    setBoneTransforms({});
    setSelectedBone(null);
  }, []);

  /**
   * Mirror selected bone's transform to its counterpart on the opposite side.
   * Only the counterpart is updated - the selected bone is left untouched.
   * If no bone is selected, does nothing.
   */
  const mirrorSelectedToOpposite = useCallback(() => {
    if (!selectedBone) return;

    const targetBone = FK_MIRROR_MAP[selectedBone];
    if (!targetBone) return;

    setBoneTransforms((prev) => {
      const sourceTransform = prev[selectedBone];
      if (!sourceTransform) {
        const next = { ...prev };
        delete next[targetBone];
        return next;
      }

      const q = sourceTransform.rotation;
      return {
        ...prev,
        [targetBone]: {
          rotation: { x: -q.x, y: q.y, z: q.z, w: -q.w },
          position: sourceTransform.position
            ? {
                x: -sourceTransform.position.x,
                y: sourceTransform.position.y,
                z: sourceTransform.position.z,
              }
            : undefined,
        },
      };
    });
  }, [selectedBone]);

  return {
    boneTransforms,
    selectedBone,
    selectedBodyGroup,
    gizmoMode,
    partnerEnabled,
    currentStep,
    handleBoneRotationChange,
    handleBonePositionChange,
    handleRestPoseReady,
    setSelectedBone,
    setGizmoMode,
    handleDeselectAll,
    setPartnerEnabled,
    loadStep,
    saveCurrentStep,
    addNextStep,
    saveTechniqueFromSelection,
    saveAsStartingPosition,
    applyTechnique,
    resetPose,
    mirrorSelectedToOpposite,
  };
};
