---
layout: page
feature: threed
title: 3D notebook
group: notebook
accent: threed
icon: box
order: 41
summary: "Techniques as 3D poses: a sequence is a list of steps, each a pose of a full 3D human model set joint by joint (with an optional partner and a hand editor). Poses can be saved as reusable techniques and starting positions, and a sequence is viewed step by step."
purpose: "Notation of movement that words cannot hold: where every joint is, step after step, kept privately by each user and available offline."
who:
  - role: "Any signed-in user"
    outcome: "Creates sequences, poses steps, saves techniques, starting positions and hand presets, views sequences"
rules:
  - "Everything in 3D is **private** to its user and synced only to them."
  - "The library has three tabs: **Sequences** (search, steps · date, tags), **Techniques** (filter by body part: Arms, Hands, Legs, Spine) and **Positions** (full-body poses)."
  - "A **sequence** has a title, a description, [tags](./tags) and numbered **steps**. The sequence screen shows no model; the model renders only in the **editor** and the **viewer**."
  - "In the editor a tap on a joint selects it; *Rotate* or *Move* with one slider per axis (X, Y, Z), *Mirror* copies to the other side, *Reset* clears it. Drag on the scene turns the camera; the pad moves and zooms it."
  - "*Partner* shows a second figure in its rest pose next to the first, as a reference for distance; it is not posed or saved. *Positions* applies a saved starting position; *Save position* stores the full pose as a starting position."
  - "*Save technique* stores the pose of the selected body part (its joints) under a name; *Techniques* applies a saved one to the current step."
  - "The **hand editor** bends each finger segment (X) and spreads it (Z); a **hand preset** stores all 16 bones of a hand."
  - "*Save* writes the pose to the current step. Deleting a technique or position keeps the pose in the steps that used it."
  - "The **viewer** shows the steps one by one (Previous / Next); there is no animated playback."
messages:
  - situation: "Delete a sequence"
    message: "Are you sure you want to delete this sequence? This action cannot be undone."
  - situation: "Delete a step"
    message: "Are you sure you want to delete this step?"
  - situation: "Delete a technique"
    title: "Delete technique"
    message: "Delete this technique? Steps that used it keep their pose."
  - situation: "3D scene failed"
    message: "Failed to load 3D scene. Please go back and try again."
flows:
  - id: sequence
    title: "Sequence"
    steps:
      - title: "Library"
        text: "*3D* in the Notebook tab: Sequences, Techniques, Positions; *Add new* opens a new sequence."
        screen: ThreeDLibrary
      - title: "New sequence"
        text: "TITLE, DESCRIPTION, TAGS; *Create* stores it and opens the editor on step 1."
        screen: ThreeDSequenceCreate
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Sequence"
        text: "Title, description, tags, *Edit* and *View*, then the numbered steps with delete; a step opens the editor on it."
        screen: ThreeDSequence
  - id: pose
    title: "Posing a step"
    steps:
      - title: "Editor"
        text: "The model with the joint markers, the camera pad and the steps strip with *Add step*; tools *Partner*, *Positions*, *Save position*, *Reset*."
        screen: ThreeDEditor
      - title: "Joint"
        text: "The selected joint's panel: Rotate / Move and the X Y Z sliders, *Mirror*, *Save technique*, *Techniques*. *Save* writes the pose to the step and syncs."
        screen: ThreeDEditorJoint
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Partner"
        text: "A second figure in its rest pose next to the first; it is not posed and not saved with the step."
        screen: ThreeDEditorPartner
      - title: "Hand"
        text: "Hand, Thumb … Little, SEGMENT 1–3, X and Z sliders, and the user's presets for this hand with *Add new*."
        screen: ThreeDHandEditor
      - title: "Save technique"
        text: "BODY PART with its joint count and NAME; the technique appears under Techniques."
        screen: ThreeDSaveTechnique
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Apply a technique"
        text: "Saved poses of the body part with search; a tap applies one to the current step."
        screen: ThreeDTechniqueSheet
  - id: view
    title: "Viewing"
    steps:
      - title: "Viewer"
        text: "The sequence on the model, full screen; one progress segment per step and Previous / Next around *STEP 2 OF 6*."
        screen: ThreeDViewer
      - title: "Technique"
        text: "A technique or position from the library: the pose on the model, the name, body part, when it was saved and its tags."
        screen: ThreeDTechniquePreview
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Library (route `/techniques/threed`) | `src/modules/threed/components/ThreeDLibraryScreen.tsx`, `library.ts` |
| New sequence / sequence (routes `…/threed/create`, `…/threed/{sequenceId}`) | `SequenceCreateScreen.tsx`, `SequenceDetailsScreen.tsx`, `services/sequenceService.ts` |
| Editor (route `…/{sequenceId}/edit`) | `SequenceEditorScreen.tsx`, `JointPanel.tsx`, `HandEditorPanel.tsx`, `StepStrip.tsx`, `SaveTechniqueSheet.tsx`, `TechniquePickerSheet.tsx` |
| Viewer (route `…/{sequenceId}/viewer`), technique (route `…/threed/technique/{techniqueId}`) | `SequenceViewerScreen.tsx`, `TechniquePreviewScreen.tsx` |
| Model and scene | `HumanModel.tsx`, `ThreeDCanvas.tsx`, `SceneScreen.tsx`, `jointAxes.ts` |
| Techniques, hand presets | `services/techniqueService.ts`, `services/handPresetService.ts` |
| Server sync | `supabase/functions/sync/sync-threed.ts` |

Architecture details: the `threed-guide` skill and `.ai/3d-prd.md`.

## Data

| Table | Columns |
| --- | --- |
| `sequences` | `user_id`, `title`, `description`, `cover_image_url` |
| `sequence_steps` | `sequence_id`, `order_index`, `duration_ms`, `data` (JSON: bone transforms) |
| `techniques` | `user_id`, `title`, `description`, `body_part`, `data` (JSON) |
| `body_pose_presets` | `user_id`, `name`, `body_part_type` (`hand` / `foot`), `data` (JSON) |

Older techniques (V1, V2) are read through `normalizeTechniqueData` in `utils/dataCompat.ts`.

## Notes

- The design boards draw the figure as lines; the app always renders the real 3D model.
- `updateSequenceCoverImage` (upload to the `3d-sequences` bucket) exists but no screen calls it, so sequences have no cover.

</FeatureView>
