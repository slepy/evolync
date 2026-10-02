import React, { Component } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Text, XStack, YStack } from "tamagui";

import { ThreeDCanvas } from "@/modules/threed/components/ThreeDCanvas";
import { HumanModel } from "@/modules/threed/components/HumanModel";
import { LoadingScreen } from "@/modules/core/components";
import { normalizeTechniqueData } from "@/modules/threed/utils/dataCompat";
import type { BoneTransformMap } from "@/modules/threed/types";
import { useTechniqueById } from "@/modules/threed/hooks";

class CanvasErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[CanvasErrorBoundary] TechniqueViewer:", error);
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

export default function TechniqueViewerScreen() {
  const { techniqueId } = useLocalSearchParams<{ techniqueId: string }>();
  const router = useRouter();

  const { technique, isLoading } = useTechniqueById(techniqueId!);

  if (isLoading) {
    return <LoadingScreen />;
  }

  let boneTransforms: BoneTransformMap = {};
  if (technique) {
    try {
      const normalized = normalizeTechniqueData(technique.techniqueData);
      boneTransforms = normalized.boneTransforms;
    } catch (error) {
      console.error("[TechniqueViewerScreen] Failed to parse data:", error);
    }
  }

  return (
    <YStack flex={1}>
      <YStack flex={1}>
        <CanvasErrorBoundary>
          <ThreeDCanvas>
            <HumanModel modelSlot={0} boneTransforms={boneTransforms} />
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

        {technique && (
          <Text
            fontSize="$4"
            fontWeight="600"
            color="$textPrimary"
            flex={1}
            textAlign="center"
          >
            {technique.title}
          </Text>
        )}
      </XStack>
    </YStack>
  );
}
