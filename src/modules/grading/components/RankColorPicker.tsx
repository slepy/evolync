import { TextField } from "@/core/components";
import React, { useRef, useState } from "react";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";
import type { ColorFormatsObject, ColorPickerRef } from "reanimated-color-picker";
import { YStack } from "tamagui";
import { DEFAULT_RANK_COLOR as DEFAULT_COLOR } from "./rankSheetState";

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

interface RankColorPickerProps {
  initialColor?: string | null;
  /** Called with every valid color picked or typed. */
  onChange: (hex: string) => void;
}

/** Color picker content (8D): saturation panel, hue slider, hex field. */
export const RankColorPicker: React.FC<RankColorPickerProps> = ({ initialColor, onChange }) => {
  const pickerRef = useRef<ColorPickerRef>(null);
  const [hex, setHex] = useState(initialColor || DEFAULT_COLOR);

  const handleComplete = (colors: ColorFormatsObject) => {
    setHex(colors.hex);
    onChange(colors.hex);
  };

  const handleHexChange = (text: string) => {
    setHex(text);
    if (HEX_COLOR_REGEX.test(text)) {
      pickerRef.current?.setColor(text);
      onChange(text);
    }
  };

  return (
    <YStack gap={16}>
      <ColorPicker
        ref={pickerRef}
        value={initialColor || DEFAULT_COLOR}
        onCompleteJS={handleComplete}
        style={{ gap: 16 }}
      >
        <Panel1 style={{ height: 150, borderRadius: 16 }} />
        <HueSlider style={{ borderRadius: 14 }} sliderThickness={28} thumbShape="circle" thumbSize={24} />
      </ColorPicker>
      <TextField
        label={t("fieldHex")}
        value={hex}
        onChangeText={handleHexChange}
        placeholder={DEFAULT_COLOR}
        accent="grading"
        autoCapitalize="characters"
        maxLength={7}
      />
    </YStack>
  );
};
