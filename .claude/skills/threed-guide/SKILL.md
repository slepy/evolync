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
│   ├── ThreeDCanvas.tsx          # Main R3F Canvas wrapper
│   ├── HumanModel.tsx            # GLB model loader + bone management
│   ├── BoneMarkerGroup.tsx       # Renders clickable bone markers
│   ├── BoneMarker.tsx            # Single bone marker sphere
│   ├── BoneGizmo.tsx             # Rotation/translation gizmo on selected bone
│   ├── BoneControlPanel.tsx      # UI panel for bone rotation sliders
│   ├── HandEditorPanel.tsx       # Hand-specific bone editor
│   ├── HandEditorTab.tsx         # Tab for hand editing mode
│   ├── FPSCameraController.tsx   # Touch camera controls
│   ├── IKTargetGizmo.tsx         # Legacy IK target handles
│   ├── AxisGizmo.tsx             # XYZ axis indicator
│   ├── SaveTechniqueSheet.tsx    # Bottom sheet for saving technique
│   ├── StartingPositionSheet.tsx # Bottom sheet for saving starting position
│   ├── TechniqueLibrarySheet.tsx # Technique browser sheet
│   ├── TechniqueCard.tsx         # Card displaying a technique
│   ├── SequenceCard.tsx          # Card displaying a sequence
│   ├── SequencesTab.tsx          # List of sequences
│   ├── TechniquesTab.tsx         # List of techniques
│   ├── StartingPositionsTab.tsx  # List of starting positions
│   └── HandPresetPicker.tsx      # Picker for saved hand presets
├── hooks/
│   ├── useSequenceEditor.ts      # Main editor state machine
│   ├── useSequenceViewer.ts      # Read-only viewer state
│   ├── useSequences.ts           # Load sequences from DB
│   ├── useTechniques.ts          # Load techniques from DB
│   ├── useStartingPositions.ts   # Load starting positions
│   ├── useHandPresets.ts         # Load all hand presets
│   ├── useHandPresetsByUserAndSide.ts  # Filter presets by L/R
│   ├── useSequenceSteps.ts       # Load steps for a sequence
│   ├── useThreeDScreen.ts        # Main screen tab state
│   └── useTechniqueById.ts       # Load single technique
├── services/
│   ├── sequenceService.ts        # Sequence CRUD + step management
│   ├── techniqueService.ts       # Technique CRUD
│   └── handPresetService.ts      # Hand preset CRUD
├── repositories/
│   ├── sequenceRepository.ts
│   ├── sequenceStepRepository.ts
│   ├── stepTechniqueRepository.ts
│   ├── techniqueRepository.ts
│   └── bodyPosePresetRepository.ts
├── types/
│   ├── data.ts       # V1/V2/V3 data structures, Vec3, Quat
│   ├── fk.ts         # FK bones, BoneTransform, body groups
│   ├── ik.ts         # Legacy IK targets (V1 compat)
│   ├── dto.ts        # DTOs for services
│   ├── tabs.ts       # Tab enum
│   └── index.ts      # Re-exports everything
├── utils/
│   ├── fkSystem.ts   # FK bone transform calculations
│   ├── ikSystem.ts   # Legacy IK calculations
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
- **UI-only components** (no GL dependencies): Cards, Sheets, Tabs, Panels
- **GL components** (Three.js): Canvas, HumanModel, BoneMarker, Gizmo

**Only import GL components in screens that render `<Canvas>`!**

### Render Flow
```
app/threed/[sequenceId]/edit.tsx
  └── ThreeDCanvas (R3F Canvas wrapper)
       ├── FPSCameraController (touch orbit/pan)
       ├── HumanModel (GLB loader, applies bone transforms)
       │    └── BoneMarkerGroup (clickable bone spheres)
       ├── BoneGizmo (transform gizmo on selected bone)
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
