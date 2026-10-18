import { SubScreenHeader, type SubScreenHeaderProps } from "@/core/components";
import { threedScene } from "@/core/theme/tokens";
import type { ReactNode } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { View, YStack } from "tamagui";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";

export interface SceneScreenProps {
  header: SubScreenHeaderProps;
  /** The `<ThreeDCanvas>` with the model(s). */
  scene: ReactNode;
  /** Controls over the scene (camera pad, step chip), positioned absolutely. */
  overlay?: ReactNode;
  /** Bottom panel (steps and actions, joint panel); it overlaps the scene by 24px. */
  panel?: ReactNode;
  /** Panel gap; default 16. */
  panelGap?: number;
}

/**
 * Full-screen 3D layout (D7 preview, D8 editor, D9 viewer): the real model
 * fills the screen, the sub-screen header floats on it, and a card panel with
 * 28px top corners comes up from the bottom.
 */
export function SceneScreen({ header, scene, overlay, panel, panelGap = 16 }: SceneScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <YStack flex={1} backgroundColor={threedScene.background}>
      <View flex={1}>
        <CanvasErrorBoundary>{scene}</CanvasErrorBoundary>
        <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }} pointerEvents="box-none">
          <View paddingHorizontal={20} paddingTop={12} pointerEvents="box-none">
            <SubScreenHeader {...header} />
          </View>
        </SafeAreaView>
        {overlay}
      </View>
      {panel ? (
        <YStack
          marginTop={-24}
          gap={panelGap}
          paddingHorizontal={20}
          paddingTop={16}
          paddingBottom={Math.max(insets.bottom, 12) + 16}
          borderTopLeftRadius="$header"
          borderTopRightRadius="$header"
          borderTopWidth={1}
          borderColor="$neutralCardBorder"
          backgroundColor="$neutralCard"
        >
          {panel}
        </YStack>
      ) : null}
    </YStack>
  );
}
