---
name: threed-guide
description: Architecture guide for the 3D visualization module (threed). Use when working with 3D editor, techniques, sequences, bone transforms, or React Three Fiber components.
---

# 3D Module Guide

**Full PRD:** See `.ai/3d-prd.md` for complete requirements.

## Architecture Overview

```
src/modules/threed/
├── components/
│   ├── ThreeDLibraryScreen.tsx   # D2–D4: Sequences / Techniques / Positions tabs (IconTabs)
│   ├── SequenceCreateScreen.tsx  # D5: title, description, tags; Create opens the editor
│   ├── SequenceDetailsScreen.tsx # D6: first step on the model (PosePreview), Edit / View, steps
│   ├── TechniquePreviewScreen.tsx # D7: technique / starting position on a full-screen scene
│   ├── SequenceEditorScreen.tsx  # D8: editor (camera pad, steps strip, tools, joint panel, hand editor)
│   ├── SequenceViewerScreen.tsx  # D9: step progress card with previous / next
│   ├── SceneScreen.tsx           # Full-screen 3D layout: header over the scene, card panel below
│   ├── PosePreview.tsx           # Non-interactive model in a 22px card
│   ├── CanvasErrorBoundary.tsx   # Message instead of a crash when GL / the model fails
│   ├── JointPanel.tsx            # Selected joint: Rotate / Move, one AxisSlider per axis
│   ├── AxisSlider.tsx            # Centered −range..+range slider with the value ("+24°")
│   ├── HandEditorPanel.tsx       # D10: finger chips, segments, X / Z, presets
│   ├── SaveTechniqueSheet.tsx    # D11: new technique / starting position (FormSheet)
│   ├── TechniquePickerSheet.tsx  # D12: apply a technique / position to the current step
│   ├── StepStrip.tsx, CameraPad.tsx, ToolButton.tsx, RoundButton.tsx  # editor chrome
│   ├── ThreeDCanvas.tsx          # Main R3F Canvas wrapper (dark scene from threedScene tokens)
│   ├── HumanModel.tsx            # GLB model loader + bone management
│   ├── BoneMarkerGroup.tsx       # Renders clickable bone markers
│   ├── BoneMarker.tsx            # Single bone marker sphere (3D lime)
│   ├── FPSCameraController.tsx   # Camera yaw / pitch (pad steps and drag orbit)
│   └── AxisGizmo.tsx             # XYZ axis indicator
├── hooks/
│   ├── useSequenceEditor.ts      # Main editor state machine
│   ├── useSequenceViewer.ts      # Read-only viewer state
│   ├── useSequenceList.ts        # Library rows: sequences with step counts and tags
│   ├── useSequenceDetails.ts     # One sequence with its tags and steps
│   ├── useSequences.ts           # Load sequences from DB (Notebook count)
│   ├── useTechniques.ts          # Load techniques from DB
│   ├── useStartingPositions.ts   # Load starting positions
│   ├── useHandPresetsByUserAndSide.ts  # Filter presets by L/R
│   ├── useSequenceSteps.ts       # Load steps for a sequence
│   └── useTechniqueById.ts       # Load single technique
├── services/
│   ├── sequenceService.ts        # Sequence CRUD + step management
│   ├── techniqueService.ts       # Technique CRUD
│   └── handPresetService.ts      # Hand preset CRUD
├── repositories/
│   ├── sequenceRepository.ts
│   ├── sequenceStepRepository.ts
│   ├── techniqueRepository.ts
│   └── bodyPosePresetRepository.ts
├── types/
│   ├── data.ts       # V1/V2/V3 data structures, Vec3, Quat
│   ├── fk.ts         # FK bones, BoneTransform, body groups
│   ├── ik.ts         # Legacy IK targets (V1 compat)
│   ├── dto.ts        # DTOs for services
│   ├── tabs.ts       # Library tab enum
│   └── index.ts      # Re-exports everything
├── library.ts        # Pure: list filters, body-part labels / chips, dates
├── jointAxes.ts      # Pure: quaternion ↔ Euler degrees, slider math, "+24°"
├── utils/
│   ├── fkSystem.ts   # FK bone transform calculations
│   ├── dataCompat.ts # V1→V2→V3 data conversion
│   └── sceneCenterCalculator.ts
└── database/
    └── schema.ts     # 5 tables: techniques, sequences, sequence_steps, step_techniques, body_pose_presets
```

## Data Model Hierarchy

```
Technique (atom)     ← Single pose for body part/fullbody
    ↕ referenced by
StepTechnique        ← Links technique to step + position/rotation
    ↕ belongs to
SequenceStep         ← One frame in a sequence (order_index)
    ↕ belongs to
Sequence             ← Ordered list of steps (title, description)
```

## Data Versions

The 3D data has evolved through 3 versions. Always handle all versions.

### V1 (Legacy IK)
- Uses IK target positions (world-space Vec3)
- `TechniqueData.targets: Record<string, Vec3>`
- `TechniqueData.bodyPart: BodyPart` (leftArm, rightArm, etc.)

### V2 (FK per-bone)
- Uses per-bone quaternion rotations
- `TechniqueDataV2.boneTransforms: BoneTransformMap`
- `TechniqueDataV2.bodyGroup: FKBodyGroup`
- `version: 2` field identifies V2

### V3 (IK + FK hybrid)
- IK world-space targets + optional FK overrides
- `TechniqueDataV3.ikTargets: Record<string, Vec3>`
- `TechniqueDataV3.boneTransforms?: BoneTransformMap`
- `version: 3` field identifies V3

### Version Detection
```typescript
// Use normalizeTechniqueData() from utils/dataCompat.ts
import { normalizeTechniqueData } from "../utils/dataCompat";

const { boneTransforms } = normalizeTechniqueData(techniqueDataJSON);
// Always returns BoneTransformMap regardless of version
```

## Core Types

### BoneTransform & BoneTransformMap (`types/fk.ts`)
```typescript
interface BoneTransform {
  rotation: Quat;      // Quaternion delta relative to rest pose
  position?: Vec3;     // Local offset (mainly for DEF-hips)
}
type BoneTransformMap = Record<string, BoneTransform>;
```

### Vec3 & Quat (`types/data.ts`)
```typescript
interface Vec3 { x: number; y: number; z: number; }
interface Quat { x: number; y: number; z: number; w: number; }
```

### FK Bone Names (`types/fk.ts`)
Bones use sanitized GLTFLoader names (dots stripped):
- Spine: `DEF-hips`, `DEF-spine001`..`003`, `DEF-neck`, `DEF-head`
- Arms: `DEF-shoulderL/R`, `DEF-upper_armL/R`, `DEF-forearmL/R`, `DEF-handL/R`
- Fingers: `DEF-thumb01L`..`03L`, `DEF-f_index01L`..`03L`, etc.
- Legs: `DEF-thighL/R`, `DEF-shinL/R`, `DEF-footL/R`, `DEF-toeL/R`

### Body Groups (`types/fk.ts`)
```typescript
FK_BODY_GROUPS = {
  leftArm, rightArm, leftHand, rightHand,
  leftLeg, rightLeg, spine, fullbody
}
type FKBodyGroup = keyof typeof FK_BODY_GROUPS;
```

### Hand Side Detection
To detect which hand a bone belongs to:
```typescript
const isRightHand = selectedBone.includes("R");  // NOT endsWith!
const isLeftHand = selectedBone.includes("L");
```
This works for both hand bones (`DEF-handL`) and finger bones (`DEF-f_index01L`).

## Component Architecture

### GL vs Non-GL Components
The `components/index.ts` separates:
- **UI-only components** (no GL dependencies): library and new-sequence screens, sheets, panels
- **GL components** (Three.js): Canvas, HumanModel, BoneMarker, Gizmo, and every screen that shows the model

Screens follow the "3D notebook" boards (`design/project/ThreeD*.dc.html`) in 3D lime, but the
figure is always the real `HumanModel`, never the boards' line drawing. Scene colors (background,
floor, grid, model, partner, markers, axes) come from `threedScene` in `src/core/theme/tokens.ts`.

**Only import GL components in screens that render `<Canvas>`!**

### Render Flow
```
app/techniques/threed/[sequenceId]/edit.tsx → SequenceEditorScreen → SceneScreen
  └── ThreeDCanvas (R3F Canvas wrapper)
       ├── FPSCameraController (touch orbit/pan)
       ├── HumanModel (GLB loader, applies bone transforms)
       │    └── BoneMarkerGroup (clickable bone spheres)
       └── AxisGizmo (orientation indicator)
```

### State Flow
```
useSequenceEditor (main state hook)
  ├── selectedBone: string | null
  ├── boneTransforms: BoneTransformMap
  ├── gizmoMode: "rotate" | "translate"
  ├── setBoneTransform(boneName, transform)
  ├── mirrorBone() ← uses FK_MIRROR_MAP
  └── saveTechnique() / saveSequence()
```

## Hand Preset System

### Saving Presets
- Service: `handPresetService.ts`
- Saves ALL hand bones (main hand + 5 fingers x 3 segments = 16 bones)
- Bones without transforms get identity: `{x:0, y:0, z:0, w:1}`

### Loading Presets
- Hook: `useHandPresetsByUserAndSide.ts`
- Filters by hand side using `bone.includes("L")` / `bone.includes("R")`
- Returns presets for current hand only

### Applying Presets
- Preset data is `BoneTransformMap`
- Apply all transforms to matching bone names instantly

## Database Tables

| Table              | Description                        |
| ------------------ | ---------------------------------- |
| techniques         | Individual poses (user-owned)      |
| sequences          | Ordered step collections           |
| sequence_steps     | Steps within a sequence            |
| step_techniques    | Links techniques to steps          |
| body_pose_presets  | Saved hand/body presets (user-owned)|

## Performance Notes

- Target: 60 FPS during bone manipulation
- Minimize React state updates during drag operations
- Use refs for Three.js objects, not state
- BoneTransformMap updates should be batched
- Camera controls use gesture handlers, not React state
