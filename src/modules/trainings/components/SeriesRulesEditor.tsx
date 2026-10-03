import { X } from "lucide-react-native";
import React from "react";
import { Button, Text, XStack, YStack, useTheme } from "tamagui";
import type { SeriesRule, WeekOfMonth, Weekday } from "../types/dto";
import { WEEKDAYS_MONDAY_FIRST, weekdayShort } from "./format";
import { SimpleSelect } from "./SimpleSelect";
import { TimeField } from "./TimeField";

export interface RuleErrors {
  weekOfMonth?: string;
  startTime?: string;
  endTime?: string;
}

interface SeriesRulesEditorProps {
  rules: SeriesRule[];
  onChange: (rules: SeriesRule[]) => void;
  errors?: (RuleErrors | undefined)[];
  error?: string;
  disabled?: boolean;
}

const WEEK_OF_MONTH_OPTIONS: { value: WeekOfMonth; label: string }[] = [
  { value: 1, label: "trainingsWeekOfMonth1" },
  { value: 2, label: "trainingsWeekOfMonth2" },
  { value: 3, label: "trainingsWeekOfMonth3" },
  { value: 4, label: "trainingsWeekOfMonth4" },
  { value: -1, label: "trainingsWeekOfMonthLast" },
];

export const newRule = (previous?: SeriesRule): SeriesRule => ({
  weekday: 1,
  frequency: "weekly",
  startTime: previous?.startTime ?? "18:00",
  endTime: previous?.endTime ?? "19:30",
});

const Segment: React.FC<{ active: boolean; label: string; onPress: () => void; disabled?: boolean }> = ({
  active,
  label,
  onPress,
  disabled,
}) => (
  <YStack
    flex={1}
    paddingVertical="$1.5"
    borderRadius="$3"
    alignItems="center"
    backgroundColor={active ? "$chineseGold" : "transparent"}
    pressStyle={disabled ? undefined : { scale: 0.97 }}
    onPress={disabled ? undefined : onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
  >
    <Text fontSize="$3" fontWeight="600" color={active ? "$pearlWhite" : "$textMuted"}>
      {label}
    </Text>
  </YStack>
);

/** One or more "weekday + weekly/monthly + time" rules. */
export const SeriesRulesEditor: React.FC<SeriesRulesEditorProps> = ({
  rules,
  onChange,
  errors = [],
  error,
  disabled = false,
}) => {
  const theme = useTheme();
  const update = (index: number, patch: Partial<SeriesRule>) =>
    onChange(rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));

  return (
    <YStack gap="$3">
      <Text fontSize="$3" color="$textSecondary" fontWeight="500">
        {t("trainingsRulesLabel")}
      </Text>

      {rules.map((rule, index) => {
        const ruleErrors = errors[index] ?? {};
        return (
          <YStack
            key={index}
            gap="$3"
            padding="$3"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$surfaceTranslucent"
          >
            <XStack gap="$1" alignItems="center">
              <XStack flex={1} gap="$1" flexWrap="wrap">
                {WEEKDAYS_MONDAY_FIRST.map((weekday) => {
                  const active = rule.weekday === weekday;
                  return (
                    <YStack
                      key={weekday}
                      minWidth={38}
                      paddingVertical="$1.5"
                      paddingHorizontal="$1"
                      borderRadius="$10"
                      alignItems="center"
                      backgroundColor={active ? "$chineseGold" : "$fillSubtle"}
                      pressStyle={disabled ? undefined : { scale: 0.92 }}
                      onPress={disabled ? undefined : () => update(index, { weekday: weekday as Weekday })}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text fontSize="$2" fontWeight="600" color={active ? "$pearlWhite" : "$textPrimary"}>
                        {weekdayShort(weekday)}
                      </Text>
                    </YStack>
                  );
                })}
              </XStack>
              {rules.length > 1 && (
                <Button
                  size="$2"
                  circular
                  chromeless
                  disabled={disabled}
                  onPress={() => onChange(rules.filter((_, i) => i !== index))}
                  accessibilityLabel={t("delete")}
                >
                  <X size={16} color={theme.textMuted?.val} />
                </Button>
              )}
            </XStack>

            <XStack backgroundColor="$fillSubtle" borderRadius="$4" padding="$1" gap="$1">
              <Segment
                active={rule.frequency === "weekly"}
                label={t("trainingsWeekly")}
                disabled={disabled}
                onPress={() => update(index, { frequency: "weekly", weekOfMonth: undefined })}
              />
              <Segment
                active={rule.frequency === "monthly"}
                label={t("trainingsMonthly")}
                disabled={disabled}
                onPress={() => update(index, { frequency: "monthly", weekOfMonth: rule.weekOfMonth ?? 1 })}
              />
            </XStack>

            {rule.frequency === "monthly" && (
              <SimpleSelect
                value={rule.weekOfMonth !== undefined ? String(rule.weekOfMonth) : undefined}
                onChange={(value) => update(index, { weekOfMonth: Number(value) as WeekOfMonth })}
                options={WEEK_OF_MONTH_OPTIONS.map((o) => ({ value: String(o.value), label: t(o.label) }))}
                error={ruleErrors.weekOfMonth}
                disabled={disabled}
              />
            )}

            <XStack gap="$3">
              <TimeField
                label={t("trainingsStartTime")}
                value={rule.startTime}
                onChange={(value) => update(index, { startTime: value })}
                error={ruleErrors.startTime}
                disabled={disabled}
              />
              <TimeField
                label={t("trainingsEndTime")}
                value={rule.endTime}
                onChange={(value) => update(index, { endTime: value })}
                error={ruleErrors.endTime}
                disabled={disabled}
              />
            </XStack>
          </YStack>
        );
      })}

      <Button
        size="$3"
        chromeless
        alignSelf="flex-start"
        disabled={disabled}
        onPress={() => onChange([...rules, newRule(rules.at(-1))])}
      >
        <Text color="$chineseGold" fontWeight="600">
          {t("trainingsAddRule")}
        </Text>
      </Button>

      {error && (
        <Text color="$imperialRed" fontSize="$3">
          {error}
        </Text>
      )}
    </YStack>
  );
};
