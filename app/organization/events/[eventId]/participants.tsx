import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import {
  EventParticipantRow,
  useEvent,
  useEventParticipants,
} from "@/modules/events";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Users } from "lucide-react-native";
import React from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack, useTheme } from "tamagui";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

/**
 * Screen for managing event participants
 *
 * Route: /organization/events/[eventId]/participants
 *
 * Features:
 * - List of participants with status
 * - Toggle status on tap (cycles through absent -> attending -> paid)
 * - Participant counts header
 * - Save button to persist all changes
 * - Offline support
 */
export default function EventParticipantsScreen() {
  useRequireOrganizationOwner();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { event } = useEvent(eventId);
  const { participantList, counts, isSaving, error, toggleStatus, saveAll } =
    useEventParticipants(eventId);

  const handleToggleStatus = (
    participantId: string,
    newStatus: EventParticipantStatus,
  ) => {
    toggleStatus(participantId, newStatus);
  };

  const handleSave = async () => {
    try {
      await saveAll();
      router.back();
    } catch (err) {
      console.error("[EventParticipantsScreen] Save error:", err);
    }
  };

  if (!event) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header
          onBack={() => router.back()}
          centerContent={<HeaderTitle text={t("eventsParticipants")} />}
        />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Text color="$imperialRed" textAlign="center">
            {t("eventsNotFound")}
          </Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("eventsParticipants")} />}
      />

      <YStack flex={1} maxWidth={500} width="100%" alignSelf="center">
        {error && (
          <YStack
            backgroundColor="$red3"
            padding="$3"
            borderRadius="$3"
            marginVertical="$2"
          >
            <Text color="$red10">{error}</Text>
          </YStack>
        )}

        {/* Counts Header */}
        <YStack padding="$3">
          <Text
            fontSize="$4"
            fontWeight="600"
            color="$inkBlack"
            marginBottom="$2"
          >
            {event.name}
          </Text>
          <YStack flexDirection="row" justifyContent="space-around">
            <YStack alignItems="center">
              <Text fontSize="$5" fontWeight="700" color="$softGray">
                {counts.absent}
              </Text>
              <Text fontSize="$1" color="$softGrayDark">
                {t("statusAbsent")}
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize="$5" fontWeight="700" color="$chineseGold">
                {counts.attending}
              </Text>
              <Text fontSize="$1" color="$softGrayDark">
                {t("statusAttending")}
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize="$5" fontWeight="700" color="$jadeGreen">
                {counts.paid}
              </Text>
              <Text fontSize="$1" color="$softGrayDark">
                {t("statusPaid")}
              </Text>
            </YStack>
          </YStack>
        </YStack>

        {/* Participants List */}
        <FlatList
          data={participantList}
          keyExtractor={(item) => item.participant.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <EventParticipantRow
              memberName={item.member.displayName || t("unknownMember")}
              memberEmail={item.member.email}
              status={item.status}
              onToggle={(newStatus) =>
                handleToggleStatus(item.participant.id, newStatus)
              }
            />
          )}
          ListEmptyComponent={
            <YStack gap="$2" alignItems="center" marginTop="$10">
              <Users size={48} color={theme.softGrayDark?.val} />
              <Text color="$inkBlackLight" textAlign="center">
                {t("emptyNoParticipants")}
              </Text>
              <Text color="$softGrayDark" textAlign="center" fontSize="$3">
                {t("emptyNoParticipantsHint")}
              </Text>
            </YStack>
          }
        />

        {/* Save Button - always visible */}
        <SubmitComponent
          onPress={handleSave}
          isLoading={isSaving}
          disabled={isSaving}
        />
      </YStack>
    </View>
  );
}
