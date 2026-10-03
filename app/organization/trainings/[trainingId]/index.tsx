import { TRAINING_STATUS, TRAINING_VISIBILITY } from "@/database/models/Training";
import {
  Badge,
  BaseCard,
  CardInfo,
  Header,
  HeaderTitle,
  LoadingScreen,
  OptionsSheet,
  Thumbnail,
} from "@/modules/core/components";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import {
  ExtendSeriesSheet,
  TRAINING_EDIT_SCOPE,
  audienceLabel,
  confirmAction,
  deleteSeriesFrom,
  deleteTraining,
  extendSeries,
  formatDayLong,
  getExtendableSeriesEnd,
  localToday,
  setTrainingStatus,
  showError,
  timestampToDay,
  useInviteeMembers,
  useSchoolsWithAddress,
  useTraining,
  type TrainingEditScope,
} from "@/modules/trainings";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  CalendarPlus,
  Clock,
  Edit,
  MapPin,
  Repeat,
  RotateCcw,
  Trash2,
  Users,
  XCircle,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, ScrollView, Spinner, Text, XStack, YStack, useTheme } from "tamagui";

type ScopedAction = "edit" | "delete";

/**
 * One training: details, cancel/restore, edit or delete (this / this and
 * following), and extend for series.
 *
 * Route: /organization/trainings/[trainingId]?schoolId=… (schoolId narrows
 * invitees to that school, when opened from a school list)
 */
export default function TrainingDetailsScreen() {
  useRequireOrganizationOwner();
  const { trainingId, schoolId } = useLocalSearchParams<{ trainingId: string; schoolId?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { organization } = useStore();
  const { training, series, isLoading } = useTraining(trainingId);
  const { invitees } = useInviteeMembers(trainingId, schoolId);
  const { schools } = useSchoolsWithAddress(organization?.id);
  const schoolName = useMemo(
    () => schools.find((s) => s.id === training?.schoolId)?.name,
    [schools, training?.schoolId],
  );
  const [scopedAction, setScopedAction] = useState<ScopedAction | null>(null);
  // Last day of the series' lineage while the Extend sheet is open
  const [extendFrom, setExtendFrom] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <LoadingScreen />;

  if (!training) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header onBack={() => router.back()} centerContent={<HeaderTitle text={t("trainingsTitle")} />} />
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
          <Text color="$textMuted">{t("trainingsErrorNotFound")}</Text>
        </YStack>
      </View>
    );
  }

  const day = timestampToDay(training.date);
  const isPast = day < localToday();
  const isCancelled = training.status === TRAINING_STATUS.CANCELLED;
  const inSeries = !!series;

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

  const goToList = () => router.replace("/organization/trainings" as any);

  const handleEdit = (scope: TrainingEditScope) =>
    router.push(`/organization/trainings/${training.id}/edit?scope=${scope}` as any);

  const handleDelete = (scope: TrainingEditScope) => {
    const following = scope === TRAINING_EDIT_SCOPE.FOLLOWING;
    confirmAction(
      t("trainingsDeleteTraining"),
      t(following ? "trainingsDeleteFollowingConfirm" : "trainingsDeleteConfirm"),
      t("delete"),
      () => run(() => (following ? deleteSeriesFrom(training.id) : deleteTraining(training.id)), goToList),
    );
  };

  const startScoped = (action: ScopedAction) => {
    if (!inSeries) {
      if (action === "edit") handleEdit(TRAINING_EDIT_SCOPE.THIS);
      else handleDelete(TRAINING_EDIT_SCOPE.THIS);
      return;
    }
    setScopedAction(action);
  };

  const handleScope = (scope: TrainingEditScope) => {
    const action = scopedAction;
    setScopedAction(null);
    if (action === "edit") handleEdit(scope);
    if (action === "delete") handleDelete(scope);
  };

  const handleStatus = () => {
    if (isCancelled) {
      run(() => setTrainingStatus(training.id, TRAINING_STATUS.ACTIVE));
      return;
    }
    confirmAction(t("trainingsCancelTraining"), training.name, t("trainingsCancelTraining"), () =>
      run(() => setTrainingStatus(training.id, TRAINING_STATUS.CANCELLED)),
    );
  };

  const iconColor = theme.textPrimary?.val;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("trainingsTitle")} />}
        rightContent={
          !isPast ? (
            <Button
              width="$4"
              height="$4"
              chromeless
              borderWidth={1}
              pressStyle={{ scale: 0.95, backgroundColor: "$dangerSurface" }}
              onPress={() => startScoped("delete")}
              accessibilityLabel={t("trainingsDeleteTraining")}
              icon={<Trash2 size={20} color={theme.dangerText?.val} pointerEvents="none" />}
            />
          ) : undefined
        }
      />

      <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack maxWidth={500} width="100%" alignSelf="center" gap="$2">
          <XStack padding="$3" paddingBottom="$0" justifyContent="space-between" alignItems="flex-start" gap="$2">
            <Text
              fontSize="$7"
              fontWeight="700"
              flex={1}
              color={isCancelled ? "$textMuted" : "$textPrimary"}
              textDecorationLine={isCancelled ? "line-through" : "none"}
            >
              {training.name}
            </Text>
            {isCancelled && <Badge title={t("statusCancelled")} backgroundColor="$dangerSurface" textColor="$dangerText" />}
          </XStack>

          <YStack>
            <BaseCard>
              <XStack gap="$3" alignItems="center">
                <Thumbnail borderColor="$textPrimary" icon={<Calendar size={20} color={iconColor} />} />
                <CardInfo displayName={formatDayLong(day)} subtitle={t("fieldDate")} reverseTitles />
              </XStack>
            </BaseCard>
            <BaseCard>
              <XStack gap="$3" alignItems="center">
                <Thumbnail borderColor="$textPrimary" icon={<Clock size={20} color={iconColor} />} />
                <CardInfo
                  displayName={`${training.startTime}–${training.endTime}`}
                  subtitle={`${t("trainingsStartTime")} – ${t("trainingsEndTime")}`}
                  reverseTitles
                />
              </XStack>
            </BaseCard>
            {training.location && (
              <BaseCard>
                <XStack gap="$3" alignItems="center">
                  <Thumbnail borderColor="$textPrimary" icon={<MapPin size={20} color={iconColor} />} />
                  <CardInfo displayName={training.location} subtitle={t("fieldLocation")} reverseTitles />
                </XStack>
              </BaseCard>
            )}
            <BaseCard>
              <XStack gap="$3" alignItems="center">
                <Thumbnail borderColor="$textPrimary" icon={<Users size={20} color={iconColor} />} />
                <CardInfo displayName={audienceLabel(training, schoolName)} subtitle={t("trainingsAudienceLabel")} reverseTitles />
              </XStack>
            </BaseCard>
            {series && (
              <BaseCard>
                <XStack gap="$3" alignItems="center">
                  <Thumbnail borderColor="$textPrimary" icon={<Repeat size={20} color={iconColor} />} />
                  <CardInfo
                    displayName={t("trainingsSeriesUntil", { date: formatDayLong(timestampToDay(series.endDate)) })}
                    subtitle={t("trainingsModeRecurring")}
                    reverseTitles
                  />
                </XStack>
              </BaseCard>
            )}
          </YStack>

          {training.visibility === TRAINING_VISIBILITY.WHITELIST && invitees.length > 0 && (
            <YStack gap="$1" paddingHorizontal="$3">
              <Text fontSize="$5" fontWeight="700" color="$textPrimary" paddingVertical="$2">
                {t("trainingsInvitees")}
              </Text>
              {invitees.map((member) => (
                <Text key={member.id} fontSize="$4" color={member.inactive ? "$textMuted" : "$textPrimary"}>
                  {member.name}
                </Text>
              ))}
            </YStack>
          )}

          {isPast ? (
            <Text padding="$3" color="$textMuted" textAlign="center">
              {t("trainingsErrorPastReadOnly")}
            </Text>
          ) : (
            <YStack gap="$2" padding="$3">
              {!isCancelled && (
                <Button
                  size="$4"
                  backgroundColor="$warningSurface"
                  borderColor="$chineseGoldDark"
                  disabled={busy}
                  onPress={() => startScoped("edit")}
                  icon={<Edit size={18} color={theme.warningText?.val} />}
                >
                  <Text color="$warningText" fontWeight="600">
                    {t("trainingsEditTitle")}
                  </Text>
                </Button>
              )}
              {series && (
                <Button
                  size="$4"
                  backgroundColor="$infoSurface"
                  disabled={busy}
                  onPress={() => run(async () => setExtendFrom(await getExtendableSeriesEnd(series.id)))}
                  icon={<CalendarPlus size={18} color={theme.chineseCyan?.val} />}
                >
                  <Text color="$chineseCyan" fontWeight="600">
                    {t("trainingsExtendSeries")}
                  </Text>
                </Button>
              )}
              <Button
                size="$4"
                backgroundColor={isCancelled ? "$successSurface" : "$dangerSurface"}
                borderColor={isCancelled ? "$jadeGreen" : "$imperialRedLight"}
                disabled={busy}
                onPress={handleStatus}
                icon={
                  isCancelled ? (
                    <RotateCcw size={18} color={theme.jadeGreen?.val} />
                  ) : (
                    <XCircle size={18} color={theme.imperialRedLight?.val} />
                  )
                }
              >
                <Text color={isCancelled ? "$jadeGreen" : "$imperialRedLight"} fontWeight="600">
                  {isCancelled ? t("trainingsRestoreTraining") : t("trainingsCancelTraining")}
                </Text>
              </Button>
            </YStack>
          )}
        </YStack>
      </ScrollView>

      <OptionsSheet
        open={scopedAction !== null}
        onOpenChange={(open) => !open && setScopedAction(null)}
        options={[
          { id: "this", label: t("trainingsScopeThis"), onPress: () => handleScope(TRAINING_EDIT_SCOPE.THIS) },
          {
            id: "following",
            label: t("trainingsScopeFollowing"),
            onPress: () => handleScope(TRAINING_EDIT_SCOPE.FOLLOWING),
          },
        ]}
      />

      {series && extendFrom && (
        <ExtendSeriesSheet
          open
          onOpenChange={(open) => !open && setExtendFrom(null)}
          currentEnd={extendFrom}
          onSubmit={async (newEnd) => {
            await extendSeries(series.id, newEnd);
          }}
        />
      )}

      {busy && (
        <YStack position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="rgba(0,0,0,0.3)" justifyContent="center" alignItems="center">
          <Spinner size="large" color="$pearlWhite" />
        </YStack>
      )}
    </View>
  );
}
