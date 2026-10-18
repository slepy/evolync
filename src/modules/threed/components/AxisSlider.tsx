import { resolveListAccent } from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { useRef, useState } from "react";
import { PanResponder } from "react-native";
import { Text, View, XStack } from "tamagui";
import { clampToRange, sliderFraction } from "../jointAxes";

const lime = resolveListAccent("threed");
const THUMB = 24;

export interface AxisSliderProps {
  /** "X" / "Y" / "Z". */
  axis: string;
  /** Axis color of the letter square (red / green / blue). */
  color: string;
  value: number;
  /** The slider runs from −range to +range, centered on 0. */
  range: number;
  /** Value text on the right ("+24°"). */
  format: (value: number) => string;
  onChange: (value: number) => void;
}

/**
 * One axis of the joint panel (D8) and the hand editor (D10): axis letter,
 * centered track with the lime span from 0 to the value, white thumb, value.
 * Dragging moves the value by the track's length per full range.
 */
export function AxisSlider({ axis, color, value, range, format, onChange }: AxisSliderProps) {
  const [width, setWidth] = useState(0);
  const start = useRef(0);
  const latest = useRef({ value, width, onChange });
  latest.current = { value, width, onChange };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        start.current = latest.current.value;
      },
      onPanResponderMove: (_, gesture) => {
        const { width: w, onChange: change } = latest.current;
        if (w <= 0) return;
        change(clampToRange(start.current + (gesture.dx / w) * 2 * range, range));
      },
    }),
  ).current;

  const fraction = sliderFraction(value, range);
  const left = Math.min(fraction, 0.5) * width;
  const span = Math.abs(fraction - 0.5) * width;

  return (
    <XStack alignItems="center" gap={12}>
      <View
        width={28}
        height={28}
        borderRadius={9}
        borderWidth={1}
        borderColor="$neutralRaisedBorder"
        backgroundColor="$neutralPage"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize={12} fontWeight="$button" color={color}>
          {axis}
        </Text>
      </View>
      <View
        flex={1}
        height={THUMB + 12}
        justifyContent="center"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...pan.panHandlers}
        role="slider"
        aria-label={axis}
        aria-valuetext={format(value)}
      >
        <View height={6} borderRadius={3} backgroundColor="$neutralRaisedBorder">
          <View position="absolute" left={width / 2 - 1} top={-4} width={2} height={14} backgroundColor="$neutralControl" />
          <View position="absolute" left={left} width={span} top={0} bottom={0} borderRadius={3} backgroundColor={lime.tint} />
        </View>
        <View
          position="absolute"
          left={fraction * width - THUMB / 2}
          width={THUMB}
          height={THUMB}
          borderRadius={THUMB / 2}
          backgroundColor="$neutralText"
          shadowColor={neutral.page}
          shadowOpacity={0.5}
          shadowRadius={8}
          shadowOffset={{ width: 0, height: 2 }}
        />
      </View>
      <Text width={52} textAlign="right" fontSize={14} fontWeight="$button" color="$neutralText">
        {format(value)}
      </Text>
    </XStack>
  );
}
