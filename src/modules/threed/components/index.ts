// --- UI-only components (no GL dependencies) ---
export { ThreeDLibraryScreen } from "./ThreeDLibraryScreen";
export { SequenceCreateScreen } from "./SequenceCreateScreen";
export { CanvasErrorBoundary } from "./CanvasErrorBoundary";
export { HandEditorTab } from "./HandEditorTab";
export { HandEditorPanel } from "./HandEditorPanel";
export { SequenceCard } from "./SequenceCard";
export { TechniqueCard } from "./TechniqueCard";
export { TechniqueLibrarySheet } from "./TechniqueLibrarySheet";
export { SaveTechniqueSheet } from "./SaveTechniqueSheet";
export { StartingPositionSheet } from "./StartingPositionSheet";
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
export { PosePreview } from "./PosePreview";
export { SequenceDetailsScreen } from "./SequenceDetailsScreen";
export { SceneScreen } from "./SceneScreen";
export { TechniquePreviewScreen } from "./TechniquePreviewScreen";
export type { HumanModelHandle } from "./HumanModel";
export { BoneMarker } from "./BoneMarker";
export { BoneMarkerGroup } from "./BoneMarkerGroup";
export { AxisGizmo } from "./AxisGizmo";
