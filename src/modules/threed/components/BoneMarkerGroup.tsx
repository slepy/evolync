import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FK_BONES, FK_BODY_GROUPS } from "../types/fk";
import type { FKBoneName } from "../types/fk";
import type { HumanModelHandle } from "./HumanModel";
import { BoneMarker } from "./BoneMarker";

// Finger bones are edited via HandEditorTab — exclude them from the 3D marker layer
// so the scene stays readable. DEF-handL / DEF-handR remain as entry points.
const FINGER_BONES = new Set<string>([
  ...FK_BODY_GROUPS.leftHand,
  ...FK_BODY_GROUPS.rightHand,
]);

const MARKER_BONES = FK_BONES.filter((b) => !FINGER_BONES.has(b));

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
  // Store bone world positions in a ref (updated each frame, no React re-render)
  const positionsRef = useRef<Map<string, THREE.Vector3>>(new Map());
  // Force re-render counter to update marker positions visually
  const [, setTick] = React.useState(0);
  const frameCounter = useRef(0);

  useFrame(() => {
    if (!humanRef.current) return;

    const positions = humanRef.current.getBoneWorldPositions();
    positionsRef.current = positions;

    // Trigger React re-render every 2 frames (~30fps for marker positions)
    frameCounter.current++;
    if (frameCounter.current % 2 === 0) {
      setTick((t) => t + 1);
    }
  });

  const positions = positionsRef.current;

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
