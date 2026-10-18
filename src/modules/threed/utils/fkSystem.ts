import * as THREE from "three";
import { FK_BONES } from "../types/fk";
import type { BoneTransformMap } from "../types/fk";

export interface RestPoseData {
  quaternions: Map<string, THREE.Quaternion>;
  positions: Map<string, THREE.Vector3>;
}

export interface FKDebugInfo {
  allBoneNames: string[];
  foundBones: string[];
  missingBones: string[];
}

/**
 * Fallback bone name alternatives.
 * The character-reference.md documents DEF- prefix names, but the actual
 * character.glb may use Mixamo/ReadyPlayerMe naming conventions.
 * We try DEF- first, then fall back to alternatives.
 */
const BONE_NAME_ALTERNATIVES: Record<string, string[]> = {
  "DEF-hips": ["Hips", "mixamorigHips"],
  "DEF-spine001": ["Spine", "mixamorigSpine", "DEF-spine.001"],
  "DEF-spine002": ["Spine1", "mixamorigSpine1", "DEF-spine.002"],
  "DEF-spine003": ["Spine2", "mixamorigSpine2", "DEF-spine.003"],
  "DEF-neck": ["Neck", "mixamorigNeck"],
  "DEF-head": ["Head", "mixamorigHead"],
  "DEF-shoulderL": ["LeftShoulder", "mixamorigLeftShoulder", "DEF-shoulder.L"],
  "DEF-upper_armL": ["LeftArm", "mixamorigLeftArm", "DEF-upper_arm.L"],
  "DEF-forearmL": ["LeftForeArm", "mixamorigLeftForeArm", "DEF-forearm.L"],
  "DEF-handL": ["LeftHand", "mixamorigLeftHand", "DEF-hand.L"],
  "DEF-shoulderR": [
    "RightShoulder",
    "mixamorigRightShoulder",
    "DEF-shoulder.R",
  ],
  "DEF-upper_armR": ["RightArm", "mixamorigRightArm", "DEF-upper_arm.R"],
  "DEF-forearmR": ["RightForeArm", "mixamorigRightForeArm", "DEF-forearm.R"],
  "DEF-handR": ["RightHand", "mixamorigRightHand", "DEF-hand.R"],
  "DEF-thighL": ["LeftUpLeg", "mixamorigLeftUpLeg", "DEF-thigh.L"],
  "DEF-shinL": ["LeftLeg", "mixamorigLeftLeg", "DEF-shin.L"],
  "DEF-footL": ["LeftFoot", "mixamorigLeftFoot", "DEF-foot.L"],
  "DEF-toeL": ["LeftToeBase", "mixamorigLeftToeBase", "DEF-toe.L"],
  "DEF-thighR": ["RightUpLeg", "mixamorigRightUpLeg", "DEF-thigh.R"],
  "DEF-shinR": ["RightLeg", "mixamorigRightLeg", "DEF-shin.R"],
  "DEF-footR": ["RightFoot", "mixamorigRightFoot", "DEF-foot.R"],
  "DEF-toeR": ["RightToeBase", "mixamorigRightToeBase", "DEF-toe.R"],
};

const I_POSE_TARGETS: Record<string, "down" | "foot" | "side_l" | "side_r"> = {
  // shoulders stay at bindpose — only the arm bones below are corrected
  "DEF-upper_armL": "side_l",
  "DEF-forearmL": "side_l",
  "DEF-upper_armR": "side_r",
  "DEF-forearmR": "side_r",
  "DEF-thighL": "down",
  "DEF-shinL": "down",
  "DEF-footL": "foot",
  "DEF-thighR": "down",
  "DEF-shinR": "down",
  "DEF-footR": "foot",
};

export class FKSystemManager {
  private skeleton: THREE.Skeleton | null = null;
  private restPose: RestPoseData | null = null;
  private boneMap: Map<string, THREE.Bone> = new Map();

  private debugInfo: FKDebugInfo = {
    allBoneNames: [],
    foundBones: [],
    missingBones: [],
  };

  getDebugInfo(): FKDebugInfo {
    return this.debugInfo;
  }

  /**
   * Initialize from SkinnedMesh. Also traverses the full scene graph
   * to find bones that may not be listed in skeleton.bones.
   *
   */
  initialize(skinnedMesh: THREE.SkinnedMesh): RestPoseData {
    this.skeleton = skinnedMesh.skeleton;
    this.restPose = { quaternions: new Map(), positions: new Map() };
    this.boneMap = new Map();

    // Build lookup from skeleton.bones
    const bonesByName = new Map<string, THREE.Bone>();
    for (const bone of this.skeleton.bones) {
      bonesByName.set(bone.name, bone);
    }

    // Also traverse the scene graph from the root to find ALL bones
    // (skeleton.bones may only include bones that affect skin weights)
    let rootObject: THREE.Object3D = skinnedMesh;
    while (rootObject.parent) {
      rootObject = rootObject.parent;
    }
    rootObject.traverse((child) => {
      if (!bonesByName.has(child.name)) {
        // Accept nodes with isBone flag OR DEF- prefix names (Blender Rigify
        // exports may produce Object3D nodes without isBone for some bones)
        if ((child as THREE.Bone).isBone || child.name.startsWith("DEF-")) {
          bonesByName.set(child.name, child as THREE.Bone);
        }
      }
    });

    // Second pass: traverse from the armature root (first skeleton bone's ancestor)
    // to catch bones that may be siblings not reachable from the SkinnedMesh root
    const anyBone = this.skeleton.bones[0];
    if (anyBone) {
      let armatureRoot: THREE.Object3D = anyBone;
      while (armatureRoot.parent && armatureRoot.parent.type !== "Scene") {
        armatureRoot = armatureRoot.parent;
      }
      armatureRoot.traverse((child) => {
        if (!bonesByName.has(child.name)) {
          const isExpectedBone =
            (FK_BONES as readonly string[]).includes(child.name) ||
            Object.values(BONE_NAME_ALTERNATIVES).some((alts) =>
              alts.includes(child.name),
            );
          if (isExpectedBone || child.name.startsWith("DEF-")) {
            bonesByName.set(child.name, child as THREE.Bone);
          }
        }
      });
    }

    // Log all bone names for debugging
    const allNames = Array.from(bonesByName.keys()).sort();
    console.log(
      `[FKSystem] All bones in scene (${allNames.length}):`,
      allNames,
    );

    // For each FK bone, try canonical DEF- name, then alternatives, then fuzzy
    for (const fkName of FK_BONES) {
      let bone = bonesByName.get(fkName);

      if (!bone) {
        const alternatives = BONE_NAME_ALTERNATIVES[fkName];
        if (alternatives) {
          for (const alt of alternatives) {
            bone = bonesByName.get(alt);
            if (bone) {
              console.log(
                `[FKSystem] "${fkName}" not found, using "${alt}" instead`,
              );
              break;
            }
          }
        }
      }

      // Last resort: case-insensitive match
      if (!bone) {
        const alternatives = BONE_NAME_ALTERNATIVES[fkName];
        if (alternatives) {
          for (const [skelName, skelBone] of bonesByName) {
            const skelLower = skelName.toLowerCase();
            for (const alt of alternatives) {
              if (
                skelLower === alt.toLowerCase() ||
                skelLower.includes(alt.toLowerCase())
              ) {
                bone = skelBone;
                console.log(
                  `[FKSystem] "${fkName}" fuzzy matched to "${skelName}"`,
                );
                break;
              }
            }
            if (bone) break;
          }
        }
      }

      if (bone) {
        this.boneMap.set(fkName, bone);
        // Store bindpose first; I-pose is computed below after all bones are mapped
        this.restPose.quaternions.set(fkName, bone.quaternion.clone());
        this.restPose.positions.set(fkName, bone.position.clone());
      }
    }

    // Compute I-pose (attention stance) at runtime using the live Three.js bone
    // world quaternions — this correctly handles left/right asymmetry because
    // Three.js has already built the real bone hierarchy with proper positions.
    //
    // Strategy: walk I_POSE_TARGETS in FK_BONES order (parent before child).
    // For each bone, get its parent's CURRENT world quaternion (already updated
    // by any earlier bones in the chain), then solve for the local Q that makes
    // the bone's +Y point in the desired world direction.
    const DOWN = new THREE.Vector3(0, -1, 0);
    // Foot target: 45° od pionu w przód (złoty środek między poziomem a pionem)
    const FOOT = new THREE.Vector3(0, -0.5, 1).normalize();

    for (const fkName of FK_BONES) {
      const target = I_POSE_TARGETS[fkName];
      if (!target) continue;

      const bone = this.boneMap.get(fkName);
      if (!bone) continue;

      const targetDir = target === "foot" ? FOOT : DOWN;

      // Parent world quaternion (already reflects any I-pose applied to ancestors)
      const parentWorldQ = new THREE.Quaternion();
      if (bone.parent) {
        bone.parent.getWorldQuaternion(parentWorldQ);
      }

      // Solve: local Q such that parentWorldQ * localQ applied to +Y = targetDir
      const invParent = parentWorldQ.clone().invert();
      const localTarget = targetDir
        .clone()
        .applyQuaternion(invParent)
        .normalize();
      const localQ = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        localTarget,
      );

      bone.quaternion.copy(localQ);
      this.restPose.quaternions.set(fkName, localQ.clone());
    }

    const found = this.boneMap.size;
    const expected = FK_BONES.length;
    const missing = FK_BONES.filter((name) => !this.boneMap.has(name));
    const foundNames = FK_BONES.filter((name) => this.boneMap.has(name));

    this.debugInfo = {
      allBoneNames: allNames,
      foundBones: [...foundNames],
      missingBones: [...missing],
    };

    if (found < expected) {
      console.warn(
        `[FKSystem] Only found ${found}/${expected} FK bones. Missing:`,
        missing,
      );
    } else {
      console.log(`[FKSystem] All ${expected} FK bones found.`);
    }

    return this.restPose;
  }

  /**
   * Apply FK transforms each frame.
   * For each bone: bone.quaternion = restQ * deltaQ
   *                bone.position   = restP + deltaP
   */
  applyTransforms(transforms: BoneTransformMap): void {
    if (!this.restPose || !this.skeleton) return;

    const tmpQ = new THREE.Quaternion();

    for (const boneName of FK_BONES) {
      const bone = this.boneMap.get(boneName);
      if (!bone) continue;

      const restQ = this.restPose.quaternions.get(boneName)!;
      const restP = this.restPose.positions.get(boneName)!;

      const transform = transforms[boneName];
      if (transform) {
        // Apply rotation: restQ * deltaQ
        tmpQ.set(
          transform.rotation.x,
          transform.rotation.y,
          transform.rotation.z,
          transform.rotation.w,
        );
        bone.quaternion.copy(restQ).multiply(tmpQ);

        // Apply position offset
        if (transform.position) {
          bone.position.set(
            restP.x + transform.position.x,
            restP.y + transform.position.y,
            restP.z + transform.position.z,
          );
        } else {
          bone.position.copy(restP);
        }
      } else {
        // No transform override: restore to rest pose
        bone.quaternion.copy(restQ);
        bone.position.copy(restP);
      }
    }
  }

  /**
   * World positions of all FK bones (for marker placement), read from the
   * bones' world matrices. Call `scene.updateMatrixWorld()` first when the
   * pose just changed; this no longer walks each bone's parents itself.
   */
  getBoneWorldPositions(): Map<string, THREE.Vector3> {
    const positions = new Map<string, THREE.Vector3>();
    for (const [name, bone] of this.boneMap) {
      positions.set(name, new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld));
    }
    return positions;
  }

  /** Get a single bone's world quaternion (for gizmo alignment). */
  getBoneWorldQuaternion(boneName: string): THREE.Quaternion | null {
    const bone = this.boneMap.get(boneName);
    if (!bone) return null;
    const worldQ = new THREE.Quaternion();
    bone.getWorldQuaternion(worldQ);
    return worldQ;
  }

  /** Get a bone's parent world quaternion (for local-space gizmo). */
  getBoneParentWorldQuaternion(boneName: string): THREE.Quaternion | null {
    const bone = this.boneMap.get(boneName);
    if (!bone || !bone.parent) return null;
    const worldQ = new THREE.Quaternion();
    bone.parent.getWorldQuaternion(worldQ);
    return worldQ;
  }

  dispose() {
    this.skeleton = null;
    this.restPose = null;
    this.boneMap.clear();
  }
}
