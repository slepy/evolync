import React, {
  Component,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { ScrollView, Pressable } from "react-native";
import { Button, Text, XStack, YStack } from "tamagui";
import { calculateSceneCenter } from "@/modules/threed/utils/sceneCenterCalculator";
import { FK_BONE_DISPLAY_KEYS, FK_MIRROR_MAP } from "@/modules/threed/types/fk";
import type { FKBoneName } from "@/modules/threed/types/fk";

class CanvasErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[CanvasErrorBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          backgroundColor="#000"
        >
          <Text color="#fff">{t("threedLoadError")}</Text>
        </YStack>
      );
    }
    return this.props.children;
  }
}

import {
  ThreeDCanvas,
  HumanModel,
  BoneMarkerGroup,
  BoneControlPanel,
  HandEditorPanel,
  TechniqueLibrarySheet,
  SaveTechniqueSheet,
  StartingPositionSheet,
  AxisGizmo,
} from "@/modules/threed/components";
import type {
  ThreeDCanvasHandle,
  HumanModelHandle,
} from "@/modules/threed/components";
import {
  useSequenceEditor,
  useTechniques,
  useSequenceSteps,
  useStartingPositions,
} from "@/modules/threed/hooks";
import { getBoneBodyGroup } from "@/modules/threed/types/fk";
import { saveHandPreset } from "@/modules/threed/services/handPresetService";
import { useStore } from "@/store";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditorScreen() {
  const { sequenceId } = useLocalSearchParams<{ sequenceId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
  } = useSequenceEditor(sequenceId!);

  const { techniques } = useTechniques();
  const { positions } = useStartingPositions();
  const { steps } = useSequenceSteps(sequenceId);
  const zoomRef = useRef<ThreeDCanvasHandle>(null);
  const humanRef = useRef<HumanModelHandle>(null);

  const [showTechniqueLibrary, setShowTechniqueLibrary] = useState(false);
  const [showSaveTechnique, setShowSaveTechnique] = useState(false);
  const [showSavePosition, setShowSavePosition] = useState(false);
  const [showLoadPosition, setShowLoadPosition] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHandEditor, setShowHandEditor] = useState(false);
  const [handSceneCenter, setHandSceneCenter] = useState<
    [number, number, number] | null
  >(null);

  const sceneCenter = useMemo(() => {
    if (handSceneCenter) {
      return handSceneCenter;
    }
    return calculateSceneCenter([0, 0, 0], partnerEnabled, [1.5, 0, 0]);
  }, [handSceneCenter, partnerEnabled]);

  const cameraDistance = handSceneCenter ? 1.2 : undefined;

  const handleSelectBone = useCallback(
    (boneName: FKBoneName) => {
      setSelectedBone(boneName);
      const group = getBoneBodyGroup(boneName);
      if (group !== "leftHand" && group !== "rightHand") {
        setShowHandEditor(false);
        setHandSceneCenter(null);
      }
    },
    [setSelectedBone],
  );

  const handleOpenHandEditor = useCallback(() => {
    setShowHandEditor(true);

    if (humanRef.current && selectedBone) {
      const handPos = humanRef.current.getBoneWorldPosition(selectedBone);
      if (handPos) {
        setHandSceneCenter([handPos.x, handPos.y + 0.3, handPos.z]);
      }
    }
  }, [selectedBone]);

  const handleCloseHandEditor = useCallback(() => {
    setShowHandEditor(false);
    setHandSceneCenter(null);
    handleDeselectAll();
  }, [handleDeselectAll]);

  const handleSaveStep = async () => {
    try {
      setIsSaving(true);
      await saveCurrentStep();
    } catch (err) {
      console.error("[EditorScreen] Save step error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNextStep = async () => {
    try {
      setIsSaving(true);
      await addNextStep();
    } catch (err) {
      console.error("[EditorScreen] Add next step error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetBone = useCallback(
    (boneName: string) => {
      handleBoneRotationChange(boneName, { x: 0, y: 0, z: 0, w: 1 });
      handleBonePositionChange(boneName, { x: 0, y: 0, z: 0 });
    },
    [handleBoneRotationChange, handleBonePositionChange],
  );

  const { user } = useStore();

  const handleSaveHandPreset = useCallback(
    async (presetName: string) => {
      if (!user || !selectedBone) {
        throw new Error("handPresetNoUserOrBone");
      }

      const handSide = selectedBone.includes("R") ? "R" : "L";

      try {
        await saveHandPreset(user.id, presetName, boneTransforms, handSide);
      } catch (err) {
        console.error("[EditorScreen] Hand preset save error:", err);
        throw err;
      }
    },
    [user, selectedBone, boneTransforms],
  );

  const selectedBoneLabel = selectedBone
    ? t(FK_BONE_DISPLAY_KEYS[selectedBone as FKBoneName])
    : null;

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack flex={55}>
        <CanvasErrorBoundary>
          <ThreeDCanvas
            zoomRef={zoomRef}
            sceneCenter={sceneCenter}
            cameraDistance={cameraDistance}
            onPointerMissed={handleDeselectAll}
          >
            <HumanModel
              ref={humanRef}
              modelSlot={0}
              boneTransforms={boneTransforms}
              onRestPoseReady={handleRestPoseReady}
            />

            {partnerEnabled && (
              <HumanModel modelSlot={1} color="#cc3333" boneTransforms={{}} />
            )}

            <BoneMarkerGroup
              humanRef={humanRef}
              selectedBone={selectedBone}
              onSelectBone={handleSelectBone}
            />

            <AxisGizmo />
          </ThreeDCanvas>
        </CanvasErrorBoundary>

        <YStack position="absolute" right="$3" bottom="$3" gap="$2">
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
          <XStack gap="$2" justifyContent="center">
            <Button
              size="$4"
              circular
              icon={<Plus size={20} pointerEvents="none" />}
              onPress={() => zoomRef.current?.zoomIn()}
            />
            <Button
              size="$4"
              circular
              icon={<Minus size={20} pointerEvents="none" />}
              onPress={() => zoomRef.current?.zoomOut()}
            />
          </XStack>
        </YStack>

        {selectedBone && (
          <XStack
            position="absolute"
            top="$3"
            left="$3"
            backgroundColor="$backgroundHover"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
          >
            <Text fontSize="$3" color="$color">
              {selectedBoneLabel ?? selectedBone}
            </Text>
          </XStack>
        )}
      </YStack>

      {!showHandEditor && (
        <XStack
          height={52}
          borderTopWidth={1}
          borderTopColor="$borderColor"
          backgroundColor="$backgroundStrong"
          alignItems="center"
          paddingHorizontal="$2"
          gap="$2"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 4,
            }}
          >
            {steps.map((step, index) => {
              const isActive = step.id === currentStep?.id;
              return (
                <Pressable key={step.id} onPress={() => loadStep(step)}>
                  <YStack
                    width={36}
                    height={36}
                    borderRadius="$3"
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor={isActive ? "$blue9" : "$backgroundHover"}
                    borderWidth={isActive ? 2 : 1}
                    borderColor={isActive ? "$blue9" : "$borderColor"}
                  >
                    <Text
                      fontSize="$2"
                      fontWeight="600"
                      color={isActive ? "white" : "$color"}
                    >
                      {index + 1}
                    </Text>
                  </YStack>
                </Pressable>
              );
            })}
          </ScrollView>

          <Button
            size="$3"
            circular
            icon={<Plus size={16} pointerEvents="none" />}
            onPress={handleAddNextStep}
            disabled={isSaving}
            opacity={isSaving ? 0.6 : 1}
            theme="active"
          />
        </XStack>
      )}

      <YStack
        flex={Platform.OS === "android" ? 50 : 40}
        paddingBottom={
          Platform.OS === "android" ? Math.max(insets.bottom, 36) : undefined
        }
      >
        {showHandEditor ? (
          <HandEditorPanel
            selectedBone={selectedBone}
            boneTransforms={boneTransforms}
            onBoneSelect={setSelectedBone}
            onRotationChange={handleBoneRotationChange}
            onPositionChange={handleBonePositionChange}
            onDeselect={handleCloseHandEditor}
            onResetBone={handleResetBone}
            onSaveHandPreset={handleSaveHandPreset}
            onApplyPreset={(transforms) => {
              Object.entries(transforms).forEach(([boneName, transform]) => {
                handleBoneRotationChange(boneName, transform.rotation);
                if (transform.position) {
                  handleBonePositionChange(boneName, transform.position);
                }
              });
            }}
          />
        ) : selectedBone ? (
          <BoneControlPanel
            selectedBone={selectedBone}
            currentTransform={boneTransforms[selectedBone]}
            onRotationChange={handleBoneRotationChange}
            onPositionChange={handleBonePositionChange}
            onDeselect={handleDeselectAll}
            onResetBone={handleResetBone}
          />
        ) : (
          <XStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            borderTopWidth={1}
            borderTopColor="$borderColor"
          >
            <Text fontSize="$3" color="$colorSubtle">
              {t("threedNoBoneSelected")}
            </Text>
          </XStack>
        )}

        {!showHandEditor && (
          <XStack
            padding="$2"
            gap="$2"
            backgroundColor="$background"
            flexWrap="wrap"
            alignItems="center"
            justifyContent="center"
            paddingBottom={
              Platform.OS === "android"
                ? Math.max(insets.bottom, 36)
                : undefined
            }
          >
            {!selectedBone && (
              <>
                <Button
                  size="$3"
                  onPress={() => setPartnerEnabled(!partnerEnabled)}
                >
                  {partnerEnabled
                    ? t("threedRemovePartner")
                    : t("threedAddPartner")}
                </Button>

                <Button size="$3" onPress={resetPose}>
                  {t("reset")}
                </Button>

                <Button size="$3" onPress={() => setShowSavePosition(true)}>
                  {t("threedSaveStartingPosition")}
                </Button>

                {positions.length > 0 && (
                  <Button size="$3" onPress={() => setShowLoadPosition(true)}>
                    {t("threedStartingPositions")}
                  </Button>
                )}
              </>
            )}

            {selectedBone && (
              <>
                <Button
                  size="$3"
                  onPress={mirrorSelectedToOpposite}
                  disabled={!(selectedBone in FK_MIRROR_MAP)}
                >
                  {t("threedMirror")}
                </Button>

                {selectedBodyGroup && (
                  <Button size="$3" onPress={() => setShowSaveTechnique(true)}>
                    {t("threedSaveTechnique")}
                  </Button>
                )}

                <Button size="$3" onPress={() => setShowTechniqueLibrary(true)}>
                  {t("threedTechniques")}
                </Button>
              </>
            )}

            {(selectedBone === "DEF-handL" || selectedBone === "DEF-handR") && (
              <Button size="$3" onPress={handleOpenHandEditor} theme="active">
                {t("handEditFingers")}
              </Button>
            )}

            <Button
              size="$3"
              theme="active"
              onPress={handleSaveStep}
              disabled={isSaving}
              opacity={isSaving ? 0.6 : 1}
            >
              {currentStep ? t("threedUpdateStep") : t("threedSaveStep")}
            </Button>

            <Button size="$3" variant="outlined" onPress={() => router.back()}>
              {t("back")}
            </Button>
          </XStack>
        )}
      </YStack>

      <TechniqueLibrarySheet
        open={showTechniqueLibrary}
        onOpenChange={setShowTechniqueLibrary}
        techniques={techniques}
        filterBodyPart={selectedBodyGroup}
        onSelect={(technique) => {
          applyTechnique(technique);
          setShowTechniqueLibrary(false);
        }}
      />

      <SaveTechniqueSheet
        open={showSaveTechnique}
        onOpenChange={setShowSaveTechnique}
        bodyPart={selectedBodyGroup}
        onSave={(title) => {
          saveTechniqueFromSelection(title);
          setShowSaveTechnique(false);
        }}
      />

      <SaveTechniqueSheet
        open={showSavePosition}
        onOpenChange={setShowSavePosition}
        bodyPart={null}
        onSave={(title) => {
          saveAsStartingPosition(title);
          setShowSavePosition(false);
        }}
      />

      <StartingPositionSheet
        open={showLoadPosition}
        onOpenChange={setShowLoadPosition}
        positions={positions}
        onSelect={(position) => {
          applyTechnique(position);
          setShowLoadPosition(false);
        }}
      />
    </YStack>
  );
}
