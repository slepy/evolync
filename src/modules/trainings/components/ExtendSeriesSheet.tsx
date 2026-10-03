import React, { useEffect, useState } from "react";
import { Button, Sheet, Text, YStack } from "tamagui";
import { addDays, addMonths, localToday, maxSeriesEnd } from "../types/helpers";
import { DayField } from "./DayField";

interface ExtendSeriesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current last day of the series ("YYYY-MM-DD"). */
  currentEnd: string;
  onSubmit: (newEnd: string) => Promise<void>;
}

/** Picks a new Until for a series (up to 6 months past the current end). */
export const ExtendSeriesSheet: React.FC<ExtendSeriesSheetProps> = ({ open, onOpenChange, currentEnd, onSubmit }) => {
  const today = localToday();
  const from = addDays(currentEnd, 1) > today ? addDays(currentEnd, 1) : today;
  const max = maxSeriesEnd(from);
  const [day, setDay] = useState(() => addMonths(currentEnd, 1));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const proposed = addMonths(currentEnd, 1);
      setDay(proposed > max ? max : proposed < from ? from : proposed);
      setError(null);
    }
  }, [open, currentEnd, from, max]);

  const submit = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSubmit(day);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "errorUpdateFailed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={[45]} dismissOnSnapToBottom zIndex={200}>
      <Sheet.Overlay backgroundColor="rgba(0, 0, 0, 0.5)" opacity={0.5} zIndex={199} />
      <Sheet.Frame padding="$4" backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" zIndex={200}>
        <Sheet.Handle />
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="700" color="$textPrimary">
            {t("trainingsExtendSeries")}
          </Text>
          <DayField label={t("trainingsExtendUntil")} value={day} min={from} max={max} onChange={setDay} disabled={saving} />
          <Text fontSize="$2" color="$textMuted">
            {t("trainingsUntilHint")}
          </Text>
          {error && (
            <Text color="$imperialRed" fontSize="$3">
              {t(error)}
            </Text>
          )}
          <Button backgroundColor="$chineseGold" disabled={saving} onPress={submit}>
            <Text color="$pearlWhite" fontWeight="600">
              {t("trainingsExtendSubmit")}
            </Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
