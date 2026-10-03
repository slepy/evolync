import { TextInput } from "@/modules/core/components";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform } from "react-native";
import { Button, Sheet, Text, XStack, YStack } from "tamagui";

interface TimeFieldProps {
  label: string;
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toDate = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(h) ? h : 18, Number.isFinite(m) ? m : 0, 0, 0);
  return date;
};
const toValue = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/**
 * "HH:mm" wall-clock time input: the native time picker on iOS/Android,
 * a plain text field on web.
 */
export const TimeField: React.FC<TimeFieldProps> = ({ label, value, onChange, error, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState(() => toDate(value));

  if (Platform.OS === "web") {
    return (
      <TextInput
        label={label}
        value={value}
        onChangeText={(text) => onChange(text.trim())}
        placeholder={t("trainingsTimePlaceholder")}
        error={error}
        disabled={disabled}
        maxLength={5}
        flex={1}
      />
    );
  }

  return (
    <YStack gap="$2" flex={1}>
      <Text fontSize="$3" color="$textSecondary" fontWeight="500">
        {label}
      </Text>
      <YStack
        backgroundColor={disabled ? "$fillStrong" : "$background"}
        paddingVertical="$2.5"
        paddingHorizontal="$3"
        borderRadius="$4"
        borderWidth={2}
        borderColor={error ? "$imperialRed" : "$borderStrong"}
        pressStyle={disabled ? undefined : { scale: 0.95, borderColor: "$chineseGold" }}
        onPress={() => {
          if (disabled) return;
          setTemp(toDate(value));
          setOpen(true);
        }}
        minHeight={44}
        justifyContent="center"
      >
        <Text fontSize="$4" color={disabled ? "$textMuted" : "$textPrimary"}>
          {value}
        </Text>
      </YStack>
      {error && (
        <Text color="$imperialRed" fontSize="$3" fontWeight="500">
          {error}
        </Text>
      )}

      {Platform.OS === "android" && open && (
        <DateTimePicker
          value={toDate(value)}
          mode="time"
          is24Hour
          display="default"
          onChange={(_event: unknown, date?: Date) => {
            setOpen(false);
            if (date) onChange(toValue(date));
          }}
        />
      )}

      {Platform.OS === "ios" && (
        <Sheet modal open={open} onOpenChange={setOpen} snapPoints={[40]} dismissOnSnapToBottom>
          <Sheet.Overlay />
          <Sheet.Frame padding="$4" backgroundColor="$background">
            <XStack justifyContent="space-between" marginBottom="$3">
              <Button size="$3" chromeless onPress={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                size="$3"
                chromeless
                theme="green"
                onPress={() => {
                  onChange(toValue(temp));
                  setOpen(false);
                }}
              >
                {t("save")}
              </Button>
            </XStack>
            <YStack flex={1} width="100%" alignItems="center">
              <DateTimePicker
                value={temp}
                mode="time"
                is24Hour
                display="spinner"
                style={{ width: "100%" }}
                onChange={(_event: unknown, date?: Date) => {
                  if (date) setTemp(date);
                }}
              />
            </YStack>
          </Sheet.Frame>
        </Sheet>
      )}
    </YStack>
  );
};
