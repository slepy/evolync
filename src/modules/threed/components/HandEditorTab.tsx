import React, { useState } from "react";
import { Pressable } from "react-native";
import { Text, XStack, YStack, Button } from "tamagui";
import { BoneControlPanel } from "./BoneControlPanel";
import {
  FINGER_TYPE,
  FINGER_LABEL_KEYS,
  getFingerBone,
} from "../types/fk";
import type { FKBoneName, BoneTransformMap, FingerType } from "../types/fk";
import type { Quat, Vec3 } from "../types/data";

const FINGERS = Object.values(FINGER_TYPE) as FingerType[];

// =============================================================================
// Props
// =============================================================================

interface HandEditorTabProps {
  selectedBone: FKBoneName | null;
  boneTransforms: BoneTransformMap;
  onBoneSelect: (boneName: FKBoneName) => void;
  onRotationChange: (boneName: string, quat: Quat) => void;
  onPositionChange: (boneName: string, pos: Vec3) => void;
  onDeselect: () => void;
  onResetBone: (boneName: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export const HandEditorTab: React.FC<HandEditorTabProps> = ({
  selectedBone,
  boneTransforms,
  onBoneSelect,
  onRotationChange,
  onPositionChange,
  onDeselect,
  onResetBone,
}) => {
  const [selectedFinger, setSelectedFinger] = useState<FingerType>(
    FINGER_TYPE.INDEX
  );
  const [selectedSegment, setSelectedSegment] = useState<1 | 2 | 3>(1);

  // Derive current hand side from the selectedBone suffix
  const side: "L" | "R" = selectedBone?.endsWith("R") ? "R" : "L";

  const switchHand = (newSide: "L" | "R") => {
    onBoneSelect(getFingerBone(selectedFinger, selectedSegment, newSide));
  };

  const handleFingerSelect = (finger: FingerType) => {
    setSelectedFinger(finger);
    onBoneSelect(getFingerBone(finger, selectedSegment, side));
  };

  const handleSegmentSelect = (segment: 1 | 2 | 3) => {
    setSelectedSegment(segment);
    onBoneSelect(getFingerBone(selectedFinger, segment, side));
  };

  const currentBone = getFingerBone(selectedFinger, selectedSegment, side);

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Hand L / R selector */}
      <XStack
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        padding="$2"
        gap="$2"
      >
        <Button
          flex={1}
          size="$2"
          theme={side === "L" ? "active" : undefined}
          onPress={() => switchHand("L")}
        >
          {t("handLeft")}
        </Button>
        <Button
          flex={1}
          size="$2"
          theme={side === "R" ? "active" : undefined}
          onPress={() => switchHand("R")}
        >
          {t("handRight")}
        </Button>
      </XStack>

      {/* Finger selector */}
      <XStack
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        paddingHorizontal="$3"
        paddingVertical="$2"
        justifyContent="space-around"
      >
        {FINGERS.map((finger) => {
          const isActive = selectedFinger === finger;
          return (
            <Pressable
              key={finger}
              onPress={() => handleFingerSelect(finger)}
            >
              <YStack
                minWidth={56}
                paddingHorizontal="$2"
                height={36}
                alignItems="center"
                justifyContent="center"
                borderRadius="$3"
                backgroundColor={isActive ? "$blue9" : "$backgroundHover"}
                borderWidth={1}
                borderColor={isActive ? "$blue9" : "$borderColor"}
              >
                <Text
                  fontSize="$2"
                  fontWeight="600"
                  color={isActive ? "white" : "$color"}
                  textAlign="center"
                  numberOfLines={1}
                >
                  {t(FINGER_LABEL_KEYS[finger])}
                </Text>
              </YStack>
            </Pressable>
          );
        })}
      </XStack>

      {/* Segment selector (1 = base / MCP, 2 = middle / PIP, 3 = tip / DIP) */}
      <XStack
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        padding="$2"
        gap="$2"
      >
        {([1, 2, 3] as const).map((seg) => (
          <Button
            key={seg}
            flex={1}
            size="$2"
            theme={selectedSegment === seg ? "active" : undefined}
            onPress={() => handleSegmentSelect(seg)}
          >
            {t("handSegment", { n: seg })}
          </Button>
        ))}
      </XStack>

      {/* Rotation controls – reuse BoneControlPanel */}
      <YStack flex={1}>
        <BoneControlPanel
          selectedBone={currentBone}
          currentTransform={boneTransforms[currentBone]}
          onRotationChange={onRotationChange}
          onPositionChange={onPositionChange}
          onDeselect={onDeselect}
          onResetBone={onResetBone}
        />
      </YStack>
    </YStack>
  );
};
