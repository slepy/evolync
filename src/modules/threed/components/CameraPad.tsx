import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ZoomIn, ZoomOut } from "lucide-react-native";
import type { RefObject } from "react";
import { View, XStack, YStack } from "tamagui";
import type { ThreeDCanvasHandle } from "./ThreeDCanvas";
import { RoundButton } from "./RoundButton";

/** Camera buttons over the editor scene (D8): rotate up / left / down / right, zoom in / out, on a 3-column grid. */
export function CameraPad({ camera }: { camera: RefObject<ThreeDCanvasHandle | null> }) {
  const button = (icon: typeof ChevronUp, label: string, action: (c: ThreeDCanvasHandle) => void) => (
    <RoundButton variant="control" size={44} icon={icon} label={label} onPress={() => camera.current && action(camera.current)} />
  );
  const gap = <View width={44} height={44} />;
  return (
    <YStack gap={6}>
      <XStack gap={6}>
        {gap}
        {button(ChevronUp, t("threedRotateUp"), (c) => c.rotateUp())}
        {gap}
      </XStack>
      <XStack gap={6}>
        {button(ChevronLeft, t("threedRotateLeft"), (c) => c.rotateLeft())}
        {button(ChevronDown, t("threedRotateDown"), (c) => c.rotateDown())}
        {button(ChevronRight, t("threedRotateRight"), (c) => c.rotateRight())}
      </XStack>
      <XStack gap={6}>
        {gap}
        {button(ZoomIn, t("threedZoomIn"), (c) => c.zoomIn())}
        {button(ZoomOut, t("threedZoomOut"), (c) => c.zoomOut())}
      </XStack>
    </YStack>
  );
}
