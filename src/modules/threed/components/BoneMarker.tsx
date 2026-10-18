import React, { useMemo } from "react";
import * as THREE from "three";
import type { FKBoneName } from "../types/fk";
import { threedScene } from "@/core/theme/tokens";

interface BoneMarkerProps {
  boneName: FKBoneName;
  worldPosition: THREE.Vector3;
  isSelected: boolean;
  onSelect: (name: FKBoneName) => void;
}

const RADIUS_DEFAULT = 0.055;
const RADIUS_SELECTED = 0.08;

export const BoneMarker: React.FC<BoneMarkerProps> = ({
  boneName,
  worldPosition,
  isSelected,
  onSelect,
}) => {
  const geometry = useMemo(
    () => new THREE.SphereGeometry(1, 8, 8),
    [],
  );

  const handlePointerDown = (e: any) => {
    e.stopPropagation?.();
    onSelect(boneName);
  };

  const radius = isSelected ? RADIUS_SELECTED : RADIUS_DEFAULT;

  return (
    <mesh
      position={worldPosition}
      scale={[radius, radius, radius]}
      geometry={geometry}
      onPointerDown={handlePointerDown}
      renderOrder={999}
    >
      <meshBasicMaterial
        color={threedScene.marker}
        transparent
        opacity={isSelected ? 1 : 0.55}
        depthTest={false}
      />
    </mesh>
  );
};
