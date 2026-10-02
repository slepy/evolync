import React, { useState, useCallback } from "react";
import { Text, XStack, YStack, Button, ScrollView } from "tamagui";
import { AlertCircle, X } from "lucide-react-native";
import * as THREE from "three"; // Used for quaternion/euler conversions in mirror

import {
  TextInput,
  SubmitComponent,
  BaseCard,
} from "@/modules/core/components";
import { HandEditorTab } from "./HandEditorTab";
import { FK_BODY_GROUPS, FK_MIRROR_MAP } from "../types/fk";
import type { FKBoneName, BoneTransformMap } from "../types/fk";
import type { Quat, Vec3 } from "../types/data";
import { useStore } from "@/store";
import { useHandPresetsByUserAndSide } from "../hooks/useHandPresetsByUserAndSide";

// =============================================================================
// Props
// =============================================================================

interface HandEditorPanelProps {
  selectedBone: FKBoneName | null;
  boneTransforms: BoneTransformMap;
  onBoneSelect: (boneName: FKBoneName) => void;
  onRotationChange: (boneName: string, quat: Quat) => void;
  onPositionChange: (boneName: string, pos: Vec3) => void;
  onDeselect: () => void;
  onResetBone: (boneName: string) => void;
  onSaveHandPreset: (presetName: string) => Promise<void>;
  onApplyPreset: (boneTransforms: BoneTransformMap) => void;
}

// =============================================================================
// Component
// =============================================================================

export const HandEditorPanel: React.FC<HandEditorPanelProps> = ({
  selectedBone,
  boneTransforms,
  onBoneSelect,
  onRotationChange,
  onPositionChange,
  onDeselect,
  onResetBone,
  onSaveHandPreset,
  onApplyPreset,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPresetsList, setShowPresetssList] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { user } = useStore();
  const side: "L" | "R" = selectedBone?.includes("R") ? "R" : "L";
  const { presets } = useHandPresetsByUserAndSide(side);

  const handleMirrorHand = useCallback(() => {
    // Mirror all finger bones from one hand to the other
    if (!selectedBone) return;

    // Get all finger bones from source hand
    const sourceGroup =
      side === "L" ? FK_BODY_GROUPS.leftHand : FK_BODY_GROUPS.rightHand;

    // Copy transforms from source to target using FK_MIRROR_MAP for proper bone mapping
    sourceGroup.forEach((sourceBone) => {
      if (sourceBone in boneTransforms) {
        // Use FK_MIRROR_MAP to find corresponding bone on other side
        const targetBone = FK_MIRROR_MAP[sourceBone];
        if (!targetBone) return;

        const sourceTransform = boneTransforms[sourceBone];

        // Convert quaternion to Euler angles, mirror them, convert back
        // This properly accounts for the different rest poses of left/right hands
        const sourceQuat = new THREE.Quaternion(
          sourceTransform.rotation.x,
          sourceTransform.rotation.y,
          sourceTransform.rotation.z,
          sourceTransform.rotation.w,
        );

        // Convert to Euler (XYZ order)
        const euler = new THREE.Euler().setFromQuaternion(sourceQuat, "XYZ");

        // Mirror: negate Y and Z rotations (keeps X as is for proper hand mirroring)
        // This accounts for the left/right hand structural differences
        euler.y = -euler.y;
        euler.z = -euler.z;

        // Convert back to quaternion
        const mirrorQuat = new THREE.Quaternion().setFromEuler(euler);

        const mirrorQuaternion = {
          x: mirrorQuat.x,
          y: mirrorQuat.y,
          z: mirrorQuat.z,
          w: mirrorQuat.w,
        };
        onRotationChange(targetBone, mirrorQuaternion);
      }
    });
  }, [selectedBone, side, boneTransforms, onRotationChange]);

  const handleSavePreset = async () => {
    if (!presetName.trim() || !user) {
      setSaveError(t("handPresetNameEmpty"));
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      await onSaveHandPreset(presetName);
      setShowSuccess(true);
      setPresetName("");
      setShowSaveDialog(false);
      // Auto-hide success message after 2 seconds
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[HandEditorPanel] Save preset error:", err);
      // Try to translate error message if it's a translation key
      setSaveError(t(errorMsg) || t("handPresetSaveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPreset = useCallback(
    (preset: (typeof presets)[0]) => {
      try {
        const transforms = preset.presetData;
        // Convert BoneTransformMap to the format expected by onApplyPreset
        onApplyPreset(transforms);
        setShowPresetssList(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (err) {
        console.error("[HandEditorPanel] Apply preset error:", err);
        setSaveError(t("handPresetSaveError"));
      }
    },
    [onApplyPreset],
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Main hand editor */}
      <YStack flex={1}>
        <HandEditorTab
          selectedBone={selectedBone}
          boneTransforms={boneTransforms}
          onBoneSelect={onBoneSelect}
          onRotationChange={onRotationChange}
          onPositionChange={onPositionChange}
          onDeselect={onDeselect}
          onResetBone={onResetBone}
        />
      </YStack>

      {/* Hand-specific actions */}
      <XStack
        padding="$2"
        gap="$2"
        backgroundColor="$background"
        flexWrap="wrap"
        alignItems="center"
        justifyContent="center"
        borderTopWidth={1}
        borderTopColor="$borderColor"
      >
        <Button
          size="$3"
          onPress={handleMirrorHand}
          disabled={!selectedBone}
          theme="active"
        >
          {side === "L" ? t("threedMirrorToRight") : t("threedMirrorToLeft")}
        </Button>

        {presets.length > 0 && (
          <Button
            size="$3"
            onPress={() => setShowPresetssList(!showPresetsList)}
            theme="active"
          >
            {t("threedApplyHandPreset")}
          </Button>
        )}

        <Button
          size="$3"
          onPress={() => setShowSaveDialog(true)}
          disabled={isSaving}
          opacity={isSaving ? 0.6 : 1}
        >
          {t("threedSaveHandPreset")}
        </Button>

        <Button size="$3" variant="outlined" onPress={onDeselect}>
          {t("threedCloseHandEditor")}
        </Button>
      </XStack>

      {/* Presets list - shown when button is pressed */}
      {showPresetsList && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="$background"
          zIndex={999}
          flex={1}
        >
          {/* Header */}
          <XStack
            padding="$3"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Text fontSize="$4" fontWeight="700">
              {t("threedApplyHandPreset")}
            </Text>
            <Button
              size="$2"
              icon={<X size={20} />}
              chromeless
              onPress={() => setShowPresetssList(false)}
            />
          </XStack>

          {/* Presets list */}
          <ScrollView flex={1} padding="$2">
            <YStack gap="$2">
              {presets.map((preset) => (
                <BaseCard
                  key={preset.id}
                  onPress={() => handleApplyPreset(preset)}
                >
                  <YStack padding="$3" gap="$1">
                    <Text fontSize="$3" fontWeight="600">
                      {preset.name}
                    </Text>
                    <Text fontSize="$2" color="$textSecondary">
                      {new Date(preset.createdAt).toLocaleDateString()}
                    </Text>
                  </YStack>
                </BaseCard>
              ))}
            </YStack>
          </ScrollView>
        </YStack>
      )}

      {/* Save preset fullscreen form */}
      {showSaveDialog && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="$background"
          zIndex={999}
          flex={1}
        >
          {/* Content area with form */}
          <YStack
            flex={1}
            padding="$4"
            justifyContent="center"
            alignItems="center"
          >
            <YStack width="100%" maxWidth={400} gap="$4">
              {/* Header with close button */}
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="700" color="$textPrimary">
                  {t("threedSaveHandPreset")}
                </Text>
                <Button
                  size="$2"
                  icon={<X size={20} />}
                  chromeless
                  onPress={() => setShowSaveDialog(false)}
                />
              </XStack>

              <TextInput
                value={presetName}
                onChangeText={(text) => {
                  setPresetName(text);
                  setSaveError(null);
                }}
                placeholder={t("threedPresetNamePlaceholder")}
                label={t("fieldName")}
              />

              {saveError && (
                <XStack
                  backgroundColor="$red2"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$3"
                  gap="$2"
                  alignItems="center"
                >
                  <AlertCircle size={16} color="$red9" />
                  <Text fontSize="$2" color="$red9" flex={1}>
                    {saveError}
                  </Text>
                </XStack>
              )}
            </YStack>
          </YStack>

          {/* Submit button at bottom */}
          <SubmitComponent
            onPress={handleSavePreset}
            isLoading={isSaving}
            disabled={!presetName.trim() || isSaving}
            title={t("save")}
          />
        </YStack>
      )}

      {/* Success message - optional toast notification */}
      {showSuccess && (
        <YStack
          position="absolute"
          bottom={20}
          left={20}
          right={20}
          backgroundColor="$green9"
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderRadius="$3"
          alignItems="center"
          zIndex={999}
        >
          <Text fontSize="$3" color="white" fontWeight="600">
            {t("handPresetSaveSuccess")}
          </Text>
        </YStack>
      )}
    </YStack>
  );
};
