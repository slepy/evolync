// --- UI-only components (no GL dependencies) ---
export { HandEditorTab } from "./HandEditorTab";
export { HandEditorPanel } from "./HandEditorPanel";
export { SequenceCard } from "./SequenceCard";
export { TechniqueCard } from "./TechniqueCard";
export { TechniqueLibrarySheet } from "./TechniqueLibrarySheet";
export { SaveTechniqueSheet } from "./SaveTechniqueSheet";
export { StartingPositionSheet } from "./StartingPositionSheet";
export { HandPresetPicker } from "./HandPresetPicker";
export { BoneControlPanel } from "./BoneControlPanel";
export { ThreeDTabSelector } from "./ThreeDTabSelector";
export { SequencesTab } from "./SequencesTab";
export { TechniquesTab } from "./TechniquesTab";
export { StartingPositionsTab } from "./StartingPositionsTab";

// --- GL components (import these directly or from this barrel only
//     in screens that actually render a <Canvas>) ---
export { ThreeDCanvas } from "./ThreeDCanvas";
export type { ThreeDCanvasHandle } from "./ThreeDCanvas";
export { FPSCameraController } from "./FPSCameraController";
export type { FPSCameraControllerHandle } from "./FPSCameraController";
export { HumanModel } from "./HumanModel";
export type { HumanModelHandle } from "./HumanModel";
export { BoneMarker } from "./BoneMarker";
export { BoneGizmo } from "./BoneGizmo";
export { BoneMarkerGroup } from "./BoneMarkerGroup";
export { IKTargetGizmo } from "./IKTargetGizmo";
export { AxisGizmo } from "./AxisGizmo";
