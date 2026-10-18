import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface FPSCameraControllerHandle {
  rotateLeft: () => void;
  rotateRight: () => void;
  rotateUp: () => void;
  rotateDown: () => void;
  /** Drag on the scene: yaw and pitch by the given radians. */
  orbit: (yaw: number, pitch: number) => void;
  /** Move the camera closer (negative) or farther (positive), eased. */
  zoomBy: (delta: number) => void;
}

interface FPSCameraControllerProps {
  sceneCenter: [number, number, number];
  cameraDistance?: number; // Optional override for camera distance (default: 3.5)
}

const ROTATION_STEP = 0.15; // Radians per rotation action (~8.6 degrees)
const DEFAULT_CAMERA_DISTANCE = 3.5; // Distance from scene center
const MAX_PITCH = Math.PI / 3; // 60 degrees up
const MIN_PITCH = -Math.PI / 2.5; // -72 degrees down
const MIN_DISTANCE = 1;
const MAX_DISTANCE = 8;

/**
 * Orbit camera around the scene center: yaw, pitch and distance live here.
 * The canvas renders on demand, so every change calls `invalidate()`, and the
 * zoom easing keeps requesting frames only until it arrives.
 */
export const FPSCameraController = forwardRef<
  FPSCameraControllerHandle,
  FPSCameraControllerProps
>(({ sceneCenter, cameraDistance = DEFAULT_CAMERA_DISTANCE }, ref) => {
  const { camera, invalidate } = useThree();
  const yawRef = useRef(0); // Horizontal rotation (radians)
  const pitchRef = useRef(0); // Vertical rotation (radians)
  const distanceRef = useRef(cameraDistance);
  const targetDistanceRef = useRef(cameraDistance);
  const sceneCenterRef = useRef(new THREE.Vector3(...sceneCenter));

  // A new center (partner on, hand editor) or default distance re-frames the scene.
  React.useEffect(() => {
    sceneCenterRef.current.set(sceneCenter[0], sceneCenter[1], sceneCenter[2]);
    invalidate();
  }, [sceneCenter, invalidate]);

  React.useEffect(() => {
    distanceRef.current = cameraDistance;
    targetDistanceRef.current = cameraDistance;
    invalidate();
  }, [cameraDistance, invalidate]);

  const pitchBy = (delta: number) => {
    pitchRef.current = Math.min(MAX_PITCH, Math.max(MIN_PITCH, pitchRef.current + delta));
  };

  useImperativeHandle(ref, () => ({
    rotateLeft: () => {
      yawRef.current += ROTATION_STEP;
      invalidate();
    },
    rotateRight: () => {
      yawRef.current -= ROTATION_STEP;
      invalidate();
    },
    rotateUp: () => {
      pitchBy(ROTATION_STEP);
      invalidate();
    },
    rotateDown: () => {
      pitchBy(-ROTATION_STEP);
      invalidate();
    },
    orbit: (yaw: number, pitch: number) => {
      yawRef.current += yaw;
      pitchBy(pitch);
      invalidate();
    },
    zoomBy: (delta: number) => {
      targetDistanceRef.current = Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, targetDistanceRef.current + delta));
      invalidate();
    },
  }));

  useFrame(() => {
    // Ease the distance toward the zoom target; keep frames coming until it lands.
    const diff = targetDistanceRef.current - distanceRef.current;
    if (Math.abs(diff) > 0.005) {
      distanceRef.current += diff * 0.2;
      invalidate();
    } else {
      distanceRef.current = targetDistanceRef.current;
    }

    const distance = distanceRef.current;
    const center = sceneCenterRef.current;
    camera.position.set(
      center.x + Math.sin(yawRef.current) * Math.cos(pitchRef.current) * distance,
      center.y + Math.sin(pitchRef.current) * distance,
      center.z + Math.cos(yawRef.current) * Math.cos(pitchRef.current) * distance,
    );
    camera.lookAt(center); // Always look at scene center
    camera.updateMatrixWorld();
  });

  return null;
});

FPSCameraController.displayName = "FPSCameraController";
