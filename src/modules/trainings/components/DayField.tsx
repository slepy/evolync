import { DatePickerInput } from "@/modules/core/components";
import React from "react";
import { Platform } from "react-native";
import { Text, YStack } from "tamagui";
import { localToday } from "../types/helpers";
import { WebInput } from "./WebInput";

interface DayFieldProps {
  label: string;
  value: string; // "YYYY-MM-DD"
  onChange: (day: string) => void;
  min?: string;
  max?: string;
  error?: string;
  disabled?: boolean;
}

/** Day string ↔ the local-midnight Date the native picker works with. */
const toLocalDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** "YYYY-MM-DD" day input: the app's date picker natively, a date input on web. */
export const DayField: React.FC<DayFieldProps> = ({ label, value, onChange, min, max, error, disabled }) => {
  if (Platform.OS !== "web") {
    return (
      <DatePickerInput
        label={label}
        value={toLocalDate(value)}
        minimumDate={min ? toLocalDate(min) : undefined}
        maximumDate={max ? toLocalDate(max) : undefined}
        onChange={(date) => onChange(localToday(date))}
        error={error}
        disabled={disabled}
      />
    );
  }
  return (
    <YStack gap="$2" flex={1}>
      <Text fontSize="$3" color="$textSecondary" fontWeight="500">
        {label}
      </Text>
      <WebInput
        type="date"
        label={label}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        invalid={!!error}
        onChange={(next) => next && onChange(next)}
      />
      {error && (
        <Text color="$imperialRed" fontSize="$3" fontWeight="500">
          {error}
        </Text>
      )}
    </YStack>
  );
};
