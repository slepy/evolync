import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { threedScene } from "@/core/theme/tokens";
import { FPSCameraController } from "./FPSCameraController";
import type { FPSCameraControllerHandle } from "./FPSCameraController";

export interface ThreeDCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  rotateUp: () => void;
  rotateDown: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  /** Drag on the scene: yaw and pitch by the given radians. */
  orbit: (yaw: number, pitch: number) => void;
}

const ZOOM_STEP = 0.5;

/**
 * Pixel ratio cap: the scene is drawn at most at 2× (3× phones and the iOS
 * simulator, whose GL runs on the CPU, otherwise fill 2.25× more pixels).
 */
const MAX_DPR = 2;

interface ThreeDCanvasProps {
  children: React.ReactNode;
  zoomRef?: React.Ref<ThreeDCanvasHandle>;
  /** Center point for camera controls — camera rotates around this */
  sceneCenter?: [number, number, number];
  /** Optional camera distance override (default: 3.5) */
  cameraDistance?: number;
  /** Called when user taps empty space (no 3D object hit) */
  onPointerMissed?: () => void;
}

const DEFAULT_CENTER: [number, number, number] = [0, 1, 0];

export const ThreeDCanvas: React.FC<ThreeDCanvasProps> = ({
  children,
  zoomRef,
  sceneCenter = DEFAULT_CENTER,
  cameraDistance,
  onPointerMissed,
}) => {
  const fpsControllerRef = useRef<FPSCameraControllerHandle>(null);

  React.useImperativeHandle(zoomRef, () => ({
    zoomIn: () => fpsControllerRef.current?.zoomBy(-ZOOM_STEP),
    zoomOut: () => fpsControllerRef.current?.zoomBy(ZOOM_STEP),
    rotateUp: () => fpsControllerRef.current?.rotateUp(),
    rotateDown: () => fpsControllerRef.current?.rotateDown(),
    rotateLeft: () => fpsControllerRef.current?.rotateLeft(),
    rotateRight: () => fpsControllerRef.current?.rotateRight(),
    orbit: (yaw: number, pitch: number) => fpsControllerRef.current?.orbit(yaw, pitch),
  }));

  return (
    <Canvas
      camera={{ position: [0, 1.5, 3], fov: 50 }}
      gl={{ antialias: true }}
      // Draw only when something changed (pose, camera, markers): a still
      // model costs no frames, which is most of the time on these screens.
      frameloop="demand"
      dpr={[1, MAX_DPR]}
      onPointerMissed={onPointerMissed}
    >
      <color attach="background" args={[threedScene.background]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <FPSCameraController
        ref={fpsControllerRef}
        sceneCenter={sceneCenter}
        cameraDistance={cameraDistance}
      />
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color={threedScene.floor} roughness={1} metalness={0} />
      </mesh>
      <gridHelper args={[6, 12, threedScene.grid, threedScene.grid]} position={[0, 0.001, 0]} />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
};
