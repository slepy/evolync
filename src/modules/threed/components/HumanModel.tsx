import React, {
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useGLTF } from "@react-three/drei/native";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type { GLTF } from "three-stdlib";
import { FKSystemManager } from "../utils/fkSystem";
import type { RestPoseData } from "../utils/fkSystem";
import type { BoneTransformMap } from "../types/fk";
import { threedScene } from "@/core/theme/tokens";

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
  ({ modelSlot, color = threedScene.model, boneTransforms, onRestPoseReady }, ref) => {
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
          // Lambert, not Standard (PBR): a matte body looks the same and costs
          // far less per pixel, most of all on the CPU-rendered simulator.
          child.material = new THREE.MeshLambertMaterial({
            color: new THREE.Color(color),
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
      setFkReady((n) => n + 1);

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

    // The canvas renders on demand: pose the skeleton when the transforms
    // change (or the FK system is ready), then ask for one frame.
    const invalidate = useThree((state) => state.invalidate);
    const [fkReady, setFkReady] = React.useState(0);
    useEffect(() => {
      if (!fkRef.current) return;
      fkRef.current.applyTransforms(boneTransforms);
      invalidate();
    }, [boneTransforms, fkReady, invalidate]);

    return (
      <group ref={groupRef} position={[modelSlot * 1.5, 0, 0]} rotation={[0, Math.PI, 0]}>
        <primitive object={clonedScene} />
      </group>
    );
  },
);
