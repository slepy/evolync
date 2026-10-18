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
}

interface FPSCameraControllerProps {
  sceneCenter: [number, number, number];
  cameraDistance?: number; // Optional override for camera distance (default: 3.5)
}

const ROTATION_STEP = 0.15; // Radians per rotation action (~8.6 degrees)
const DEFAULT_CAMERA_DISTANCE = 3.5; // Distance from scene center
const MAX_PITCH = Math.PI / 3; // 60 degrees up
const MIN_PITCH = -Math.PI / 2.5; // -72 degrees down

export const FPSCameraController = forwardRef<
  FPSCameraControllerHandle,
  FPSCameraControllerProps
>(({ sceneCenter, cameraDistance = DEFAULT_CAMERA_DISTANCE }, ref) => {
  const { camera } = useThree();
  const yawRef = useRef(0); // Horizontal rotation (radians)
  const pitchRef = useRef(0); // Vertical rotation (radians)
  const sceneCenterRef = useRef(new THREE.Vector3(...sceneCenter));

  // Update scene center when it changes
  React.useEffect(() => {
    sceneCenterRef.current.set(sceneCenter[0], sceneCenter[1], sceneCenter[2]);
  }, [sceneCenter]);

  useImperativeHandle(ref, () => ({
    rotateLeft: () => {
      yawRef.current += ROTATION_STEP;
    },
    rotateRight: () => {
      yawRef.current -= ROTATION_STEP;
    },
    rotateUp: () => {
      pitchRef.current = Math.min(
        pitchRef.current + ROTATION_STEP,
        MAX_PITCH,
      );
    },
    rotateDown: () => {
      pitchRef.current = Math.max(
        pitchRef.current - ROTATION_STEP,
        MIN_PITCH,
      );
    },
    orbit: (yaw: number, pitch: number) => {
      yawRef.current += yaw;
      pitchRef.current = Math.min(MAX_PITCH, Math.max(MIN_PITCH, pitchRef.current + pitch));
    },
  }));

  useFrame(() => {
    // Calculate camera position based on yaw/pitch angles
    const x =
      sceneCenterRef.current.x +
      Math.sin(yawRef.current) * Math.cos(pitchRef.current) * cameraDistance;
    const y =
      sceneCenterRef.current.y +
      Math.sin(pitchRef.current) * cameraDistance;
    const z =
      sceneCenterRef.current.z +
      Math.cos(yawRef.current) * Math.cos(pitchRef.current) * cameraDistance;

    camera.position.set(x, y, z);
    camera.lookAt(sceneCenterRef.current); // Always look at scene center
    camera.updateMatrixWorld();
  });

  return null;
});

FPSCameraController.displayName = "FPSCameraController";
