import * as THREE from "three";
import { CCDIKSolver } from "three/examples/jsm/animation/CCDIKSolver.js";

// =============================================================================
// IK chain configs for every FK bone
//
// Each bone is an end-effector. The linkBones list contains the ancestor bones
// that the solver is allowed to rotate in order to reach the target.
// Bone names are Mixamo/ReadyPlayerMe names (as found in character.glb).
// =============================================================================

export interface IKChainConfig {
  targetName: string;      // key used in ikTargets state (= DEF- FK name)
  effectorBone: string;    // actual bone name in skeleton
  linkBones: string[];     // ancestor bones allowed to rotate (nearest first)
  iterations: number;
}

/**
 * Full-body IK chains — one per FK bone.
 * linkBones: ancestor chain up to hips (solver can rotate these bones).
 */
export const IK_CHAINS_ALL: IKChainConfig[] = [
  // Spine chain
  { targetName: "DEF-hips",     effectorBone: "Hips",   linkBones: [],                                            iterations: 1 },
  { targetName: "DEF-spine001", effectorBone: "Spine",  linkBones: ["Hips"],                                      iterations: 4 },
  { targetName: "DEF-spine002", effectorBone: "Spine1", linkBones: ["Spine","Hips"],                              iterations: 4 },
  { targetName: "DEF-spine003", effectorBone: "Spine2", linkBones: ["Spine1","Spine","Hips"],                     iterations: 4 },
  { targetName: "DEF-neck",     effectorBone: "Neck",   linkBones: ["Spine2","Spine1","Spine","Hips"],            iterations: 4 },
  { targetName: "DEF-head",     effectorBone: "Head",   linkBones: ["Neck","Spine2","Spine1","Spine","Hips"],     iterations: 4 },

  // Left arm
  { targetName: "DEF-shoulderL", effectorBone: "LeftShoulder", linkBones: ["Spine2","Spine1","Spine","Hips"],                             iterations: 4 },
  { targetName: "DEF-upper_armL",effectorBone: "LeftArm",      linkBones: ["LeftShoulder","Spine2","Spine1","Spine","Hips"],              iterations: 6 },
  { targetName: "DEF-forearmL",  effectorBone: "LeftForeArm",  linkBones: ["LeftArm","LeftShoulder","Spine2","Spine1","Spine","Hips"],    iterations: 8 },
  { targetName: "DEF-handL",     effectorBone: "LeftHand",     linkBones: ["LeftForeArm","LeftArm","LeftShoulder","Spine2","Spine1","Spine","Hips"], iterations: 10 },

  // Right arm
  { targetName: "DEF-shoulderR", effectorBone: "RightShoulder", linkBones: ["Spine2","Spine1","Spine","Hips"],                              iterations: 4 },
  { targetName: "DEF-upper_armR",effectorBone: "RightArm",      linkBones: ["RightShoulder","Spine2","Spine1","Spine","Hips"],             iterations: 6 },
  { targetName: "DEF-forearmR",  effectorBone: "RightForeArm",  linkBones: ["RightArm","RightShoulder","Spine2","Spine1","Spine","Hips"],  iterations: 8 },
  { targetName: "DEF-handR",     effectorBone: "RightHand",     linkBones: ["RightForeArm","RightArm","RightShoulder","Spine2","Spine1","Spine","Hips"], iterations: 10 },

  // Left leg
  { targetName: "DEF-thighL", effectorBone: "LeftUpLeg",   linkBones: ["Hips"],                               iterations: 4 },
  { targetName: "DEF-shinL",  effectorBone: "LeftLeg",     linkBones: ["LeftUpLeg","Hips"],                   iterations: 6 },
  { targetName: "DEF-footL",  effectorBone: "LeftFoot",    linkBones: ["LeftLeg","LeftUpLeg","Hips"],         iterations: 8 },
  { targetName: "DEF-toeL",   effectorBone: "LeftToeBase", linkBones: ["LeftFoot","LeftLeg","LeftUpLeg","Hips"], iterations: 10 },

  // Right leg
  { targetName: "DEF-thighR", effectorBone: "RightUpLeg",   linkBones: ["Hips"],                                iterations: 4 },
  { targetName: "DEF-shinR",  effectorBone: "RightLeg",     linkBones: ["RightUpLeg","Hips"],                   iterations: 6 },
  { targetName: "DEF-footR",  effectorBone: "RightFoot",    linkBones: ["RightLeg","RightUpLeg","Hips"],        iterations: 8 },
  { targetName: "DEF-toeR",   effectorBone: "RightToeBase", linkBones: ["RightFoot","RightLeg","RightUpLeg","Hips"], iterations: 10 },
];

function findBoneIndex(skeleton: THREE.Skeleton, boneName: string): number {
  return skeleton.bones.findIndex((b) => b.name === boneName);
}

export class IKSystemManager {
  private solver: CCDIKSolver | null = null;
  private targets: Map<string, THREE.Bone> = new Map();
  private mesh: THREE.SkinnedMesh | null = null;

  initialize(skinnedMesh: THREE.SkinnedMesh) {
    this.mesh = skinnedMesh;
    const skeleton = skinnedMesh.skeleton;
    if (!skeleton) return;

    const iks: Array<{
      target: number;
      effector: number;
      links: Array<{ index: number }>;
      iteration: number;
    }> = [];

    // Update world matrices so getWorldPosition works correctly
    skinnedMesh.updateMatrixWorld(true);

    for (const chain of IK_CHAINS_ALL) {
      // Hips: no solver needed, we move directly
      if (chain.targetName === "DEF-hips") {
        // Still create a target marker so callers can read/write position
        const hipsBone = skeleton.bones.find((b) => b.name === "Hips");
        if (hipsBone) this.targets.set(chain.targetName, hipsBone);
        continue;
      }

      const effectorIndex = findBoneIndex(skeleton, chain.effectorBone);
      if (effectorIndex === -1) continue;

      // Create a target bone positioned at the effector's world position
      const effectorBone = skeleton.bones[effectorIndex];
      const worldPos = new THREE.Vector3();
      effectorBone.getWorldPosition(worldPos);

      const targetBone = new THREE.Bone();
      targetBone.name = `IKTarget_${chain.targetName}`;
      targetBone.position.copy(worldPos);

      skinnedMesh.add(targetBone);
      skeleton.bones.push(targetBone);
      skeleton.boneInverses.push(new THREE.Matrix4());

      const targetIndex = skeleton.bones.length - 1;
      this.targets.set(chain.targetName, targetBone);

      const links = chain.linkBones
        .map((name) => findBoneIndex(skeleton, name))
        .filter((i) => i !== -1)
        .map((i) => ({ index: i }));

      iks.push({ target: targetIndex, effector: effectorIndex, links, iteration: chain.iterations });
    }

    if (iks.length > 0) {
      this.solver = new CCDIKSolver(skinnedMesh, iks);
    }
  }

  /**
   * Move an IK target to a world-space position.
   * The caller must pass world-space coords (same as what getBoneWorldPositions returns).
   */
  setTargetWorldPosition(targetName: string, worldPos: THREE.Vector3) {
    if (targetName === "DEF-hips") {
      // Hips: move bone directly in local space of its parent
      const hipsBone = this.targets.get("DEF-hips");
      if (hipsBone && hipsBone.parent) {
        const localPos = hipsBone.parent.worldToLocal(worldPos.clone());
        hipsBone.position.copy(localPos);
      }
      return;
    }

    const target = this.targets.get(targetName);
    if (target) {
      // targetBone is a child of skinnedMesh — convert world → local
      if (this.mesh) {
        const localPos = this.mesh.worldToLocal(worldPos.clone());
        target.position.copy(localPos);
      } else {
        target.position.copy(worldPos);
      }
    }
  }

  /**
   * Returns the current world-space position of a target.
   */
  getTargetWorldPosition(targetName: string): THREE.Vector3 | null {
    const target = this.targets.get(targetName);
    if (!target) return null;
    const worldPos = new THREE.Vector3();
    target.getWorldPosition(worldPos);
    return worldPos;
  }

  update() {
    if (this.solver) {
      this.solver.update();
    }
  }

  dispose() {
    this.targets.forEach((target, name) => {
      if (name !== "DEF-hips") target.removeFromParent();
    });
    this.targets.clear();
    this.solver = null;
    this.mesh = null;
  }
}
