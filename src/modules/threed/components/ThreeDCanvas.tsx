import React, {
  Suspense,
  useImperativeHandle,
  forwardRef,
  useRef,
  useEffect,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FPSCameraController } from "./FPSCameraController";
import type { FPSCameraControllerHandle } from "./FPSCameraController";

export interface ThreeDCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  rotateUp: () => void;
  rotateDown: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
}

const ZOOM_STEP = 0.5;
const MIN_DISTANCE = 1;
const MAX_DISTANCE = 8;

/** Inner component that controls camera zoom and delegates rotation to FPSCameraController */
const CameraZoomAndRotationController = forwardRef<
  ThreeDCanvasHandle,
  {
    center: [number, number, number];
    fpsControllerRef: React.RefObject<FPSCameraControllerHandle | null>;
  }
>(({ center, fpsControllerRef }, ref) => {
  const { camera } = useThree();
  const targetDistance = useRef<number | null>(null);
  const centerVec = useRef(new THREE.Vector3(...center));

  useEffect(() => {
    centerVec.current.set(center[0], center[1], center[2]);
  }, [center]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const dist = camera.position.distanceTo(centerVec.current);
      targetDistance.current = Math.max(MIN_DISTANCE, dist - ZOOM_STEP);
    },
    zoomOut: () => {
      const dist = camera.position.distanceTo(centerVec.current);
      targetDistance.current = Math.min(MAX_DISTANCE, dist + ZOOM_STEP);
    },
    rotateLeft: () => {
      fpsControllerRef.current?.rotateLeft();
    },
    rotateRight: () => {
      fpsControllerRef.current?.rotateRight();
    },
    rotateUp: () => {
      fpsControllerRef.current?.rotateUp();
    },
    rotateDown: () => {
      fpsControllerRef.current?.rotateDown();
    },
  }));

  useFrame(() => {
    if (targetDistance.current === null) return;
    const currentDist = camera.position.distanceTo(centerVec.current);
    const diff = targetDistance.current - currentDist;
    if (Math.abs(diff) < 0.01) {
      targetDistance.current = null;
      return;
    }
    const dir = camera.position.clone().sub(centerVec.current).normalize();
    const newDist = THREE.MathUtils.lerp(
      currentDist,
      targetDistance.current,
      0.15,
    );
    camera.position.copy(centerVec.current).add(dir.multiplyScalar(newDist));
    camera.updateMatrixWorld();
  });

  return null;
});

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
  const innerRef = useRef<ThreeDCanvasHandle>(null);
  const fpsControllerRef = useRef<FPSCameraControllerHandle>(null);

  React.useImperativeHandle(zoomRef, () => ({
    zoomIn: () => innerRef.current?.zoomIn(),
    zoomOut: () => innerRef.current?.zoomOut(),
    rotateUp: () => innerRef.current?.rotateUp(),
    rotateDown: () => innerRef.current?.rotateDown(),
    rotateLeft: () => innerRef.current?.rotateLeft(),
    rotateRight: () => innerRef.current?.rotateRight(),
  }));

  return (
    <Canvas
      camera={{ position: [0, 1.5, 3], fov: 50 }}
      gl={{ antialias: true }}
      onPointerMissed={onPointerMissed}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <FPSCameraController
        ref={fpsControllerRef}
        sceneCenter={sceneCenter}
        cameraDistance={cameraDistance}
      />
      <CameraZoomAndRotationController
        ref={innerRef}
        center={sceneCenter}
        fpsControllerRef={fpsControllerRef}
      />
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#aaaaaa" roughness={1} metalness={0} />
      </mesh>
      <gridHelper args={[6, 12, "#888888", "#888888"]} position={[0, 0.001, 0]} />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
};
