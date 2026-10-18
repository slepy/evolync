import { threedScene } from "@/core/theme/tokens";
import type { ReactNode } from "react";
import { View } from "tamagui";
import type { BoneTransformMap } from "../types/fk";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";
import { HumanModel } from "./HumanModel";
import { ThreeDCanvas } from "./ThreeDCanvas";

export interface PosePreviewProps {
  boneTransforms: BoneTransformMap;
  /** Default 260 (D6 sequence card). */
  height?: number;
  /** Chips and buttons over the model ("Step 1 of 6", View). */
  children?: ReactNode;
}

/**
 * The real 3D model in a pose, in a 22px-radius card (D6 sequence, D7
 * technique). Not interactive: touches go to the scroll view around it.
 */
export function PosePreview({ boneTransforms, height = 260, children }: PosePreviewProps) {
  return (
    <View height={height} borderRadius="$card" overflow="hidden" backgroundColor={threedScene.background}>
      <View flex={1} pointerEvents="none">
        <CanvasErrorBoundary>
          <ThreeDCanvas>
            <HumanModel modelSlot={0} boneTransforms={boneTransforms} />
          </ThreeDCanvas>
        </CanvasErrorBoundary>
      </View>
      {children}
    </View>
  );
}
