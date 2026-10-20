import {
  ActionPill,
  MemberAvatar,
  ListCard,
  ListChip,
  ListIcon,
  ListRow,
  ListSection,
  SubScreenPage,
  TrashButton,
  resolveListAccent,
  withAlpha,
} from "@/core/components";
import { danger, neutral } from "@/core/theme/tokens";
import { TRAINING_STATUS, TRAINING_VISIBILITY } from "@/database/models/Training";
import { CalendarDays, MapPin, Pencil, Repeat, RotateCcw, School, Users, XCircle, type LucideIcon } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { useInviteeMembers } from "../hooks/useInviteeMembers";
import { useSchoolsWithAddress } from "../hooks/useSchoolsWithAddress";
import { useTraining } from "../hooks/useTraining";
import {
  deleteSeriesFrom,
  deleteTraining,
  extendSeries,
  getExtendableSeriesEnd,
  setTrainingStatus,
} from "../services/trainingService";
import type { SeriesRule } from "../types/dto";
import { TRAINING_EDIT_SCOPE, type TrainingEditScope } from "../types/enums";
import { localToday, parseJsonArray, timestampToDay } from "../types/helpers";
import { audienceLabel } from "./audienceLabel";
import { confirmAction, showError } from "./confirmAction";
import { ExtendSeriesSheet } from "./ExtendSeriesSheet";
import { formatDay } from "./format";
import { seriesRulesSummary } from "./trainingFormState";
import { TrainingScopeSheet, type TrainingScopeAction } from "./TrainingScopeSheet";

interface TrainingDetailsScreenProps {
  trainingId: string;
  /** Opened from a school: narrows invitees to that school. */
  schoolId?: string;
  organizationId?: string;
  /** Opens the edit form for the chosen scope. */
  onEdit: (scope: TrainingEditScope) => void;
  /** After a delete: back to where the training was opened from (the calendar). */
  onDeleted: () => void;
}

const TRAININGS = resolveListAccent("trainings");

const formatShortDay = (day: string) => formatDay(day, { day: "numeric", month: "short", year: "numeric" });

/**
 * Training details (11D): date and time, location, audience, the series
 * card with Extend, Edit / Cancel actions; trash in the header. Edit and
 * delete of a series occurrence ask "this or following" first (11E).
 */
export const TrainingDetailsScreen: React.FC<TrainingDetailsScreenProps> = ({
  trainingId,
  schoolId,
  organizationId,
  onEdit,
  onDeleted,
}) => {
  const { training, series, isLoading } = useTraining(trainingId);
  const { invitees } = useInviteeMembers(trainingId, schoolId);
  const { schools } = useSchoolsWithAddress(organizationId);
  const [scopeAction, setScopeAction] = useState<TrainingScopeAction | null>(null);
  // Last day of the series' lineage while the Extend sheet is open
  const [extendFrom, setExtendFrom] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const schoolName = useMemo(
    () => schools.find((s) => s.id === training?.schoolId)?.name,
    [schools, training?.schoolId],
  );
  const rules = useMemo(() => parseJsonArray<SeriesRule>(series?.rules), [series?.rules]);

  if (isLoading || !training) {
    return (
      <SubScreenPage title={t("calendarKindTraining")}>
        {isLoading ? (
          <ActivityIndicator color={TRAININGS.tint} />
        ) : (
          <Text fontSize={14} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
            {t("trainingsErrorNotFound")}
          </Text>
        )}
      </SubScreenPage>
    );
  }

  const day = timestampToDay(training.date);
  const isPast = day < localToday();
  const isCancelled = training.status === TRAINING_STATUS.CANCELLED;

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    try {
      setBusy(true);
      await action();
      after?.();
    } catch (err) {
      showError(t(err instanceof Error ? err.message : "errorUpdateFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (scope: TrainingEditScope) => {
    const following = scope === TRAINING_EDIT_SCOPE.FOLLOWING;
    confirmAction(
      t("trainingsDeleteTraining"),
      t(following ? "trainingsDeleteFollowingConfirm" : "trainingsDeleteConfirm"),
      t("delete"),
      () => run(() => (following ? deleteSeriesFrom(training.id) : deleteTraining(training.id)), onDeleted),
    );
  };

  const startScoped = (action: TrainingScopeAction) => {
    if (series) {
      setScopeAction(action);
      return;
    }
    if (action === "edit") onEdit(TRAINING_EDIT_SCOPE.THIS);
    else handleDelete(TRAINING_EDIT_SCOPE.THIS);
  };

  const handleStatus = () => {
    if (isCancelled) {
      run(() => setTrainingStatus(training.id, TRAINING_STATUS.ACTIVE));
      return;
    }
    confirmAction(t("trainingsCancelTraining"), training.name, t("trainingsCancel"), () =>
      run(() => setTrainingStatus(training.id, TRAINING_STATUS.CANCELLED)),
    );
  };

  const audienceIcon: LucideIcon =
    training.visibility === TRAINING_VISIBILITY.SCHOOL ? School : Users;

  return (
    <>
      <SubScreenPage
        title={t("calendarKindTraining")}
        right={!isPast ? <TrashButton label={t("trainingsDeleteTraining")} onPress={() => startScoped("delete")} disabled={busy} /> : undefined}
      >
        <XStack alignItems="center" gap={10} flexWrap="wrap">
          <Text
            flexShrink={1}
            fontSize="$title"
            fontWeight="$title"
            letterSpacing={-0.5}
            color={isCancelled ? "$neutralMuted" : "$neutralText"}
            textDecorationLine={isCancelled ? "line-through" : "none"}
          >
            {training.name}
          </Text>
          {series ? <ListChip accent="trainings" label={`↻ ${t("trainingsSeriesChip")}`} /> : null}
          {isCancelled ? <ListChip accent="danger" label={t("statusCancelled")} /> : null}
        </XStack>

        <ListCard>
          <ListRow
            title={`${formatDay(day)} · ${training.startTime}–${training.endTime}`}
            subtitle={t("trainingsDateTimeLabel")}
            leading={<ListIcon icon={CalendarDays} size={44} />}
          />
          {training.location ? (
            <ListRow
              title={training.location}
              subtitle={t("fieldLocation")}
              leading={<ListIcon icon={MapPin} size={44} />}
            />
          ) : null}
          <ListRow
            title={audienceLabel(training, schoolName)}
            subtitle={t("trainingsWhoFor")}
            leading={
              <ListIcon
                icon={audienceIcon}
                size={44}
                accent={training.visibility === TRAINING_VISIBILITY.SCHOOL ? "school" : "neutral"}
              />
            }
          />
        </ListCard>

        {series ? (
          <XStack
            alignItems="center"
            gap={14}
            paddingVertical={14}
            paddingHorizontal={16}
            borderRadius="$card"
            backgroundColor={TRAININGS.selectedFill}
            borderWidth={1}
            borderColor={withAlpha(TRAININGS.tint, 0.4)}
          >
            <ListIcon icon={Repeat} accent="trainings" size={44} />
            <YStack flex={1} minWidth={0} gap={3}>
              <Text fontSize={15} fontWeight="$rowTitle" color="$neutralText">
                {seriesRulesSummary(rules)}
              </Text>
              <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted">
                {t("trainingsSeriesUntil", { date: formatShortDay(timestampToDay(series.endDate)) })}
              </Text>
            </YStack>
            <XStack
              role="button"
              aria-label={t("trainingsExtendSeries")}
              onPress={busy ? undefined : () => run(async () => setExtendFrom(await getExtendableSeriesEnd(series.id)))}
              pressStyle={{ opacity: 0.8 }}
              height={36}
              paddingHorizontal={14}
              borderRadius={18}
              backgroundColor="$trainingsFill"
              alignItems="center"
              flexShrink={0}
            >
              <Text fontSize={13} fontWeight="$button" color="$trainingsTint">
                {t("trainingsExtendSubmit")}
              </Text>
            </XStack>
          </XStack>
        ) : null}

        {training.visibility === TRAINING_VISIBILITY.WHITELIST && invitees.length > 0 ? (
          <ListSection variant="label" title={t("trainingsInvitees")} chip={String(invitees.length)}>
            <ListCard>
              {invitees.map((member) => (
                <ListRow
                  key={member.id}
                  size="md"
                  title={member.name}
                  leading={<MemberAvatar name={member.name} uri={member.avatarUrl} rankId={member.rankId} />}
                />
              ))}
            </ListCard>
          </ListSection>
        ) : null}

        {isPast ? (
          <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
            {t("trainingsErrorPastReadOnly")}
          </Text>
        ) : (
          <ListSection title={t("actions")}>
            <YStack gap={12}>
              <XStack gap={10}>
                {!isCancelled ? (
                  <ActionPill
                    label={t("edit")}
                    icon={Pencil}
                    tint={TRAININGS.tint}
                    fill={TRAININGS.fill}
                    disabled={busy}
                    onPress={() => startScoped("edit")}
                  />
                ) : null}
                <ActionPill
                  label={isCancelled ? t("restore") : t("trainingsCancel")}
                  icon={isCancelled ? RotateCcw : XCircle}
                  tint={isCancelled ? neutral.synced : danger.text}
                  fill={isCancelled ? neutral.syncedFill : danger.fill}
                  disabled={busy}
                  onPress={handleStatus}
                />
              </XStack>
              <Text fontSize={12.5} fontWeight="$secondary" color={neutral.placeholder}>
                {t("trainingsActionsHint")}
              </Text>
            </YStack>
          </ListSection>
        )}
      </SubScreenPage>

      <TrainingScopeSheet
        action={scopeAction}
        onClose={() => setScopeAction(null)}
        name={training.name}
        day={day}
        onContinue={(action, scope) => {
          setScopeAction(null);
          if (action === "edit") onEdit(scope);
          else handleDelete(scope);
        }}
      />

      {series && extendFrom ? (
        <ExtendSeriesSheet
          open
          onOpenChange={(open) => !open && setExtendFrom(null)}
          name={training.name}
          currentEnd={extendFrom}
          rules={rules}
          onSubmit={async (newEnd) => {
            await extendSeries(series.id, newEnd);
          }}
        />
      ) : null}
    </>
  );
};

