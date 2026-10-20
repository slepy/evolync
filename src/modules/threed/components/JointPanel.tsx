import { resolveListAccent } from "@/core/components";
import { threedScene } from "@/core/theme/tokens";
import { Move, RotateCcw, RotateCw, X } from "lucide-react-native";
import { Text, XStack, YStack } from "tamagui";
import {
  AXES,
  formatCm,
  formatDeg,
  MOVE_RANGE_M,
  quatToEulerDeg,
  ROTATE_RANGE_DEG,
  type Axis,
} from "../jointAxes";
import type { Vec3 } from "../types/data";
import type { BoneTransform } from "../types/fk";
import { AxisSlider } from "./AxisSlider";
import { RoundButton } from "./RoundButton";
import { ModeOption } from "./ModeOption";
import type { JointMode } from "../types/tabs";

const lime = resolveListAccent("threed");

export const AXIS_COLORS: Record<Axis, string> = { x: threedScene.axisX, y: threedScene.axisY, z: threedScene.axisZ };

const ZERO: Vec3 = { x: 0, y: 0, z: 0 };

export interface JointPanelProps {
  /** "Right forearm". */
  name: string;
  transform: BoneTransform | undefined;
  mode: JointMode;
  onModeChange: (mode: JointMode) => void;
  /** Only the hips can move; other joints stretch the mesh. */
  canMove: boolean;
  onRotate: (axis: Axis, deg: number) => void;
  onMove: (axis: Axis, meters: number) => void;
  onReset: () => void;
  onDeselect: () => void;
}

/**
 * Selected joint (D8): JOINT eyebrow and name, reset and deselect, Rotate /
 * Move switch, one slider per axis. The tool row and Save follow it.
 */
export function JointPanel({ name, transform, mode, onModeChange, canMove, onRotate, onMove, onReset, onDeselect }: JointPanelProps) {
  const moving = mode === "move" && canMove;
  const euler = quatToEulerDeg(transform?.rotation);
  const position = transform?.position ?? ZERO;

  return (
    <YStack gap={16}>
      <XStack alignItems="center" gap={10}>
        <YStack flex={1} minWidth={0} gap={1}>
          <Text fontSize={11} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color={lime.tint}>
            {t("threedJoint")}
          </Text>
          <Text fontSize={18} fontWeight="$section" color="$neutralText" numberOfLines={1}>
            {name}
          </Text>
        </YStack>
        <RoundButton variant="control" size={40} icon={RotateCcw} label={t("threedResetJoint")} onPress={onReset} />
        <RoundButton size={40} icon={X} label={t("threedDeselect")} onPress={onDeselect} />
      </XStack>

      <XStack
        role="radiogroup"
        aria-label={t("threedMode")}
        gap={4}
        padding={4}
        borderRadius={22}
        borderWidth={1}
        borderColor="$neutralCardBorder"
        backgroundColor="$neutralPage"
      >
        <ModeOption icon={RotateCw} label={t("threedRotateMode")} on={!moving} onPress={() => onModeChange("rotate")} />
        <ModeOption
          icon={Move}
          label={t("threedTranslateMode")}
          on={moving}
          disabled={!canMove}
          onPress={() => onModeChange("move")}
        />
      </XStack>

      <YStack gap={6}>
        {AXES.map((axis) =>
          moving ? (
            <AxisSlider
              key={`move-${axis}`}
              axis={axis.toUpperCase()}
              color={AXIS_COLORS[axis]}
              value={position[axis]}
              range={MOVE_RANGE_M}
              format={formatCm}
              onChange={(meters) => onMove(axis, meters)}
            />
          ) : (
            <AxisSlider
              key={`rotate-${axis}`}
              axis={axis.toUpperCase()}
              color={AXIS_COLORS[axis]}
              value={euler[axis]}
              range={ROTATE_RANGE_DEG}
              format={formatDeg}
              onChange={(deg) => onRotate(axis, deg)}
            />
          ),
        )}
      </YStack>
    </YStack>
  );
}
