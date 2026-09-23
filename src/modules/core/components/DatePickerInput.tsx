import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform } from "react-native";
import { Button, Sheet, Text, XStack, YStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface DatePickerInputProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  flex?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString(t("locale") === "pl" ? "pl-PL" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ============================================================================
// DatePickerInput Component
// ============================================================================

/**
 * Reusable date picker input component with styling matching TextInput.
 * Handles iOS/Android platform differences for date selection.
 *
 * @example
 * <DatePickerInput
 *   label={t('eventsStartDate')}
 *   value={startDate}
 *   onChange={handleStartDateChange}
 *   error={errors.startDate?.message}
 * />
 */
export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  error,
  disabled = false,
  minimumDate,
  maximumDate,
  flex = 1,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const handleOpenPicker = () => {
    if (disabled) return;
    setTempDate(value);
    setShowPicker(true);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  return (
    <YStack gap="$2" {...(flex !== 1 && { flex, flexBasis: 0 })}>
      {label && (
        <Text fontSize="$3" color="$softGrayDark" fontWeight="500">
          {label}
        </Text>
      )}

      <YStack
        backgroundColor={disabled ? "$softGrayLight" : "$pearlWhite"}
        paddingVertical="$2.5"
        paddingHorizontal="$3"
        borderRadius="$4"
        borderWidth={2}
        borderColor={error ? "$imperialRed" : "$softGrayLight"}
        pressStyle={
          disabled ? undefined : { scale: 0.95, borderColor: "$chineseGold" }
        }
        onPress={handleOpenPicker}
        minHeight={44}
        justifyContent="center"
      >
        <Text fontSize="$4" color={disabled ? "$softGray" : "$inkBlack"}>
          {formatDateDisplay(value)}
        </Text>
      </YStack>

      {error && (
        <Text color="$imperialRed" fontSize="$3" fontWeight="500">
          {error}
        </Text>
      )}

      {/* Android date picker */}
      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(_event: unknown, date?: Date) => {
            setShowPicker(false);
            if (date) onChange(date);
          }}
        />
      )}

      {/* iOS date picker sheet */}
      {Platform.OS === "ios" && (
        <Sheet
          modal
          open={showPicker}
          onOpenChange={setShowPicker}
          snapPoints={[40]}
          dismissOnSnapToBottom
        >
          <Sheet.Overlay />
          <Sheet.Frame padding="$4" backgroundColor="$background">
            <XStack justifyContent="space-between" marginBottom="$3">
              <Button size="$3" chromeless onPress={() => setShowPicker(false)}>
                {t("cancel")}
              </Button>
              <Button
                size="$3"
                chromeless
                theme="green"
                onPress={handleConfirm}
              >
                {t("save")}
              </Button>
            </XStack>
            <YStack flex={1} width="100%" alignItems="center">
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                themeVariant="light"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={{ width: "100%" }}
                onChange={(_event: unknown, date?: Date) => {
                  if (date) setTempDate(date);
                }}
              />
            </YStack>
          </Sheet.Frame>
        </Sheet>
      )}
    </YStack>
  );
};
