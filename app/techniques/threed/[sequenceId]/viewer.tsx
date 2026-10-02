import React, { Component } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Text, XStack, YStack } from "tamagui";

import { ThreeDCanvas, HumanModel } from "@/modules/threed/components";
import { useSequenceViewer } from "@/modules/threed/hooks";
import { LoadingScreen } from "@/modules/core/components";

class CanvasErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[CanvasErrorBoundary] Viewer:", error);
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
          <Text color="#fff">
            3D rendering is not available on this device.
          </Text>
        </YStack>
      );
    }
    return this.props.children;
  }
}

export default function ViewerScreen() {
  const { sequenceId } = useLocalSearchParams<{
    sequenceId: string;
  }>();
  const router = useRouter();

  const {
    currentStepIndex,
    totalSteps,
    displayTransforms,
    isInterpolating,
    isLoading,
    goToNextStep,
    goToPreviousStep,
  } = useSequenceViewer(sequenceId!);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <YStack flex={1}>
      <YStack flex={1}>
        <CanvasErrorBoundary>
          <ThreeDCanvas>
            <HumanModel modelSlot={0} boneTransforms={displayTransforms} />
          </ThreeDCanvas>
        </CanvasErrorBoundary>
      </YStack>

      <XStack
        padding="$4"
        gap="$3"
        justifyContent="center"
        alignItems="center"
        backgroundColor="$background"
      >
        <Button size="$3" variant="outlined" onPress={() => router.back()}>
          {t("back")}
        </Button>

        <Button
          size="$3"
          onPress={goToPreviousStep}
          disabled={currentStepIndex === 0 || isInterpolating}
          opacity={currentStepIndex === 0 || isInterpolating ? 0.5 : 1}
        >
          {t("previous")}
        </Button>

        <Text
          fontSize="$4"
          fontWeight="600"
          color="$textPrimary"
          minWidth={60}
          textAlign="center"
        >
          {totalSteps > 0 ? `${currentStepIndex + 1} / ${totalSteps}` : "0 / 0"}
        </Text>

        <Button
          size="$3"
          onPress={goToNextStep}
          disabled={currentStepIndex === totalSteps - 1 || isInterpolating}
          opacity={
            currentStepIndex === totalSteps - 1 || isInterpolating ? 0.5 : 1
          }
        >
          {t("next")}
        </Button>
      </XStack>
    </YStack>
  );
}
