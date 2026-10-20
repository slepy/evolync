import React, { useMemo } from "react";
import * as THREE from "three";

const SHAFT_RADIUS = 0.012;

const SHAFT_LENGTH = 0.35;

const HEAD_RADIUS = 0.028;

const HEAD_LENGTH = 0.08;

// =============================================================================
// Arrow
// =============================================================================

export interface ArrowProps {
  color: string;
  rotation: [number, number, number];
  label: string;
}

export const Arrow: React.FC<ArrowProps> = ({ color, rotation }) => {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        depthTest: false,
      }),
    [color],
  );

  const shaftGeo = useMemo(
    () =>
      new THREE.CylinderGeometry(SHAFT_RADIUS, SHAFT_RADIUS, SHAFT_LENGTH, 8),
    [],
  );

  const headGeo = useMemo(
    () => new THREE.ConeGeometry(HEAD_RADIUS, HEAD_LENGTH, 8),
    [],
  );

  const shaftY = SHAFT_LENGTH / 2;
  const headY = SHAFT_LENGTH + HEAD_LENGTH / 2;

  return (
    <group rotation={rotation} renderOrder={999}>
      <mesh
        geometry={shaftGeo}
        material={mat}
        position={[0, shaftY, 0]}
        renderOrder={999}
      />
      <mesh
        geometry={headGeo}
        material={mat}
        position={[0, headY, 0]}
        renderOrder={999}
      />
    </group>
  );
};

// =============================================================================
// AxisGizmo
// =============================================================================
