# 3D Scene Layout & Pan Control Strategy

## Problem Statement

When adding a second character (partner) to the scene, the current implementation:

1. Positions the partner at a fixed offset without centering the view
2. Lacks horizontal pan capability to adjust scene position

**Current behavior:**

- Main character (slot 0): position `[0, 0, 0]`
- Partner character (slot 1): position `[1.5, 0, 0]`
- Camera orbit center: hardcoded to `[0, 1, 0]` (center of first character)

## Proposed Solution

### 1. **Dynamic Scene Center Calculation**

**Concept:** Calculate the geometric center between active characters and use it as the orbit target.

**Implementation:**

```typescript
// Calculate center based on active characters
const calculateSceneCenter = (
  mainCharacterPos: [number, number, number],
  partnerEnabled: boolean,
  partnerPos?: [number, number, number],
): [number, number, number] => {
  if (!partnerEnabled || !partnerPos) {
    // Single character: look at main character's position
    return [mainCharacterPos[0], mainCharacterPos[1] + 1, mainCharacterPos[2]];
  }

  // Two characters: center midpoint between them
  const centerX = (mainCharacterPos[0] + partnerPos[0]) / 2;
  const centerY = (mainCharacterPos[1] + partnerPos[1]) / 2;
  const centerZ = (mainCharacterPos[2] + partnerPos[2]) / 2;

  return [centerX, centerY + 1, centerZ];
};
```

**Key Points:**

- Y offset (+1) maintains gaze height appropriate for human models
- Recalculate whenever `partnerEnabled` state changes
- Pass result to `ThreeDCanvas` via `sceneCenter` prop

### 2. **Camera Rotation in Place (FPS-Style)**

**Concept:** Rotate the camera around its own position using keyboard/touch input, similar to first-person camera controls. The scene center remains for reference, but rotation pivots on camera position.

**Implementation Strategy:**

#### A. Extend the Canvas Handle Interface

```typescript
export interface ThreeDCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  rotateUp: () => void; // NEW - pitch up
  rotateDown: () => void; // NEW - pitch down
  rotateLeft: () => void; // NEW - yaw left
  rotateRight: () => void; // NEW - yaw right
}
```

#### B. Create Custom Rotation Controller (Replace OrbitControls)

Instead of `OrbitControls`, implement a custom FPS-style camera controller:

```typescript
const FPSCameraController: React.FC<{
  controlsRef: React.MutableRefObject<any | null>;
}> = ({ controlsRef }) => {
  const { camera } = useThree();
  const yawRef = useRef(0); // Horizontal rotation (radians)
  const pitchRef = useRef(0); // Vertical rotation (radians)

  const basePositionRef = useRef(new THREE.Vector3(0, 1.5, 3));

  useImperativeHandle(controlsRef, () => ({
    rotateLeft: () => {
      yawRef.current += ROTATION_STEP;
    },
    rotateRight: () => {
      yawRef.current -= ROTATION_STEP;
    },
    rotateUp: () => {
      pitchRef.current = Math.min(pitchRef.current + ROTATION_STEP, MAX_PITCH);
    },
    rotateDown: () => {
      pitchRef.current = Math.max(pitchRef.current - ROTATION_STEP, MIN_PITCH);
    },
  }));

  useFrame(() => {
    // Calculate camera position based on yaw/pitch angles
    const x =
      basePositionRef.current.x +
      Math.sin(yawRef.current) * Math.cos(pitchRef.current) * CAMERA_DISTANCE;
    const y =
      basePositionRef.current.y + Math.sin(pitchRef.current) * CAMERA_DISTANCE;
    const z =
      basePositionRef.current.z +
      Math.cos(yawRef.current) * Math.cos(pitchRef.current) * CAMERA_DISTANCE;

    camera.position.set(x, y, z);
    camera.lookAt(basePositionRef.current); // Always look at scene center
    camera.updateMatrixWorld();
  });

  return null;
};
```

#### C. Update Canvas to Use FPS Controller

```typescript
<Canvas
  camera={{ position: [0, 1.5, 3], fov: 50 }}
  gl={{ antialias: true }}
>
  <ambientLight intensity={0.8} />
  <directionalLight position={[5, 10, 5]} intensity={1.2} />

  {/* FPS-style camera control */}
  <FPSCameraController controlsRef={controlsRef} />

  <CameraZoomController
    ref={innerRef}
    center={sceneCenter}
    controlsRef={controlsRef}
  />
  <Suspense fallback={null}>{children}</Suspense>
</Canvas>
```

#### D. Alternative: Hybrid Approach (Orbit + FPS Toggle)

If you want to keep OrbitControls but add FPS-style rotation:

```typescript
// Disable OrbitControls rotation, handle it manually
<OrbitControls
  ref={controlsRef}
  enableZoom={false}
  enablePan={false}
  enableRotate={false}      // Disable automatic rotation
  target={center}
/>

// Custom rotation in CameraZoomController
useFrame(() => {
  if (rotationActive) {
    // Rotate camera around its position
    const newPos = rotateVectorAroundAxis(
      camera.position,
      basePosition,
      yawRef.current,
      pitchRef.current
    );
    camera.position.copy(newPos);
    camera.lookAt(basePosition);
  }
});
```

### 3. **UI Controls for Camera Rotation**

**Location:** Add rotation buttons adjacent to zoom buttons in edit screen

**Implementation:**

```typescript
// In app/threed/[sequenceId]/edit.tsx
<YStack position="absolute" right="$3" bottom="$3" gap="$2">
  {/* Rotation Control - 4 directions */}
  <XStack gap="$2" justifyContent="center">
    <Button
      size="$4"
      circular
      icon={<ChevronUp size={20} />}
      onPress={() => zoomRef.current?.rotateUp()}
    />
  </XStack>

  <XStack gap="$2" justifyContent="center">
    <Button
      size="$4"
      circular
      icon={<ChevronLeft size={20} />}
      onPress={() => zoomRef.current?.rotateLeft()}
    />
    <Button
      size="$4"
      circular
      icon={<ChevronDown size={20} />}
      onPress={() => zoomRef.current?.rotateDown()}
    />
    <Button
      size="$4"
      circular
      icon={<ChevronRight size={20} />}
      onPress={() => zoomRef.current?.rotateRight()}
    />
  </XStack>

  {/* Zoom Control */}
  <XStack gap="$2" justifyContent="center">
    <Button
      size="$4"
      circular
      icon={<Plus size={20} />}
      onPress={() => zoomRef.current?.zoomIn()}
    />
    <Button
      size="$4"
      circular
      icon={<Minus size={20} />}
      onPress={() => zoomRef.current?.zoomOut()}
    />
  </XStack>
</YStack>
```

### 4. **Configuration Constants**

Define in `ThreeDCanvas.tsx`:

```typescript
const ROTATION_STEP = 0.15; // Radians per rotation action (~8.6 degrees)
const CAMERA_DISTANCE = 3.5; // Distance from scene center
const MAX_PITCH = Math.PI / 3; // 60 degrees up
const MIN_PITCH = -Math.PI / 2.5; // -72 degrees down
const ZOOM_STEP = 0.5; // Units per zoom action
const MIN_DISTANCE = 1; // Closest zoom
const MAX_DISTANCE = 8; // Farthest zoom
```

## Architecture Diagram

```
EditorScreen
  ├─ calculateSceneCenter()
  │  └─ monitors: partnerEnabled
  │     returns: [centerX, centerY, centerZ]
  │
  ├─ ThreeDCanvas
  │  ├─ sceneCenter prop (updated)
  │  │
  │  ├─ FPSCameraController (NEW - replaces OrbitControls)
  │  │  ├─ yawRef: horizontal rotation (radians)
  │  │  ├─ pitchRef: vertical rotation (radians)
  │  │  └─ basePositionRef: camera starting position
  │  │
  │  └─ CameraZoomController
  │     ├─ handles: zoomIn, zoomOut (existing)
  │     ├─ handles: rotateLeft, rotateRight (NEW)
  │     ├─ handles: rotateUp, rotateDown (NEW)
  │     └─ applies yaw/pitch rotation in useFrame
  │
  └─ Controls (Rotation buttons)
     ├─ Up/Down/Left/Right buttons (NEW)
     └─ Zoom +/- buttons (existing)
```

## Implementation Order

1. **Phase 1:** Scene center calculation
   - Add utility function
   - Pass dynamic `sceneCenter` from EditorScreen to ThreeDCanvas
   - Verify automatic centering works

2. **Phase 2:** FPS Camera Controller
   - Replace `OrbitControls` with custom `FPSCameraController`
   - Implement yaw/pitch rotation logic
   - Add rotation methods to `ThreeDCanvasHandle`

3. **Phase 3:** Zoom integration
   - Extend `CameraZoomController` with zoom functionality
   - Ensure zoom works with FPS camera (maintain lookAt)

4. **Phase 4:** UI controls
   - Add rotation buttons (up/down/left/right) to editor screen
   - Keep existing zoom buttons
   - Test button responsiveness

## Testing Checklist

- [ ] Single character scene: centers on main character
- [ ] Partner added: scene center shifts to midpoint
- [ ] Partner removed: scene center returns to main character
- [ ] Rotate left/right: camera orbits horizontally around scene center
- [ ] Rotate up/down: camera tilts pitch while looking at scene center
- [ ] Rotation + zoom: both controls work together smoothly
- [ ] Pitch limits: can't rotate beyond `MAX_PITCH`/`MIN_PITCH`
- [ ] Camera always looks at scene center (not free-look)

## Performance Considerations

- **Constant recalculation:** sceneCenter only recalculates when `partnerEnabled` changes (cheap)
- **Rotation math:** Simple trigonometry per frame - minimal computation cost
- **Camera updates:** Single `set()` and `lookAt()` call per frame
- **Memory:** No new allocations in hot loop (reuse refs)
- **No OrbitControls overhead:** Custom controller is lighter than full OrbitControls

## Math Reference: FPS Camera Implementation

```
Camera position calculation (spherical coordinates):
  x = centerX + sin(yaw) * cos(pitch) * distance
  y = centerY + sin(pitch) * distance
  z = centerZ + cos(yaw) * cos(pitch) * distance

Where:
  - yaw: rotation around Y axis (0 = forward, π/2 = right, π = back, -π/2 = left)
  - pitch: rotation around X axis (0 = horizontal, π/2 = up, -π/2 = down)
  - distance: fixed camera distance from scene center
```

## Future Enhancements

1. **Touch gestures:** Swipe left/right for yaw rotation, up/down for pitch
2. **Mouse/pointer support:** Move mouse/pointer to rotate (like FPS games)
3. **Smooth rotation:** Add acceleration/deceleration to rotation (easing)
4. **Reset camera:** Button to return to default view angle
5. **Camera presets:** Preset angles (front, side, top, isometric)
6. **Orbit animation:** Smooth camera orbit to character bounds
7. **Free-look mode:** Toggle between orbit-around-center and free-look
