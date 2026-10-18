import { PrimaryButton, resolveListAccent } from "@/core/components";
import { threedScene } from "@/core/theme/tokens";
import { useLocalSearchParams } from "expo-router";
import { FlipHorizontal2, Flag, Hand, Library, PersonStanding, RotateCcw, Save, Users } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanResponder } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View, XStack, YStack } from "tamagui";
import { useStore } from "@/store";
import { useSequenceDetails, useSequenceEditor, useStartingPositions, useTechniques } from "../hooks";
import { withAxisDeg, type Axis } from "../jointAxes";
import { bodyPartLabelKey } from "../library";
import { saveHandPreset } from "../services/handPresetService";
import { FK_BONE_DISPLAY_KEYS, FK_MIRROR_MAP, getBoneBodyGroup, type BoneTransformMap, type FKBoneName } from "../types/fk";
import { calculateSceneCenter } from "../utils/sceneCenterCalculator";
import type { RestPoseData } from "../utils/fkSystem";
import { AxisGizmo } from "./AxisGizmo";
import { BoneMarkerGroup } from "./BoneMarkerGroup";
import { CameraPad } from "./CameraPad";
import { HandEditorPanel } from "./HandEditorPanel";
import { HumanModel, type HumanModelHandle } from "./HumanModel";
import { JointPanel, type JointMode } from "./JointPanel";
import { SaveTechniqueSheet } from "./SaveTechniqueSheet";
import { SceneScreen } from "./SceneScreen";
import { StepStrip } from "./StepStrip";
import { TechniquePickerSheet } from "./TechniquePickerSheet";
import { ThreeDCanvas, type ThreeDCanvasHandle } from "./ThreeDCanvas";
import { ToolButton } from "./ToolButton";

const lime = resolveListAccent("threed");
const IDENTITY = { x: 0, y: 0, z: 0, w: 1 };
/** Radians of camera turn per pixel dragged on the scene. */
const ORBIT_PER_PX = 0.008;
const HAND_BONES: FKBoneName[] = ["DEF-handL", "DEF-handR"];

/**
 * Editor (D8): the real model with lime joint markers, the camera pad and the
 * selected joint's chip over the scene; below, the steps strip and the tools
 * (Partner, Positions, Save position, Reset) or, with a joint selected, its
 * panel (Rotate / Move, X Y Z, Mirror, Save technique, Techniques). Save
 * writes the pose to the current step.
 */
export function SequenceEditorScreen() {
  const { sequenceId, step } = useLocalSearchParams<{ sequenceId: string; step?: string }>();
  const insets = useSafeAreaInsets();
  const userId = useStore((s) => s.user?.id);
  const editor = useSequenceEditor(sequenceId!);
  const { sequence, steps, isLoading } = useSequenceDetails(sequenceId);
  const { techniques } = useTechniques();
  const { positions } = useStartingPositions();
  const camera = useRef<ThreeDCanvasHandle>(null);
  const human = useRef<HumanModelHandle>(null);
  const [modelReady, setModelReady] = useState(false);
  const [mode, setMode] = useState<JointMode>("rotate");
  const [isSaving, setIsSaving] = useState(false);
  const [sheet, setSheet] = useState<"techniques" | "positions" | "saveTechnique" | "savePosition" | null>(null);
  const [handEditor, setHandEditor] = useState(false);
  const [handCenter, setHandCenter] = useState<[number, number, number] | null>(null);
  const initialStep = useRef(false);

  const {
    boneTransforms,
    selectedBone,
    selectedBodyGroup,
    partnerEnabled,
    currentStep,
    handleBoneRotationChange,
    handleBonePositionChange,
    handleRestPoseReady,
    setSelectedBone,
    handleDeselectAll,
    setPartnerEnabled,
    loadStep,
    saveCurrentStep,
    addNextStep,
    saveTechniqueFromSelection,
    saveAsStartingPosition,
    applyTechnique,
    resetPose,
    mirrorSelectedToOpposite,
  } = editor;

  // Open on the step from the sequence screen (?step=N), else step 1, once the model's rest pose exists.
  useEffect(() => {
    if (initialStep.current || !modelReady || isLoading) return;
    initialStep.current = true;
    const index = Number(step ?? 0);
    const target = steps[Number.isInteger(index) ? index : 0] ?? steps[0];
    if (target) loadStep(target);
  }, [modelReady, isLoading, steps, step, loadStep]);

  const onRestPoseReady = useCallback(
    (restPose: RestPoseData) => {
      handleRestPoseReady(restPose);
      setModelReady(true);
    },
    [handleRestPoseReady],
  );

  const currentIndex = currentStep ? steps.findIndex((s) => s.id === currentStep.id) : -1;
  const stepLabel =
    currentIndex >= 0
      ? t("threedStepOf", { n: currentIndex + 1, total: steps.length })
      : t("threedStepOf", { n: steps.length + 1, total: steps.length + 1 });

  const sceneCenter = useMemo<[number, number, number]>(
    () => handCenter ?? calculateSceneCenter([0, 0, 0], partnerEnabled, [1.5, 0, 0]),
    [handCenter, partnerEnabled],
  );

  const drag = useRef({ dx: 0, dy: 0 });
  const orbit = useRef(
    PanResponder.create({
      // Taps reach the joint markers; a drag past a few pixels turns the camera.
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
      onPanResponderGrant: (_, g) => {
        drag.current = { dx: g.dx, dy: g.dy };
      },
      onPanResponderMove: (_, g) => {
        camera.current?.orbit(-(g.dx - drag.current.dx) * ORBIT_PER_PX, (g.dy - drag.current.dy) * ORBIT_PER_PX);
        drag.current = { dx: g.dx, dy: g.dy };
      },
    }),
  ).current;

  const selectBone = useCallback(
    (bone: FKBoneName) => {
      setSelectedBone(bone);
      const group = getBoneBodyGroup(bone);
      if (group !== "leftHand" && group !== "rightHand") {
        setHandEditor(false);
        setHandCenter(null);
      }
    },
    [setSelectedBone],
  );

  const openHandEditor = () => {
    setHandEditor(true);
    const position = selectedBone ? human.current?.getBoneWorldPosition(selectedBone) : null;
    if (position) setHandCenter([position.x, position.y + 0.3, position.z]);
  };

  const closeHandEditor = () => {
    setHandEditor(false);
    setHandCenter(null);
    handleDeselectAll();
  };

  const run = async (action: () => Promise<unknown>) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await action();
    } catch (err) {
      console.error("[SequenceEditorScreen]", err);
    } finally {
      setIsSaving(false);
    }
  };

  const resetBone = (bone: string) => {
    handleBoneRotationChange(bone, IDENTITY);
    handleBonePositionChange(bone, { x: 0, y: 0, z: 0 });
  };

  const rotateAxis = (axis: Axis, deg: number) => {
    if (!selectedBone) return;
    handleBoneRotationChange(selectedBone, withAxisDeg(boneTransforms[selectedBone]?.rotation, axis, deg));
  };

  const moveAxis = (axis: Axis, meters: number) => {
    if (!selectedBone) return;
    const position = boneTransforms[selectedBone]?.position ?? { x: 0, y: 0, z: 0 };
    handleBonePositionChange(selectedBone, { ...position, [axis]: meters });
  };

  const saveHandPresetFor = async (name: string) => {
    if (!userId || !selectedBone) throw new Error("handPresetNoUserOrBone");
    await saveHandPreset(userId, name, boneTransforms, selectedBone.endsWith("R") ? "R" : "L");
  };

  const applyBoneTransforms = (transforms: BoneTransformMap) =>
    Object.entries(transforms).forEach(([bone, transform]) => {
      handleBoneRotationChange(bone, transform.rotation);
      if (transform.position) handleBonePositionChange(bone, transform.position);
    });

  // Techniques of the selected joint's body part (V1 wrists count as arms).
  const jointTechniques = useMemo(
    () =>
      selectedBodyGroup
        ? techniques.filter((tech) => bodyPartLabelKey(tech.bodyPart) === bodyPartLabelKey(selectedBodyGroup))
        : techniques,
    [techniques, selectedBodyGroup],
  );

  const jointName = selectedBone ? t(FK_BONE_DISPLAY_KEYS[selectedBone]) : "";
  const save = <PrimaryButton label={t("save")} accent="threed" loading={isSaving} onPress={() => run(saveCurrentStep)} />;

  const panel = handEditor ? (
    <HandEditorPanel
      selectedBone={selectedBone}
      boneTransforms={boneTransforms}
      onBoneSelect={setSelectedBone}
      onRotationChange={handleBoneRotationChange}
      onPositionChange={handleBonePositionChange}
      onDeselect={closeHandEditor}
      onResetBone={resetBone}
      onSaveHandPreset={saveHandPresetFor}
      onApplyPreset={applyBoneTransforms}
    />
  ) : selectedBone ? (
    <>
      <JointPanel
        name={jointName}
        transform={boneTransforms[selectedBone]}
        mode={mode}
        onModeChange={setMode}
        canMove={selectedBone === "DEF-hips"}
        onRotate={rotateAxis}
        onMove={moveAxis}
        onReset={() => resetBone(selectedBone)}
        onDeselect={handleDeselectAll}
      />
      <XStack flexWrap="wrap" gap={8}>
        <ToolButton
          icon={FlipHorizontal2}
          label={t("threedMirror")}
          onPress={mirrorSelectedToOpposite}
          disabled={!(selectedBone in FK_MIRROR_MAP)}
        />
        {selectedBodyGroup ? (
          <ToolButton icon={Save} label={t("threedSaveTechnique")} onPress={() => setSheet("saveTechnique")} />
        ) : null}
        <ToolButton icon={Library} label={t("threedTechniques")} onPress={() => setSheet("techniques")} />
        {HAND_BONES.includes(selectedBone) ? (
          <ToolButton icon={Hand} label={t("handEditFingers")} onPress={openHandEditor} />
        ) : null}
      </XStack>
      {save}
    </>
  ) : (
    <>
      <StepStrip
        count={steps.length}
        current={currentIndex >= 0 ? currentIndex : null}
        onSelect={(index) => steps[index] && loadStep(steps[index])}
        onAdd={() => run(addNextStep)}
        disabled={isSaving}
      />
      <XStack
        alignItems="center"
        gap={12}
        paddingVertical={14}
        paddingHorizontal={16}
        borderRadius="$headerRow"
        borderWidth={1}
        borderStyle="dashed"
        borderColor="$neutralRaisedBorder"
        backgroundColor="$neutralPage"
      >
        <View width={40} height={40} borderRadius={14} backgroundColor={lime.fill} alignItems="center" justifyContent="center">
          <PersonStanding size={20} color={lime.tint} strokeWidth={2.2} />
        </View>
        <YStack flex={1} gap={2}>
          <Text fontSize={15} fontWeight="$section" color="$neutralText">
            {t("threedTapJoint")}
          </Text>
          <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted">
            {t("threedDragHint")}
          </Text>
        </YStack>
      </XStack>
      <XStack flexWrap="wrap" gap={8}>
        <ToolButton
          icon={Users}
          label={t("threedPartner")}
          active={partnerEnabled}
          onPress={() => setPartnerEnabled(!partnerEnabled)}
        />
        <ToolButton icon={Flag} label={t("threedPositions")} onPress={() => setSheet("positions")} />
        <ToolButton icon={Save} label={t("threedSaveStartingPosition")} onPress={() => setSheet("savePosition")} />
        <ToolButton icon={RotateCcw} label={t("reset")} onPress={resetPose} />
      </XStack>
      {save}
    </>
  );

  return (
    <>
      <SceneScreen
        header={{
          title: handEditor ? jointName : sequence?.title ?? "",
          subtitle: handEditor ? t("handEditFingers") : stepLabel,
          compact: true,
          onBack: handEditor ? closeHandEditor : undefined,
        }}
        scene={
          <View flex={1} {...orbit.panHandlers}>
            <ThreeDCanvas
              zoomRef={camera}
              sceneCenter={sceneCenter}
              cameraDistance={handCenter ? 1.2 : undefined}
              onPointerMissed={handEditor ? undefined : handleDeselectAll}
            >
              <HumanModel ref={human} modelSlot={0} boneTransforms={boneTransforms} onRestPoseReady={onRestPoseReady} />
              {partnerEnabled ? <HumanModel modelSlot={1} color={threedScene.partner} boneTransforms={{}} /> : null}
              <BoneMarkerGroup humanRef={human} selectedBone={selectedBone} onSelectBone={selectBone} />
              <AxisGizmo />
            </ThreeDCanvas>
          </View>
        }
        overlay={
          <>
            {selectedBone && !handEditor ? (
              <XStack
                position="absolute"
                left={20}
                top={insets.top + 70}
                height={32}
                paddingHorizontal={12}
                borderRadius={16}
                borderWidth={1}
                borderColor={lime.tint}
                backgroundColor={threedScene.scrim}
                alignItems="center"
                gap={6}
                pointerEvents="none"
              >
                <View width={8} height={8} borderRadius={4} backgroundColor={lime.tint} />
                <Text fontSize={13} fontWeight="$button" color={lime.tint}>
                  {jointName}
                </Text>
              </XStack>
            ) : null}
            <View position="absolute" right={16} bottom={40}>
              <CameraPad camera={camera} />
            </View>
          </>
        }
        panel={panel}
      />

      <TechniquePickerSheet
        open={sheet === "techniques"}
        onOpenChange={(open) => !open && setSheet(null)}
        kind="techniques"
        items={jointTechniques}
        bodyPart={selectedBodyGroup}
        onSelect={(technique) => {
          applyTechnique(technique);
          setSheet(null);
        }}
      />
      <TechniquePickerSheet
        open={sheet === "positions"}
        onOpenChange={(open) => !open && setSheet(null)}
        kind="positions"
        items={positions}
        onSelect={(position) => {
          applyTechnique(position);
          setSheet(null);
        }}
      />
      {selectedBodyGroup ? (
        <SaveTechniqueSheet
          open={sheet === "saveTechnique"}
          onOpenChange={(open) => !open && setSheet(null)}
          bodyPart={selectedBodyGroup}
          onSave={saveTechniqueFromSelection}
        />
      ) : null}
      <SaveTechniqueSheet
        open={sheet === "savePosition"}
        onOpenChange={(open) => !open && setSheet(null)}
        bodyPart="fullbody"
        onSave={saveAsStartingPosition}
      />
    </>
  );
}
