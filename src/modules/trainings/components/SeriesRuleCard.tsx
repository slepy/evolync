import { DateTimeField, PillGroup } from "@/core/components";
import { danger } from "@/core/theme/tokens";
import { X } from "lucide-react-native";
import React from "react";
import { Text, View, XStack, YStack } from "tamagui";
import type { SeriesRule, WeekOfMonth } from "../types/dto";
import { WEEKDAYS_MONDAY_FIRST, weekdayShort } from "./format";
import { monthlyRuleSummary, setRuleFrequency, weekOfMonthKey } from "./trainingFormState";

const WEEKS: WeekOfMonth[] = [1, 2, 3, 4, -1];

export interface SeriesRuleErrors {
  weekOfMonth?: string;
  startTime?: string;
  endTime?: string;
}

interface SeriesRuleCardProps {
  rule: SeriesRule;
  onChange: (rule: SeriesRule) => void;
  /** Hidden while the rule is the only one. */
  onRemove?: () => void;
  errors?: SeriesRuleErrors;
  disabled?: boolean;
}

/**
 * One "REPEAT ON" day of a recurring training (11B): Weekly / Monthly,
 * the weekday, the week of the month (monthly), start and end, and the
 * monthly summary line. Red × removes the day.
 */
export const SeriesRuleCard: React.FC<SeriesRuleCardProps> = ({ rule, onChange, onRemove, errors, disabled }) => {
  const summary = monthlyRuleSummary(rule);

  return (
    <YStack
      gap={12}
      padding={14}
      borderRadius={20}
      backgroundColor="$neutralCard"
      borderWidth={1}
      borderColor="$neutralCardBorder"
    >
      <XStack alignItems="center" gap={10}>
        <YStack flex={1} minWidth={0}>
          <PillGroup
            options={[
              { value: "weekly", label: t("trainingsWeekly") },
              { value: "monthly", label: t("trainingsMonthly") },
            ]}
            value={rule.frequency}
            onChange={(frequency) => onChange(setRuleFrequency(rule, frequency))}
            accent="trainings"
            disabled={disabled}
          />
        </YStack>
        {onRemove ? (
          <View
            role="button"
            aria-label={t("trainingsRemoveDay")}
            onPress={disabled ? undefined : onRemove}
            pressStyle={disabled ? undefined : { opacity: 0.8 }}
            width={44}
            height={44}
            borderRadius={22}
            borderWidth={1}
            borderColor="$trashBorder"
            backgroundColor="$trashFill"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <X size={18} color={danger.text} strokeWidth={2.4} />
          </View>
        ) : null}
      </XStack>

      <PillGroup
        variant="circle"
        options={WEEKDAYS_MONDAY_FIRST.map((weekday) => ({
          value: weekday,
          label: weekdayShort(weekday),
          ariaLabel: t(`trainingsWeekdayLong${weekday}`),
        }))}
        value={rule.weekday}
        onChange={(weekday) => onChange({ ...rule, weekday })}
        accent="trainings"
        disabled={disabled}
      />

      {rule.frequency === "monthly" ? (
        <YStack gap={6}>
          <PillGroup
            label={t("trainingsWhichWeek")}
            options={WEEKS.map((week) => ({ value: week, label: t(weekOfMonthKey(week)) }))}
            value={rule.weekOfMonth}
            onChange={(weekOfMonth) => onChange({ ...rule, weekOfMonth })}
            accent="trainings"
            disabled={disabled}
          />
          {errors?.weekOfMonth ? (
            <Text fontSize={12.5} fontWeight="$secondary" color="$trashText">
              {errors.weekOfMonth}
            </Text>
          ) : null}
        </YStack>
      ) : null}

      <XStack gap={12}>
        <DateTimeField
          mode="time"
          label={t("trainingsStartTime")}
          value={rule.startTime}
          onChange={(startTime) => onChange({ ...rule, startTime })}
          accent="trainings"
          error={errors?.startTime}
          disabled={disabled}
        />
        <DateTimeField
          mode="time"
          label={t("trainingsEndTime")}
          value={rule.endTime}
          onChange={(endTime) => onChange({ ...rule, endTime })}
          accent="trainings"
          error={errors?.endTime}
          disabled={disabled}
        />
      </XStack>

      {summary ? (
        <Text fontSize={12.5} fontWeight="600" color="$trainingsTint">
          {summary}
        </Text>
      ) : null}
    </YStack>
  );
};
