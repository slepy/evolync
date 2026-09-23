import { useState, useCallback, useRef, useEffect } from "react";
import * as THREE from "three";

import type { Vec3, BoneTransformMap, Quat, AnyStepData, StepDataV2 } from "../types";
import { normalizeStepData } from "../utils/dataCompat";
import { useSequenceSteps } from "./useSequenceSteps";

const INTERPOLATION_DURATION = 500; // ms
const IDENTITY_QUAT: Quat = { x: 0, y: 0, z: 0, w: 1 };
const ZERO_VEC3: Vec3 = { x: 0, y: 0, z: 0 };

function lerpVec3(from: Vec3, to: Vec3, t: number): Vec3 {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
  };
}

function slerpQuat(from: Quat, to: Quat, t: number): Quat {
  const a = new THREE.Quaternion(from.x, from.y, from.z, from.w);
  const b = new THREE.Quaternion(to.x, to.y, to.z, to.w);
  const result = new THREE.Quaternion().slerpQuaternions(a, b, t);
  return { x: result.x, y: result.y, z: result.z, w: result.w };
}

function interpolateBoneTransforms(
  from: BoneTransformMap,
  to: BoneTransformMap,
  t: number,
): BoneTransformMap {
  const allBones = new Set([...Object.keys(from), ...Object.keys(to)]);
  const result: BoneTransformMap = {};

  for (const bone of allBones) {
    const fromT = from[bone];
    const toT = to[bone];

    const fromQ = fromT?.rotation ?? IDENTITY_QUAT;
    const toQ = toT?.rotation ?? IDENTITY_QUAT;

    result[bone] = {
      rotation: slerpQuat(fromQ, toQ, t),
    };

    if (fromT?.position || toT?.position) {
      const fp = fromT?.position ?? ZERO_VEC3;
      const tp = toT?.position ?? ZERO_VEC3;
      result[bone].position = lerpVec3(fp, tp, t);
    }
  }

  return result;
}

const EMPTY_STEP: StepDataV2 = {
  version: 2,
  mainActor: {
    version: 2,
    boneTransforms: {},
    handPresets: {
      left: { presetId: "", wristRotation: IDENTITY_QUAT },
      right: { presetId: "", wristRotation: IDENTITY_QUAT },
    },
    rootPosition: ZERO_VEC3,
    rootRotation: IDENTITY_QUAT,
  },
};

export const useSequenceViewer = (sequenceId: string) => {
  const { steps, isLoading } = useSequenceSteps(sequenceId);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayTransforms, setDisplayTransforms] =
    useState<BoneTransformMap>({});
  const [isInterpolating, setIsInterpolating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const normalizedSteps = useRef<StepDataV2[]>([]);

  // Normalize steps to V2 on load
  useEffect(() => {
    if (steps.length > 0) {
      normalizedSteps.current = steps.map((step) => {
        const raw = step.stepData as AnyStepData | null;
        if (!raw) return EMPTY_STEP;
        return normalizeStepData(raw);
      });

      // Set initial display from first step
      setDisplayTransforms(
        normalizedSteps.current[0].mainActor.boneTransforms,
      );
    }
  }, [steps]);

  const goToStep = useCallback(
    (targetIndex: number) => {
      if (
        targetIndex < 0 ||
        targetIndex >= normalizedSteps.current.length ||
        isInterpolating
      ) {
        return;
      }

      const fromData = normalizedSteps.current[currentStepIndex] ?? EMPTY_STEP;
      const toData = normalizedSteps.current[targetIndex] ?? EMPTY_STEP;

      setIsInterpolating(true);
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / INTERPOLATION_DURATION, 1);

        // Ease-in-out
        const easedProgress =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const interpolated = interpolateBoneTransforms(
          fromData.mainActor.boneTransforms,
          toData.mainActor.boneTransforms,
          easedProgress,
        );
        setDisplayTransforms(interpolated);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsInterpolating(false);
          setCurrentStepIndex(targetIndex);
          animationRef.current = null;
        }
      };

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      animate();
    },
    [currentStepIndex, isInterpolating],
  );

  const goToNextStep = useCallback(() => {
    goToStep(currentStepIndex + 1);
  }, [currentStepIndex, goToStep]);

  const goToPreviousStep = useCallback(() => {
    goToStep(currentStepIndex - 1);
  }, [currentStepIndex, goToStep]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    currentStepIndex,
    totalSteps: steps.length,
    displayTransforms,
    isInterpolating,
    isLoading,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
};
