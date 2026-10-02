import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { YStack, Text, ScrollView, XStack, Button, useTheme } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, History } from "lucide-react-native";
import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import { useDirtyFlag } from "@/modules/core/hooks";
import { useStore } from "@/store";
import { StudentEventCard } from "@/modules/students/components";
import {
  useStudentEvents,
  useStudentEventStatuses,
} from "@/modules/events/hooks";
import { EVENT_FILTER, type EventFilter } from "@/modules/events/types/enums";

// ============================================================================
// User Events Screen
// ============================================================================

export default function UserEventsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const schoolMembership = useStore((state) => state.getActiveMembership());
  const [filter, setFilter] = useState<EventFilter>(EVENT_FILTER.UPCOMING);
  const insets = useSafeAreaInsets();

  const { events: allEvents } = useStudentEvents(schoolMembership?.memberId, {
    includeCancelled: true,
  });

  const {
    localEvents,
    toggleStatus,
    saveAll,
    hasChanges: hasChangesRaw,
    isSaving,
  } = useStudentEventStatuses(allEvents, { isInstructor: false });
  const { isDirty: hasChanges, markDirty, reset: resetDirty } = useDirtyFlag();
  useEffect(() => {
    if (hasChangesRaw) markDirty();
  }, [hasChangesRaw, markDirty]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const events = localEvents.filter((item) => {
    const isPast = item.event.endDate.getTime() < todayTimestamp;
    // For upcoming: exclude past events; for historical: only past events
    return filter === EVENT_FILTER.HISTORICAL ? isPast : !isPast;
  });

  const handleSave = async () => {
    try {
      await saveAll();
      resetDirty();
    } catch (error) {
      console.error("[UserEvents] Save failed:", error);
      Alert.alert(t("error"), t("errorSaveFailed"));
    }
  };

  if (!schoolMembership) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header
          onBack={() => router.back()}
          centerContent={<HeaderTitle text={t("eventsTitle")} />}
        />
        <YStack
          flex={1}
          padding="$6"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="$5" color="$gray11" textAlign="center">
            {t("pendingMembershipInfo")}
          </Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("eventsTitle")} />}
      />

      {/* Filter Tabs */}
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        gap="$2"
        justifyContent="center"
      >
        <Button
          flex={1}
          size="$2"
          backgroundColor={
            filter === EVENT_FILTER.UPCOMING
              ? "$chineseGold"
              : "$fillSubtle"
          }
          pressStyle={{
            scale: 0.95,
            backgroundColor:
              filter === EVENT_FILTER.UPCOMING
                ? "$chineseGold"
                : "$fillSubtle",
          }}
          onPress={() => setFilter(EVENT_FILTER.UPCOMING)}
          icon={
            <Calendar
              size={16}
              color={
                filter === EVENT_FILTER.UPCOMING
                  ? theme.pearlWhite?.val
                  : theme.textMuted?.val
              }
              pointerEvents="none"
            />
          }
        >
          <Text
            color={
              filter === EVENT_FILTER.UPCOMING ? "$pearlWhite" : "$textMuted"
            }
            fontWeight="600"
          >
            {t("eventsFilterUpcoming")}
          </Text>
        </Button>

        <Button
          flex={1}
          size="$2"
          backgroundColor={
            filter === EVENT_FILTER.HISTORICAL
              ? "$chineseGold"
              : "$fillSubtle"
          }
          pressStyle={{
            scale: 0.95,
            backgroundColor:
              filter === EVENT_FILTER.HISTORICAL
                ? "$chineseGold"
                : "$fillSubtle",
          }}
          onPress={() => setFilter(EVENT_FILTER.HISTORICAL)}
          icon={
            <History
              size={16}
              color={
                filter === EVENT_FILTER.HISTORICAL
                  ? theme.pearlWhite?.val
                  : theme.textMuted?.val
              }
              pointerEvents="none"
            />
          }
        >
          <Text
            color={
              filter === EVENT_FILTER.HISTORICAL ? "$pearlWhite" : "$textMuted"
            }
            fontWeight="600"
          >
            {t("eventsFilterHistorical")}
          </Text>
        </Button>
      </XStack>

      <ScrollView>
        <YStack gap="$2" paddingTop="$2">
          {events.length === 0 ? (
            <YStack
              flex={1}
              padding="$6"
              gap="$2"
              alignItems="center"
              justifyContent="center"
            >
              <Calendar size={48} color={theme.textMuted?.val} />
              <Text fontSize="$5" color="$textMuted" textAlign="center">
                {filter === EVENT_FILTER.UPCOMING
                  ? t("emptyNoUpcomingEvents")
                  : t("emptyNoHistoricalEvents")}
              </Text>
            </YStack>
          ) : (
            <YStack gap="$2">
              {events.map((item) => {
                const hasPendingChange =
                  item.localStatus !== item.participantStatus;

                return (
                  <StudentEventCard
                    key={`${item.event.id}-${item.participantId}`}
                    event={item.event}
                    participantStatus={item.localStatus}
                    hasPendingChange={hasPendingChange}
                    onPress={() => toggleStatus(item.participantId)}
                  />
                );
              })}
            </YStack>
          )}
        </YStack>
      </ScrollView>

      {/* Submit bar - visible only when there are pending changes */}
      {hasChanges && (
        <SubmitComponent
          onPress={handleSave}
          isLoading={isSaving}
          disabled={isSaving}
          title={t("save")}
        />
      )}
    </View>
  );
}
