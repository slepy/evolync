import ColorPicker, {
  HueSlider,
  Panel1,
} from "reanimated-color-picker";
import type {
  ColorFormatsObject,
  ColorPickerRef,
} from "reanimated-color-picker";
import React, { useRef, useState } from "react";
import { Button, Input, Sheet, Text, YStack } from "tamagui";
import { getContrastColor } from "@/modules/core/utils/colorHelper";

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

interface ColorPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentColor?: string | null;
  onSelectColor: (hex: string) => void;
}

export const ColorPickerSheet: React.FC<ColorPickerSheetProps> = ({
  open,
  onOpenChange,
  currentColor,
  onSelectColor,
}) => {
  const selectedHex = useRef(currentColor || "#FFFFFF");
  const pickerRef = useRef<ColorPickerRef>(null);
  const [localHex, setLocalHex] = useState(currentColor || "#FFFFFF");

  const handleComplete = (colors: ColorFormatsObject) => {
    selectedHex.current = colors.hex;
    setLocalHex(colors.hex);
  };

  const handleHexChange = (text: string) => {
    setLocalHex(text);
    if (HEX_COLOR_REGEX.test(text)) {
      selectedHex.current = text;
      pickerRef.current?.setColor(text);
    }
  };

  const handleConfirm = () => {
    onSelectColor(selectedHex.current);
    onOpenChange(false);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[60]}
      dismissOnSnapToBottom
      zIndex={100000}
    >
      <Sheet.Overlay
        backgroundColor="rgba(0, 0, 0, 0.5)"
        opacity={0.5}
        zIndex={99999}
      />
      <Sheet.Frame
        padding="$4"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <Sheet.Handle />
        <YStack gap="$4" paddingTop="$2">
          <Text
            fontSize="$6"
            fontWeight="700"
            color="$textPrimary"
          >
            {t("gradingPickColor")}
          </Text>

          <ColorPicker
            ref={pickerRef}
            value={currentColor || "#FFFFFF"}
            onCompleteJS={handleComplete}
            style={{ gap: 16 }}
          >
            <Panel1 style={{ height: 150, borderRadius: 12 }} />
            <HueSlider
              style={{ borderRadius: 12 }}
              sliderThickness={28}
              thumbShape="circle"
              thumbSize={24}
            />
          </ColorPicker>

          <Input
            value={localHex}
            onChangeText={handleHexChange}
            placeholder="#FFFFFF"
            autoCapitalize="characters"
            textAlign="center"
            fontWeight="700"
            fontSize="$5"
            height={44}
            borderRadius={12}
            borderWidth={1}
            borderColor="$borderStrong"
            backgroundColor={HEX_COLOR_REGEX.test(localHex) ? localHex : "$fillStrong"}
            color={HEX_COLOR_REGEX.test(localHex) ? getContrastColor(localHex) : "$textPrimary"}
            placeholderTextColor={HEX_COLOR_REGEX.test(localHex) ? getContrastColor(localHex) : "$textMuted"}
            focusStyle={{
              borderColor: "$chineseGold",
            }}
          />

          <Button
            size="$4"
            backgroundColor="$jadeGreen"
            color="$pearlWhite"
            borderRadius="$4"
            fontWeight="700"
            onPress={handleConfirm}
            pressStyle={{ backgroundColor: "$jadeGreenDark", scale: 0.98 }}
          >
            {t("confirm")}
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
