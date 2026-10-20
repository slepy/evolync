import React from "react";
import { threedScene } from "@/core/theme/tokens";
import { Arrow } from "./AxisArrow";

const COLOR_X = threedScene.axisX;

const COLOR_Y = threedScene.axisY;

const COLOR_Z = threedScene.axisZ;

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
