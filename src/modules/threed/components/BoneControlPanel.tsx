import React, { useRef, useCallback } from "react";
import { PanResponder, View, StyleSheet } from "react-native";
import { Button, Text, XStack, YStack } from "tamagui";
import { RotateCcw, X } from "lucide-react-native";
import * as THREE from "three";
import type { FKBoneName } from "../types/fk";
import type { BoneTransform } from "../types/fk";
import type { Quat, Vec3 } from "../types/data";

// =============================================================================
// Sensitivity constants
// =============================================================================

const ROT_SENSITIVITY = 0.007; // rad/px – rotation X/Y
const ROLL_SENSITIVITY = 0.007; // rad/px – rotation Z
const TRANS_SENSITIVITY = 0.0005; // units/px – translation X/Y

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);

// =============================================================================
// Helpers
// =============================================================================

function applyRotationDelta(
  current: Quat,
  pitchDelta: number,
  yawDelta: number,
  rollDelta: number,
): Quat {
  const dPitch = new THREE.Quaternion().setFromAxisAngle(AXIS_X, pitchDelta);
  const dYaw = new THREE.Quaternion().setFromAxisAngle(AXIS_Y, yawDelta);
  const dRoll = new THREE.Quaternion().setFromAxisAngle(AXIS_Z, rollDelta);

  const delta = dYaw.clone().multiply(dPitch).multiply(dRoll);
  const currentQ = new THREE.Quaternion(
    current.x,
    current.y,
    current.z,
    current.w,
  );
  const result = delta.multiply(currentQ);

  return { x: result.x, y: result.y, z: result.z, w: result.w };
}

// =============================================================================
// Slider – horizontal (X axis)
// =============================================================================

interface HSliderProps {
  label: string;
  onDelta: (dx: number) => void;
  width?: number;
}

const HSlider: React.FC<HSliderProps> = ({ label, onDelta, width = 80 }) => {
  const lastX = useRef<number | null>(null);
  const onDeltaRef = useRef(onDelta);
  onDeltaRef.current = onDelta;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        lastX.current = e.nativeEvent.pageX;
      },
      onPanResponderMove: (e) => {
        if (lastX.current === null) return;
        const nx = e.nativeEvent.pageX;
        const dx = nx - lastX.current;
        lastX.current = nx;
        onDeltaRef.current(dx);
      },
      onPanResponderRelease: () => {
        lastX.current = null;
      },
      onPanResponderTerminate: () => {
        lastX.current = null;
      },
    }),
  ).current;

  return (
    <YStack alignItems="center" gap="$1">
      <Text fontSize="$1" color="$textSecondary" textTransform="uppercase">
        {label}
      </Text>
      <View
        {...panResponder.panHandlers}
        style={[styles.hSliderTrack, { width }]}
      >
        <View style={styles.hSliderThumb} />
      </View>
    </YStack>
  );
};

// =============================================================================
// Slider – vertical (Y axis)
// =============================================================================

interface VSliderProps {
  label: string;
  onDelta: (dy: number) => void;
  height?: number;
}

const VSlider: React.FC<VSliderProps> = ({ label, onDelta, height = 80 }) => {
  const lastY = useRef<number | null>(null);
  const onDeltaRef = useRef(onDelta);
  onDeltaRef.current = onDelta;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        lastY.current = e.nativeEvent.pageY;
      },
      onPanResponderMove: (e) => {
        if (lastY.current === null) return;
        const ny = e.nativeEvent.pageY;
        const dy = ny - lastY.current;
        lastY.current = ny;
        onDeltaRef.current(dy);
      },
      onPanResponderRelease: () => {
        lastY.current = null;
      },
      onPanResponderTerminate: () => {
        lastY.current = null;
      },
    }),
  ).current;

  return (
    <YStack alignItems="center" gap="$1">
      <Text fontSize="$1" color="$textSecondary" textTransform="uppercase">
        {label}
      </Text>
      <View
        {...panResponder.panHandlers}
        style={[styles.vSliderTrack, { height }]}
      >
        <View style={styles.vSliderThumb} />
      </View>
    </YStack>
  );
};

// =============================================================================
// Slider (1-axis: horizontal drag) – used for Roll Z / Depth Z
// =============================================================================

interface SliderProps {
  label: string;
  onDelta: (dx: number) => void;
  width?: number;
}

const Slider: React.FC<SliderProps> = ({ label, onDelta, width = 80 }) => {
  const lastX = useRef<number | null>(null);
  const onDeltaRef = useRef(onDelta);
  onDeltaRef.current = onDelta;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        lastX.current = e.nativeEvent.pageX;
      },
      onPanResponderMove: (e) => {
        if (lastX.current === null) return;
        const nx = e.nativeEvent.pageX;
        const dx = nx - lastX.current;
        lastX.current = nx;
        onDeltaRef.current(dx);
      },
      onPanResponderRelease: () => {
        lastX.current = null;
      },
      onPanResponderTerminate: () => {
        lastX.current = null;
      },
    }),
  ).current;

  return (
    <YStack alignItems="center" gap="$1">
      <Text fontSize="$1" color="$textSecondary" textTransform="uppercase">
        {label}
      </Text>
      <View
        {...panResponder.panHandlers}
        style={[styles.sliderTrack, { width }]}
      >
        <View style={styles.sliderThumb} />
      </View>
    </YStack>
  );
};

// Only hips can be translated — translating other bones stretches the mesh
const TRANSLATABLE_BONES: FKBoneName[] = ["DEF-hips"];

// =============================================================================
// BoneControlPanel
// =============================================================================

interface BoneControlPanelProps {
  selectedBone: FKBoneName;
  currentTransform: BoneTransform | undefined;
  onRotationChange: (boneName: string, quat: Quat) => void;
  onPositionChange: (boneName: string, pos: Vec3) => void;
  onDeselect: () => void;
  onResetBone: (boneName: string) => void;
}

export const BoneControlPanel: React.FC<BoneControlPanelProps> = ({
  selectedBone,
  currentTransform,
  onRotationChange,
  onPositionChange,
  onDeselect,
  onResetBone,
}) => {
  const transformRef = useRef(currentTransform);
  transformRef.current = currentTransform;

  const canTranslate = TRANSLATABLE_BONES.includes(selectedBone);

  const handleRotateX = useCallback(
    (dx: number) => {
      const cur = transformRef.current?.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
      const newQuat = applyRotationDelta(cur, 0, -dx * ROT_SENSITIVITY, 0);
      onRotationChange(selectedBone, newQuat);
    },
    [selectedBone, onRotationChange],
  );

  const handleRotateY = useCallback(
    (dy: number) => {
      const cur = transformRef.current?.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
      const newQuat = applyRotationDelta(cur, dy * ROT_SENSITIVITY, 0, 0);
      onRotationChange(selectedBone, newQuat);
    },
    [selectedBone, onRotationChange],
  );

  const handleRollZ = useCallback(
    (dx: number) => {
      const cur = transformRef.current?.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
      const newQuat = applyRotationDelta(cur, 0, 0, dx * ROLL_SENSITIVITY);
      onRotationChange(selectedBone, newQuat);
    },
    [selectedBone, onRotationChange],
  );

  const handleTranslateX = useCallback(
    (dx: number) => {
      const cur = transformRef.current?.position ?? { x: 0, y: 0, z: 0 };
      onPositionChange(selectedBone, {
        x: cur.x + dx * TRANS_SENSITIVITY,
        y: cur.y,
        z: cur.z,
      });
    },
    [selectedBone, onPositionChange],
  );

  const handleTranslateY = useCallback(
    (dy: number) => {
      const cur = transformRef.current?.position ?? { x: 0, y: 0, z: 0 };
      onPositionChange(selectedBone, {
        x: cur.x,
        y: cur.y + -dy * TRANS_SENSITIVITY,
        z: cur.z,
      });
    },
    [selectedBone, onPositionChange],
  );

  const handleDepthZ = useCallback(
    (dz: number) => {
      const cur = transformRef.current?.position ?? { x: 0, y: 0, z: 0 };
      onPositionChange(selectedBone, {
        x: cur.x,
        y: cur.y,
        z: cur.z + dz * TRANS_SENSITIVITY,
      });
    },
    [selectedBone, onPositionChange],
  );

  const euler = React.useMemo(() => {
    const q = currentTransform?.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
    const e = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(q.x, q.y, q.z, q.w),
      "XYZ",
    );
    const toDeg = (r: number) => (r * 180) / Math.PI;
    return {
      x: toDeg(e.x).toFixed(1),
      y: toDeg(e.y).toFixed(1),
      z: toDeg(e.z).toFixed(1),
    };
  }, [currentTransform?.rotation]);

  const pos = currentTransform?.position ?? { x: 0, y: 0, z: 0 };

  return (
    <YStack
      flex={1}
      backgroundColor="$$softGrayLight"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      paddingHorizontal="$3"
      paddingVertical="$2"
      gap="$2"
    >
      <XStack
        flex={1}
        gap="$2"
        alignItems="center"
        justifyContent="space-around"
      >
        <YStack alignItems="center" gap="$1">
          <Text
            fontSize="$1"
            color="$textSecondary"
            fontWeight="600"
            textTransform="uppercase"
          >
            {t("threedRotateMode")}
          </Text>
          <XStack gap="$2" alignItems="center">
            <HSlider
              label={t("threedRotateX")}
              onDelta={handleRotateX}
              width={72}
            />
            <VSlider
              label={t("threedRotateY")}
              onDelta={handleRotateY}
              height={72}
            />
            <Slider label={t("threedRollZ")} onDelta={handleRollZ} width={64} />
          </XStack>
        </YStack>

        {canTranslate && (
          <>
            <View style={styles.divider} />

            <YStack alignItems="center" gap="$1">
              <Text
                fontSize="$1"
                color="$textSecondary"
                fontWeight="600"
                textTransform="uppercase"
              >
                {t("threedTranslateMode")}
              </Text>
              <XStack gap="$2" alignItems="center">
                <HSlider
                  label={t("threedMoveX")}
                  onDelta={handleTranslateX}
                  width={72}
                />
                <VSlider
                  label={t("threedMoveY")}
                  onDelta={handleTranslateY}
                  height={72}
                />
                <Slider
                  label={t("threedDepthZ")}
                  onDelta={handleDepthZ}
                  width={64}
                />
              </XStack>
            </YStack>
          </>
        )}

        <YStack gap="$2" alignItems="center">
          <Button
            size="$2"
            icon={<RotateCcw size={14} />}
            onPress={() => onResetBone(selectedBone)}
            chromeless
          >
            {t("reset")}
          </Button>
        </YStack>
      </XStack>
    </YStack>
  );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  hSliderTrack: {
    height: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  hSliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  vSliderTrack: {
    width: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  vSliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  sliderTrack: {
    height: 90,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderThumb: {
    width: 32,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  divider: {
    width: 1,
    height: "80%",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
