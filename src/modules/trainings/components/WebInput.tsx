import React from "react";
import { useTheme } from "tamagui";

interface WebInputProps {
  type: "date" | "time";
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  invalid?: boolean;
  label?: string;
}

/**
 * Native browser date/time input for the web build (react-native-web renders
 * through react-dom), styled from the active theme.
 */
export const WebInput: React.FC<WebInputProps> = ({ type, value, onChange, min, max, disabled, invalid, label }) => {
  const theme = useTheme();
  return React.createElement("input", {
    type,
    value,
    min,
    max,
    disabled,
    "aria-label": label,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    style: {
      minHeight: 44,
      padding: "8px 12px",
      borderRadius: 8,
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: invalid ? theme.imperialRed?.val : theme.borderStrong?.val,
      backgroundColor: disabled ? theme.fillStrong?.val : theme.background?.val,
      color: theme.textPrimary?.val,
      fontSize: 16,
      fontFamily: "inherit",
      colorScheme: "light dark",
    },
  });
};
