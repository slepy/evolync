import { neutral } from "@/core/theme/tokens";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { CalendarDays, ChevronDown } from "lucide-react-native";
import { createElement, useRef, useState } from "react";
import { Platform } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { FormSheet } from "../FormSheet/FormSheet";
import { resolveListAccent, type ListAccent } from "../List/accent";
import { PrimaryButton } from "../PrimaryButton/PrimaryButton";
import { fromPickerDate, toPickerDate, type DateTimeFieldMode } from "./dateTimeValue";

export interface DateTimeFieldProps {
  /** Uppercase field label ("DATE", "START", "UNTIL"). */
  label: string;
  mode: DateTimeFieldMode;
  /** "YYYY-MM-DD" (date) or "HH:mm" (time). */
  value: string;
  onChange: (value: string) => void;
  /** Shown text for the value; default the raw value. */
  format?: (value: string) => string;
  /** Date mode: first / last selectable day ("YYYY-MM-DD"). */
  min?: string;
  max?: string;
  accent?: ListAccent;
  /** Muted line under the field; replaced by `error` when set. */
  hint?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * Field that opens the system date / time picker (11A "DATE", "START" /
 * "END"): 56px on the card fill like `TextField`, a calendar icon (date) or
 * a chevron (time) on the right. Android shows its dialog, iOS a sheet with
 * the spinner and Save, web the browser picker.
 */
export function DateTimeField({
  label,
  mode,
  value,
  onChange,
  format,
  min,
  max,
  accent = "neutral",
  hint,
  error,
  disabled,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => toPickerDate(mode, value));
  const webInput = useRef<HTMLInputElement | null>(null);
  const tint = resolveListAccent(accent).tint;
  const note = error ?? hint;
  const Icon = mode === "date" ? CalendarDays : ChevronDown;
  const shown = format ? format(value) : value;

  const bounds = {
    minimumDate: mode === "date" && min ? toPickerDate("date", min) : undefined,
    maximumDate: mode === "date" && max ? toPickerDate("date", max) : undefined,
  };

  const openPicker = () => {
    if (disabled) return;
    if (Platform.OS === "web") {
      const input = webInput.current;
      if (input?.showPicker) input.showPicker();
      else input?.focus();
      return;
    }
    if (Platform.OS === "android") {
      // Imperative on Android: the declarative <DateTimePicker> calls the native
      // open() again on every re-render (its effect depends on the inline
      // onChange), and a second open() before the dialog exists crashes the app
      // with a NullPointerException in RNDatePickerDialogFragment.update().
      if (open) return;
      setOpen(true);
      DateTimePickerAndroid.open({
        value: toPickerDate(mode, value),
        mode,
        is24Hour: true,
        display: "default",
        ...bounds,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          setOpen(false);
          if (event.type === "set" && date) onChange(fromPickerDate(mode, date));
        },
        onError: (err: Error) => {
          console.error("[DateTimeField] Android picker error:", err);
          setOpen(false);
        },
      });
      return;
    }
    setDraft(toPickerDate(mode, value));
    setOpen(true);
  };

  return (
    <YStack gap={8} flex={1} minWidth={0}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      <XStack
        role="button"
        aria-haspopup="dialog"
        aria-label={`${label}, ${shown}`}
        aria-disabled={disabled}
        onPress={openPicker}
        pressStyle={disabled ? undefined : { opacity: 0.85 }}
        opacity={disabled ? 0.6 : 1}
        position="relative"
        alignItems="center"
        gap={8}
        height={56}
        paddingHorizontal={16}
        borderRadius={16}
        backgroundColor="$neutralCard"
        borderWidth={open || error ? 1.5 : 1}
        borderColor={error ? "$trashText" : open ? tint : "$neutralRaisedBorder"}
      >
        <Text flex={1} fontSize={15} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
          {shown}
        </Text>
        <Icon size={mode === "date" ? 18 : 16} color={open ? tint : neutral.muted} strokeWidth={2} />
        {Platform.OS === "web"
          ? createElement("input", {
              ref: webInput,
              type: mode,
              value,
              min,
              max,
              disabled,
              tabIndex: -1,
              "aria-hidden": true,
              onChange: (event: { target: { value: string } }) => {
                const next = mode === "time" ? event.target.value.slice(0, 5) : event.target.value;
                if (next) onChange(next);
              },
              style: { position: "absolute", left: 0, bottom: 0, width: 1, height: 1, opacity: 0, border: 0, padding: 0 },
            })
          : null}
      </XStack>
      {note ? (
        <Text fontSize={12.5} fontWeight="$secondary" color={error ? "$trashText" : "$neutralMuted"}>
          {note}
        </Text>
      ) : null}

      {Platform.OS === "ios" ? (
        <FormSheet
          open={open}
          onOpenChange={setOpen}
          title={label}
          footer={
            <PrimaryButton
              label={t("save")}
              accent={accent}
              onPress={() => {
                onChange(fromPickerDate(mode, draft));
                setOpen(false);
              }}
            />
          }
        >
          <YStack alignItems="center">
            <DateTimePicker
              value={draft}
              mode={mode}
              is24Hour
              display="spinner"
              themeVariant="dark"
              {...bounds}
              onChange={(_event: unknown, date?: Date) => date && setDraft(date)}
            />
          </YStack>
        </FormSheet>
      ) : null}
    </YStack>
  );
}
