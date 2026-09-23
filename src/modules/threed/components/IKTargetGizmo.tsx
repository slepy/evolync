import React, { useState, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface IKTargetGizmoProps {
  targetName: string;
  position: THREE.Vector3;
  onDrag: (name: string, pos: THREE.Vector3) => void;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

const GIZMO_RADIUS = 0.08;

export const IKTargetGizmo: React.FC<IKTargetGizmoProps> = ({
  targetName,
  position,
  onDrag,
  isSelected,
  onSelect,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { camera, gl } = useThree();
  const capturedPointerId = useRef<number | null>(null);
  const planeRef = useRef(new THREE.Plane());
  const intersectionPoint = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());

  const handlePointerDown = (e: any) => {
    e.stopPropagation?.();
    setIsDragging(true);
    onSelect(targetName);

    // Set up drag plane perpendicular to camera direction
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    planeRef.current.setFromNormalAndCoplanarPoint(cameraDir, position);

    // Capture pointer for smooth dragging
    const pointerId = (e as any).pointerId as number | undefined;
    if (typeof pointerId === "number") {
      capturedPointerId.current = pointerId;
    }
    (gl.domElement as HTMLElement).setPointerCapture?.((e as any).pointerId);
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;

    // Cast ray from pointer through camera
    const rect = (gl.domElement as HTMLElement).getBoundingClientRect?.();
    if (!rect) return;

    const nativeEvent = (e as any).nativeEvent || e;
    const x = ((nativeEvent.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((nativeEvent.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera);
    raycaster.current.ray.intersectPlane(
      planeRef.current,
      intersectionPoint.current,
    );

    onDrag(targetName, intersectionPoint.current.clone());
  };

  const releaseCapture = () => {
    const el = gl.domElement as HTMLElement;
    const pointerId = capturedPointerId.current;
    if (pointerId !== null) {
      el.releasePointerCapture?.(pointerId);
      capturedPointerId.current = null;
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    releaseCapture();
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    releaseCapture();
  };

  return (
    <mesh
      position={position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <sphereGeometry args={[GIZMO_RADIUS, 16, 16]} />
      <meshStandardMaterial
        color={isSelected ? "#ff6600" : "#00ff00"}
        transparent
        opacity={isDragging ? 0.9 : 0.7}
      />
    </mesh>
  );
};
