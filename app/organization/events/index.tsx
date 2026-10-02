import {
  Header,
  HeaderTitle,
  LoadingScreen,
  OptionsSheet,
} from "@/modules/core/components";
import {
  EventCard,
  useEvents,
  EVENT_FILTER,
  type EventFilter,
} from "@/modules/events";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { CalendarPlus, Calendar, History } from "lucide-react-native";
import React, { useState } from "react";
import { FlatList, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Spinner, Text, XStack, YStack, useTheme } from "tamagui";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

// ============================================================================
// EventsListScreen
// ============================================================================

/**
 * Screen for listing events for an organization
 *
 * Route: /organization/events
 *
 * Features:
 * - Filter toggle: Upcoming / Historical
 * - FAB for creating new events
 * - Offline support
 */
export default function EventsListScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const theme = useTheme();
  const { organization } = useStore();
  const [filter, setFilter] = useState<EventFilter>(EVENT_FILTER.UPCOMING);
  const insets = useSafeAreaInsets();

  const { events, isLoading, error, refresh } = useEvents(
    organization?.id,
    filter,
  );

  const handleEventPress = (eventId: string) => {
    router.push(`/organization/events/${eventId}`);
  };

  const handleCreateEvent = () => {
    router.push("/organization/events/create");
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <YStack flex={1}>
        {/* Header */}
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

        {/* Content */}
        {isLoading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" color="$chineseGold" />
          </YStack>
        ) : error ? (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            padding="$4"
          >
            <Text color="$imperialRed" textAlign="center">
              {error}
            </Text>
            <Button marginTop="$4" onPress={refresh}>
              {t("retry")}
            </Button>
          </YStack>
        ) : events.length === 0 ? (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            padding="$4"
            gap="$2"
          >
            <Calendar size={48} color={theme.textMuted?.val} />
            <Text color="$textMuted" fontSize="$5" textAlign="center">
              {filter === EVENT_FILTER.UPCOMING
                ? t("emptyNoUpcomingEvents")
                : t("emptyNoHistoricalEvents")}
            </Text>
            {filter === EVENT_FILTER.UPCOMING && (
              <Text color="$textSecondary" fontSize="$3" textAlign="center">
                {t("emptyNoUpcomingEventsHint")}
              </Text>
            )}
          </YStack>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <EventCard
                event={item}
                onPress={() => handleEventPress(item.id)}
              />
            )}
            refreshing={isLoading}
            onRefresh={refresh}
          />
        )}

        {/* FAB - Add School Button */}
        <OptionsSheet
          fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
          action={handleCreateEvent}
        />
      </YStack>
    </View>
  );
}
