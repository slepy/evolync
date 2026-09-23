import React, { useMemo } from "react";
import * as THREE from "three";

// Colors from tamagui.config.ts
const COLOR_X = "#DC2626"; // imperialRed — X axis
const COLOR_Y = "#059669"; // jadeGreen   — Y axis
const COLOR_Z = "#1E40AF"; // darkBlue    — Z axis

const SHAFT_RADIUS = 0.012;
const SHAFT_LENGTH = 0.35;
const HEAD_RADIUS = 0.028;
const HEAD_LENGTH = 0.08;

// =============================================================================
// Arrow
// =============================================================================

interface ArrowProps {
  color: string;
  rotation: [number, number, number];
  label: string;
}

const Arrow: React.FC<ArrowProps> = ({ color, rotation }) => {
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

interface AxisGizmoProps {
  /** World-space position of the gizmo origin (default: scene floor) */
  position?: [number, number, number];
}

/**
 * Renders three arrows showing the X (red), Y (green), Z (blue) world axes.
 * Arrows use depthTest:false so they are always visible on top of the model.
 */
export const AxisGizmo: React.FC<AxisGizmoProps> = ({
  position = [-0.6, 0.01, -0.6],
}) => {
  return (
    <group position={position}>
      {/* X axis — rotate +Y arrow 90° around -Z so it points along +X */}
      <Arrow color={COLOR_X} rotation={[0, 0, -Math.PI / 2]} label="X" />
      {/* Y axis — default +Y direction */}
      <Arrow color={COLOR_Y} rotation={[0, 0, 0]} label="Y" />
      {/* Z axis — rotate +Y arrow 90° around +X so it points along +Z */}
      <Arrow color={COLOR_Z} rotation={[Math.PI / 2, 0, 0]} label="Z" />
    </group>
  );
};
