import React, { useState, useMemo, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { GizmoMode } from "../types/fk";
import type { Quat, Vec3 } from "../types/data";

// =============================================================================
// Shared drag state — the invisible DragPlane reads this to compute moves
// =============================================================================

export interface DragState {
  active: boolean;
  mode: "rotate" | "translate";
  boneName: string;
  // Rotation-specific
  axis: THREE.Vector3; // local-space rotation axis
  worldAxis: THREE.Vector3;
  parentWorldQuatInverse: THREE.Quaternion; // to convert world→local
  dragStartAngle: number;
  dragStartQuat: THREE.Quaternion;
  boneWorldPosition: THREE.Vector3;
  plane: THREE.Plane;
  // Translation-specific
  dragOffset: THREE.Vector3;
  restWorldPos: THREE.Vector3;
  // Callbacks
  onRotationChange: ((boneName: string, quat: Quat) => void) | null;
  onPositionChange: ((boneName: string, pos: Vec3) => void) | null;
}

export function createDragState(): DragState {
  return {
    active: false,
    mode: "rotate",
    boneName: "",
    axis: new THREE.Vector3(),
    worldAxis: new THREE.Vector3(),
    parentWorldQuatInverse: new THREE.Quaternion(),
    dragStartAngle: 0,
    dragStartQuat: new THREE.Quaternion(),
    boneWorldPosition: new THREE.Vector3(),
    plane: new THREE.Plane(),
    dragOffset: new THREE.Vector3(),
    restWorldPos: new THREE.Vector3(),
    onRotationChange: null,
    onPositionChange: null,
  };
}

// =============================================================================
// DragPlane — invisible full-screen plane that captures pointer during drag
// =============================================================================

interface DragPlaneProps {
  dragStateRef: React.MutableRefObject<DragState>;
  onDragEnd: () => void;
}

export const DragPlane: React.FC<DragPlaneProps> = ({
  dragStateRef,
  onDragEnd,
}) => {
  const getPlaneIntersection = useCallback(
    (e: any): THREE.Vector3 | null => {
      // R3F provides the ray directly in the event
      if (e.ray) {
        const result = new THREE.Vector3();
        const hit = e.ray.intersectPlane(dragStateRef.current.plane, result);
        return hit ? result : null;
      }
      return null;
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: any) => {
      const ds = dragStateRef.current;
      if (!ds.active) return;
      e.stopPropagation?.();

      const intersection = getPlaneIntersection(e);
      if (!intersection) return;

      if (ds.mode === "rotate" && ds.onRotationChange) {
        const currentAngle = computeAngleOnPlane(
          intersection,
          ds.boneWorldPosition,
          ds.worldAxis,
        );
        // Normalize to [-π, π] to avoid direction flip when crossing the ±π boundary
        let rawDelta = currentAngle - ds.dragStartAngle;
        while (rawDelta > Math.PI) rawDelta -= 2 * Math.PI;
        while (rawDelta < -Math.PI) rawDelta += 2 * Math.PI;
        const angleDelta = rawDelta * ROTATION_SENSITIVITY;

        // Build world-space rotation around worldAxis
        const worldRotation = new THREE.Quaternion().setFromAxisAngle(
          ds.worldAxis,
          angleDelta,
        );
        // Convert world-space rotation to local (bone parent) space:
        // localDelta = parentInv * worldRotation * parent
        const parentInv = ds.parentWorldQuatInverse;
        const parent = parentInv.clone().invert();
        const localAxisRotation = parentInv
          .clone()
          .multiply(worldRotation)
          .multiply(parent);

        // Compose with the rotation at drag start
        const newDelta = localAxisRotation.multiply(ds.dragStartQuat);

        ds.onRotationChange(ds.boneName, {
          x: newDelta.x,
          y: newDelta.y,
          z: newDelta.z,
          w: newDelta.w,
        });
      } else if (ds.mode === "translate" && ds.onPositionChange) {
        const newWorldPos = intersection.add(ds.dragOffset);
        const rawDelta = newWorldPos.clone().sub(ds.restWorldPos);
        // Dampen translation to prevent extreme deformations
        const delta = rawDelta.multiplyScalar(TRANSLATION_SENSITIVITY);

        ds.onPositionChange(ds.boneName, {
          x: delta.x,
          y: delta.y,
          z: delta.z,
        });
      }
    },
    [getPlaneIntersection],
  );

  const handlePointerUp = useCallback(
    (e: any) => {
      e.stopPropagation?.();
      onDragEnd();
    },
    [onDragEnd],
  );

  // Always rendered to avoid React state delay; pointer handlers check ds.active
  return (
    <mesh
      renderOrder={998}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        visible={false}
        side={THREE.DoubleSide}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

// =============================================================================
// BoneGizmo — main export
// =============================================================================

interface BoneGizmoProps {
  boneName: string;
  boneWorldPosition: THREE.Vector3;
  boneParentWorldQuaternion: THREE.Quaternion;
  currentRotation: Quat;
  mode: GizmoMode;
  dragStateRef: React.MutableRefObject<DragState>;
  onRotationChange: (boneName: string, newDeltaQuat: Quat) => void;
  onPositionChange: (boneName: string, newDeltaPos: Vec3) => void;
  onDragStart: () => void;
}

// Generous sizes for mobile touch interaction
const RING_RADIUS = 0.25;
const RING_TUBE = 0.045;
const TRANSLATE_SPHERE_RADIUS = 0.15;

// Sensitivity factors — higher values = more responsive on mobile
const ROTATION_SENSITIVITY = 0.6;
const TRANSLATION_SENSITIVITY = 0.5;

// Ring axis definitions in local space
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);

const RING_CONFIGS = [
  {
    axis: AXIS_X,
    color: "#ff4444",
    rotation: new THREE.Euler(0, 0, Math.PI / 2),
  },
  { axis: AXIS_Y, color: "#44ff44", rotation: new THREE.Euler(0, 0, 0) },
  {
    axis: AXIS_Z,
    color: "#4444ff",
    rotation: new THREE.Euler(Math.PI / 2, 0, 0),
  },
] as const;

export const BoneGizmo: React.FC<BoneGizmoProps> = ({
  boneName,
  boneWorldPosition,
  boneParentWorldQuaternion,
  currentRotation,
  mode,
  dragStateRef,
  onRotationChange,
  onPositionChange,
  onDragStart,
}) => {
  if (mode === "rotate") {
    return (
      <RotationGizmo
        boneName={boneName}
        boneWorldPosition={boneWorldPosition}
        boneParentWorldQuaternion={boneParentWorldQuaternion}
        currentRotation={currentRotation}
        dragStateRef={dragStateRef}
        onRotationChange={onRotationChange}
        onDragStart={onDragStart}
      />
    );
  }

  return (
    <TranslationGizmo
      boneName={boneName}
      boneWorldPosition={boneWorldPosition}
      dragStateRef={dragStateRef}
      onPositionChange={onPositionChange}
      onDragStart={onDragStart}
    />
  );
};

// =============================================================================
// Rotation Gizmo (3 axis rings)
// =============================================================================

interface RotationGizmoProps {
  boneName: string;
  boneWorldPosition: THREE.Vector3;
  boneParentWorldQuaternion: THREE.Quaternion;
  currentRotation: Quat;
  dragStateRef: React.MutableRefObject<DragState>;
  onRotationChange: (boneName: string, newDeltaQuat: Quat) => void;
  onDragStart: () => void;
}

const RotationGizmo: React.FC<RotationGizmoProps> = ({
  boneName,
  boneWorldPosition,
  boneParentWorldQuaternion,
  currentRotation,
  dragStateRef,
  onRotationChange,
  onDragStart,
}) => {
  const torusGeometry = useMemo(
    () => new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 12, 48),
    [],
  );

  return (
    <group position={boneWorldPosition} quaternion={boneParentWorldQuaternion}>
      {RING_CONFIGS.map(({ axis, color, rotation }, index) => (
        <RotationRing
          key={index}
          boneName={boneName}
          axis={axis}
          color={color}
          ringRotation={rotation}
          geometry={torusGeometry}
          boneWorldPosition={boneWorldPosition}
          parentWorldQuaternion={boneParentWorldQuaternion}
          currentRotation={currentRotation}
          dragStateRef={dragStateRef}
          onRotationChange={onRotationChange}
          onDragStart={onDragStart}
        />
      ))}
    </group>
  );
};

// =============================================================================
// Single Rotation Ring
// =============================================================================

interface RotationRingProps {
  boneName: string;
  axis: THREE.Vector3;
  color: string;
  ringRotation: THREE.Euler;
  geometry: THREE.TorusGeometry;
  boneWorldPosition: THREE.Vector3;
  parentWorldQuaternion: THREE.Quaternion;
  currentRotation: Quat;
  dragStateRef: React.MutableRefObject<DragState>;
  onRotationChange: (boneName: string, newDeltaQuat: Quat) => void;
  onDragStart: () => void;
}

const RotationRing: React.FC<RotationRingProps> = ({
  boneName,
  axis,
  color,
  ringRotation,
  geometry,
  boneWorldPosition,
  parentWorldQuaternion,
  currentRotation,
  dragStateRef,
  onRotationChange,
  onDragStart,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerDown = useCallback(
    (e: any) => {
      e.stopPropagation?.();

      // Compute the rotation axis in world space
      const worldAxis = axis
        .clone()
        .applyQuaternion(parentWorldQuaternion)
        .normalize();

      // Set up the drag plane
      const plane = new THREE.Plane();
      plane.setFromNormalAndCoplanarPoint(worldAxis, boneWorldPosition);

      // Compute start angle from the ray intersection
      let startAngle = 0;
      if (e.ray) {
        const result = new THREE.Vector3();
        const hit = (e.ray as THREE.Ray).intersectPlane(plane, result);
        if (hit) {
          startAngle = computeAngleOnPlane(result, boneWorldPosition, worldAxis);
        }
      }

      // Initialize shared drag state
      const ds = dragStateRef.current;
      ds.active = true;
      ds.mode = "rotate";
      ds.boneName = boneName;
      ds.axis.copy(axis);
      ds.worldAxis.copy(worldAxis);
      ds.parentWorldQuatInverse.copy(parentWorldQuaternion).invert();
      ds.dragStartAngle = startAngle;
      ds.dragStartQuat.set(
        currentRotation.x,
        currentRotation.y,
        currentRotation.z,
        currentRotation.w,
      );
      ds.boneWorldPosition.copy(boneWorldPosition);
      ds.plane.copy(plane);
      ds.onRotationChange = onRotationChange;
      ds.onPositionChange = null;

      onDragStart();
    },
    [
      axis,
      parentWorldQuaternion,
      boneWorldPosition,
      currentRotation,
      boneName,
      dragStateRef,
      onRotationChange,
      onDragStart,
    ],
  );

  const isDragging =
    dragStateRef.current.active &&
    dragStateRef.current.mode === "rotate" &&
    dragStateRef.current.boneName === boneName;

  return (
    <mesh
      geometry={geometry}
      rotation={ringRotation}
      renderOrder={1000}
      onPointerDown={handlePointerDown}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      <meshBasicMaterial
        color={color}
        transparent
        opacity={isDragging ? 1.0 : isHovered ? 0.85 : 0.7}
        depthTest={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// =============================================================================
// Translation Gizmo (drag sphere)
// =============================================================================

interface TranslationGizmoProps {
  boneName: string;
  boneWorldPosition: THREE.Vector3;
  dragStateRef: React.MutableRefObject<DragState>;
  onPositionChange: (boneName: string, newDeltaPos: Vec3) => void;
  onDragStart: () => void;
}

const TranslationGizmo: React.FC<TranslationGizmoProps> = ({
  boneName,
  boneWorldPosition,
  dragStateRef,
  onPositionChange,
  onDragStart,
}) => {
  const { camera } = useThree();

  const handlePointerDown = useCallback(
    (e: any) => {
      e.stopPropagation?.();

      // Drag plane perpendicular to camera
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      const plane = new THREE.Plane();
      plane.setFromNormalAndCoplanarPoint(cameraDir, boneWorldPosition);

      // Compute drag offset from ray intersection
      let offset = new THREE.Vector3();
      if (e.ray) {
        const result = new THREE.Vector3();
        const hit = (e.ray as THREE.Ray).intersectPlane(plane, result);
        if (hit) {
          offset = boneWorldPosition.clone().sub(result);
        }
      }

      // Initialize shared drag state
      const ds = dragStateRef.current;
      ds.active = true;
      ds.mode = "translate";
      ds.boneName = boneName;
      ds.boneWorldPosition.copy(boneWorldPosition);
      ds.plane.copy(plane);
      ds.dragOffset.copy(offset);
      ds.restWorldPos.copy(boneWorldPosition);
      ds.onPositionChange = onPositionChange;
      ds.onRotationChange = null;

      onDragStart();
    },
    [camera, boneWorldPosition, boneName, dragStateRef, onPositionChange, onDragStart],
  );

  const isDragging =
    dragStateRef.current.active &&
    dragStateRef.current.mode === "translate";

  return (
    <mesh
      position={boneWorldPosition}
      onPointerDown={handlePointerDown}
      renderOrder={1000}
    >
      <sphereGeometry args={[TRANSLATE_SPHERE_RADIUS, 16, 16]} />
      <meshBasicMaterial
        color="#ffcc00"
        transparent
        opacity={isDragging ? 1.0 : 0.8}
        depthTest={false}
      />
    </mesh>
  );
};

// =============================================================================
// Utility: compute angle of a point projected onto a plane around a center
// =============================================================================

function computeAngleOnPlane(
  point: THREE.Vector3,
  center: THREE.Vector3,
  planeNormal: THREE.Vector3,
): number {
  const toPoint = point.clone().sub(center);

  // Project onto the plane (remove component along normal)
  const projected = toPoint
    .clone()
    .sub(planeNormal.clone().multiplyScalar(toPoint.dot(planeNormal)));

  if (projected.lengthSq() < 1e-10) return 0;

  // Create a consistent reference direction on the plane
  const ref =
    Math.abs(planeNormal.dot(AXIS_Y)) < 0.99
      ? AXIS_Y.clone()
      : AXIS_X.clone();
  const refOnPlane = ref
    .sub(planeNormal.clone().multiplyScalar(ref.dot(planeNormal)))
    .normalize();
  const perpOnPlane = new THREE.Vector3()
    .crossVectors(planeNormal, refOnPlane)
    .normalize();

  return Math.atan2(projected.dot(perpOnPlane), projected.dot(refOnPlane));
}
