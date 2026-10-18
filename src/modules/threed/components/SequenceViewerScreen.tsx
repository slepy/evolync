import { resolveListAccent } from "@/core/components";
import { threedScene } from "@/core/theme/tokens";
import { LoadingScreen } from "@/modules/core/components";
import { useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, XStack, YStack } from "tamagui";
import { useSequenceDetails, useSequenceViewer } from "../hooks";
import { AxisGizmo } from "./AxisGizmo";
import { HumanModel } from "./HumanModel";
import { RoundButton } from "./RoundButton";
import { SceneScreen } from "./SceneScreen";
import { ThreeDCanvas } from "./ThreeDCanvas";

const lime = resolveListAccent("threed");

/**
 * Viewer (D9): the sequence on the real model, full screen; a floating card
 * with one progress segment per step and Previous / Next around "STEP 2 OF 6".
 */
export function SequenceViewerScreen() {
  const { sequenceId } = useLocalSearchParams<{ sequenceId: string }>();
  const { sequence } = useSequenceDetails(sequenceId);
  const { currentStepIndex, totalSteps, displayTransforms, isInterpolating, isLoading, goToNextStep, goToPreviousStep } =
    useSequenceViewer(sequenceId!);

  if (isLoading) return <LoadingScreen />;

  const atStart = currentStepIndex === 0;
  const atEnd = totalSteps === 0 || currentStepIndex === totalSteps - 1;

  return (
    <SceneScreen
      header={{ title: sequence?.title ?? "", compact: true, right: false }}
      scene={
        <ThreeDCanvas>
          <HumanModel modelSlot={0} boneTransforms={displayTransforms} />
          <AxisGizmo />
        </ThreeDCanvas>
      }
      overlay={
        <SafeAreaView edges={["bottom"]} style={{ position: "absolute", left: 16, right: 16, bottom: 0 }}>
          <YStack
            marginBottom={24}
            gap={14}
            padding={16}
            borderRadius="$header"
            borderWidth={1}
            borderColor="$neutralRaisedBorder"
            backgroundColor={threedScene.control}
          >
            {totalSteps > 0 ? (
              <XStack gap={4}>
                {Array.from({ length: totalSteps }, (_, index) => (
                  <View
                    key={index}
                    flex={1}
                    height={6}
                    borderRadius={3}
                    backgroundColor={index <= currentStepIndex ? lime.tint : "$neutralRaisedBorder"}
                  />
                ))}
              </XStack>
            ) : null}
            <XStack alignItems="center" gap={12}>
              <RoundButton
                icon={ChevronLeft}
                label={t("threedPreviousStep")}
                onPress={goToPreviousStep}
                disabled={atStart || isInterpolating}
              />
              <YStack flex={1} alignItems="center" gap={2}>
                <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color={lime.tint}>
                  {totalSteps > 0
                    ? t("threedStepOf", { n: currentStepIndex + 1, total: totalSteps })
                    : t("threedNoSteps")}
                </Text>
              </YStack>
              <RoundButton
                variant="lime"
                icon={ChevronRight}
                label={t("threedNextStep")}
                onPress={goToNextStep}
                disabled={atEnd || isInterpolating}
              />
            </XStack>
          </YStack>
        </SafeAreaView>
      }
    />
  );
}
