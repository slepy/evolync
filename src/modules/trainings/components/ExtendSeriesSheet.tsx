import { DateTimeField, FormSheet, ListChip, PrimaryButton } from "@/core/components";
import React, { useEffect, useMemo, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import type { SeriesRule } from "../types/dto";
import { addDays, addMonths, expandSeriesRules, localToday, maxSeriesEnd } from "../types/helpers";
import { formatDay } from "./format";

interface ExtendSeriesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  /** Current last day of the series ("YYYY-MM-DD"). */
  currentEnd: string;
  /** Rules of the series, to count the trainings Extend adds. */
  rules: SeriesRule[];
  onSubmit: (newEnd: string) => Promise<void>;
}

const formatShortDay = (day: string) => formatDay(day, { day: "numeric", month: "short", year: "numeric" });

/** Extend series (11F): new Until up to 6 months past the current end, with the count it adds. */
export const ExtendSeriesSheet: React.FC<ExtendSeriesSheetProps> = ({
  open,
  onOpenChange,
  name,
  currentEnd,
  rules,
  onSubmit,
}) => {
  const today = localToday();
  const from = addDays(currentEnd, 1) > today ? addDays(currentEnd, 1) : today;
  const max = maxSeriesEnd(from);
  const [day, setDay] = useState(() => addMonths(currentEnd, 3));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const proposed = addMonths(currentEnd, 3);
      setDay(proposed > max ? max : proposed < from ? from : proposed);
      setError(null);
    }
  }, [open, currentEnd, from, max]);

  const added = useMemo(() => (day >= from ? expandSeriesRules(rules, from, day).length : 0), [rules, from, day]);

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
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("trainingsExtendSeries")}
      subtitle={t("trainingsExtendSubtitle", { name, date: formatShortDay(currentEnd) })}
      footer={
        <YStack gap={10}>
          {error ? (
            <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
              {t(error)}
            </Text>
          ) : null}
          <PrimaryButton label={t("trainingsExtendSubmit")} accent="trainings" onPress={submit} loading={saving} />
        </YStack>
      }
    >
      <YStack gap={10}>
        <XStack>
          <DateTimeField
            mode="date"
            label={t("trainingsExtendUntil")}
            value={day}
            format={formatShortDay}
            min={from}
            max={max}
            onChange={(next) => {
              setDay(next);
              setError(null);
            }}
            accent="trainings"
            disabled={saving}
          />
        </XStack>
        <XStack alignItems="center" gap={8} flexWrap="wrap">
          <ListChip accent="trainings" label={t("trainingsExtendCount", { count: added })} />
          <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted">
            {t("trainingsExtendLimitHint")}
          </Text>
        </XStack>
      </YStack>
    </FormSheet>
  );
};
