import React, {
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useGLTF } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type { GLTF } from "three-stdlib";
import { FKSystemManager } from "../utils/fkSystem";
import type { RestPoseData } from "../utils/fkSystem";
import type { BoneTransformMap } from "../types/fk";

export interface HumanModelHandle {
  getBoneWorldPositions: () => Map<string, THREE.Vector3>;
  getBoneWorldPosition: (boneName: string) => THREE.Vector3 | null;
  getBoneWorldQuaternion: (boneName: string) => THREE.Quaternion | null;
  getBoneParentWorldQuaternion: (boneName: string) => THREE.Quaternion | null;
}

interface HumanModelProps {
  modelSlot: 0 | 1;
  color?: string;
  boneTransforms: BoneTransformMap;
  onRestPoseReady?: (restPose: RestPoseData) => void;
}

export const HumanModel = forwardRef<HumanModelHandle, HumanModelProps>(
  ({ modelSlot, color = "#4a90d9", boneTransforms, onRestPoseReady }, ref) => {
    const gltf = useGLTF(
      require("../../../../assets/models/character.glb"),
    ) as GLTF & { animations: THREE.AnimationClip[] };
    const { scene } = gltf;
    const groupRef = useRef<THREE.Group>(null);
    const fkRef = useRef<FKSystemManager | null>(null);

    const clonedScene = useMemo(() => {
      const clone = SkeletonUtils.clone(scene);
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            metalness: 0.1,
            roughness: 0.7,
          });
        }
      });
      return clone;
    }, [scene, color]);

    useEffect(() => {
      let skinnedMesh: THREE.SkinnedMesh | null = null;
      clonedScene.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh && !skinnedMesh) {
          skinnedMesh = child;
        }
      });

      if (!skinnedMesh) {
        console.warn("[HumanModel] No SkinnedMesh found in model");
        return;
      }

      const fk = new FKSystemManager();
      const restPose = fk.initialize(skinnedMesh);
      fkRef.current = fk;

      if (onRestPoseReady) {
        onRestPoseReady(restPose);
      }

      return () => {
        fk.dispose();
        fkRef.current = null;
      };
    }, [clonedScene]);

    useImperativeHandle(
      ref,
      () => ({
        getBoneWorldPositions: () =>
          fkRef.current?.getBoneWorldPositions() ?? new Map(),
        getBoneWorldPosition: (boneName: string) => {
          const positions = fkRef.current?.getBoneWorldPositions() ?? new Map();
          return positions.get(boneName) ?? null;
        },
        getBoneWorldQuaternion: (name: string) =>
          fkRef.current?.getBoneWorldQuaternion(name) ?? null,
        getBoneParentWorldQuaternion: (name: string) =>
          fkRef.current?.getBoneParentWorldQuaternion(name) ?? null,
      }),
      [],
    );

    useFrame(() => {
      if (!fkRef.current) return;
      fkRef.current.applyTransforms(boneTransforms);
    });

    return (
      <group ref={groupRef} position={[modelSlot * 1.5, 0, 0]} rotation={[0, Math.PI, 0]}>
        <primitive object={clonedScene} />
      </group>
    );
  },
);
