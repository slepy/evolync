import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FK_BONES, FK_BODY_GROUPS } from "../types/fk";
import type { FKBoneName } from "../types/fk";
import type { HumanModelHandle } from "./HumanModel";
import { BoneMarker } from "./BoneMarker";

// Finger bones are edited in the hand editor (HandEditorPanel) — exclude them from the 3D marker layer
// so the scene stays readable. DEF-handL / DEF-handR remain as entry points.
const FINGER_BONES = new Set<string>([
  ...FK_BODY_GROUPS.leftHand,
  ...FK_BODY_GROUPS.rightHand,
]);

const MARKER_BONES = FK_BONES.filter((b) => !FINGER_BONES.has(b));

/** Markers move only when a joint moves more than this (meters); camera turns move none. */
const EPSILON = 1e-4;

function samePositions(a: Map<string, THREE.Vector3>, b: Map<string, THREE.Vector3>): boolean {
  if (a.size !== b.size) return false;
  for (const [name, pos] of a) {
    const other = b.get(name);
    if (!other || other.distanceToSquared(pos) > EPSILON * EPSILON) return false;
  }
  return true;
}

interface BoneMarkerGroupProps {
  humanRef: React.RefObject<HumanModelHandle | null>;
  selectedBone: FKBoneName | null;
  onSelectBone: (name: FKBoneName) => void;
}

export const BoneMarkerGroup: React.FC<BoneMarkerGroupProps> = ({
  humanRef,
  selectedBone,
  onSelectBone,
}) => {
  const [positions, setPositions] = useState<Map<string, THREE.Vector3>>(() => new Map());
  const latest = useRef(positions);

  // Runs only on rendered frames (the canvas draws on demand). React re-renders
  // the markers only when a joint actually moved, not on every frame.
  useFrame(({ scene }) => {
    if (!humanRef.current) return;
    scene.updateMatrixWorld();
    const next = humanRef.current.getBoneWorldPositions();
    if (samePositions(latest.current, next)) return;
    latest.current = next;
    setPositions(next);
  });

  return (
    <group>
      {MARKER_BONES.map((boneName) => {
        const worldPos = positions.get(boneName);
        if (!worldPos) return null;

        const isSelected = selectedBone === boneName;
        if (selectedBone !== null && !isSelected) return null;

        return (
          <BoneMarker
            key={boneName}
            boneName={boneName}
            worldPosition={worldPos}
            isSelected={isSelected}
            onSelect={onSelectBone}
          />
        );
      })}
    </group>
  );
};
