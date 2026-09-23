import {
  BaseCard,
  CardInfo,
  Header,
  HeaderTitle,
  LoadingScreen,
  Thumbnail,
} from "@/modules/core/components";
import { formatPrice, formatDateRange } from "@/modules/core/utils/formatters";
import {
  EventStatusBadge,
  BADGE_VARIANT,
  useEvent,
  useEventParticipants,
  useUpdateEvent,
} from "@/modules/events";
import { MiniStat } from "@/modules/core/components";
import { EVENT_STATUS } from "@/database/models/Event";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  XCircle,
  X,
  Check,
  Wallet,
} from "lucide-react-native";
import React, { useState, useCallback } from "react";
import { Alert, View } from "react-native";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Card,
  ScrollView,
  Spinner,
  Text,
  XStack,
  YStack,
  useTheme,
  type ColorTokens,
} from "tamagui";

/**
 * Screen for viewing event details
 *
 * Route: /organization/events/[eventId]
 *
 * Features:
 * - Event details display
 * - Participant counts
 * - Edit/Cancel/Delete actions
 * - Navigation to participants list
 */
export default function EventDetailsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Force re-fetch when screen comes back into focus
  const [refreshKey, setRefreshKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, []),
  );

  const { event, isLoading, error } = useEvent(eventId);
  const { dbCounts: counts } = useEventParticipants(eventId, refreshKey);
  const { cancel, delete: deleteEvent, isUpdating } = useUpdateEvent(eventId);

  const [isDeleting, setIsDeleting] = useState(false);

  const isCancelled = event?.status === EVENT_STATUS.CANCELLED;
  const hasPaidParticipants = counts.paid > 0;

  const statistics: Array<{
    label: string;
    value: number;
    color: ColorTokens;
    icon: React.ElementType;
  }> = [
    {
      label: t("statusAbsent"),
      value: counts.absent,
      color: "$softGray" as ColorTokens,
      icon: X,
    },
    {
      label: t("statusAttending"),
      value: counts.attending,
      color: "$chineseGold" as ColorTokens,
      icon: Check,
    },
    {
      label: t("statusPaid"),
      value: counts.paid,
      color: "$jadeGreen" as ColorTokens,
      icon: Wallet,
    },
  ];

  const handleEdit = () => {
    router.push(`/organization/events/${eventId}/edit`);
  };

  const handleManageParticipants = () => {
    router.push(`/organization/events/${eventId}/participants`);
  };

  const handleCancel = () => {
    Alert.alert(t("cancelTitle"), t("cancelMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("cancelEvent"),
        style: "destructive",
        onPress: async () => {
          try {
            await cancel();
          } catch (err) {
            Alert.alert(t("error"), t("eventsErrorCancel"));
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (hasPaidParticipants) {
      Alert.alert(t("eventsDeleteTitle"), t("eventsDeleteBlockedMessage"));
      return;
    }

    confirmDelete(t("eventsDeleteTitle"), t("eventsDeleteMessage"), async () => {
      try {
        setIsDeleting(true);
        await deleteEvent();
        router.replace("/organization/events");
      } catch (err) {
        Alert.alert(t("error"), t("errorDeleteFailed"));
      } finally {
        setIsDeleting(false);
      }
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !event) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header
          onBack={() => router.back()}
          centerContent={<HeaderTitle text={t("eventsTitle")} />}
        />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Text color="$imperialRed" textAlign="center">
            {error || t("eventsNotFound")}
          </Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("eventsDetailsTitle")} />}
        rightContent={
          <Button
            width="$4"
            height="$4"
            chromeless
            pressStyle={{
              scale: 0.95,
              backgroundColor: "$imperialRedLighter",
            }}
            borderWidth={1}
            onPress={handleDelete}
            icon={
              <Trash2
                size={20}
                color={theme.imperialRedDark?.val}
                pointerEvents="none"
              />
            }
          />
        }
      />

      <ScrollView
        flex={1}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        <YStack maxWidth={500} width="100%" alignSelf="center" gap="$2">
          {/* Event Name and Status */}
          <YStack gap="$2">
            <XStack
              justifyContent="space-between"
              alignItems="flex-start"
              padding="$3"
              paddingBottom="$0"
            >
              <Text
                fontSize="$7"
                fontWeight="700"
                color={isCancelled ? "$softGray" : "$inkBlack"}
                flex={1}
              >
                {event.name}
              </Text>
              {isCancelled && (
                <EventStatusBadge
                  status={EVENT_STATUS.CANCELLED}
                  variant={BADGE_VARIANT.EVENT}
                />
              )}
            </XStack>

            {event.shortNote && (
              <Text fontSize="$4" color="$softGray">
                {event.shortNote}
              </Text>
            )}
          </YStack>

          {/* Info Cards */}
          <YStack>
            {/* Date */}
            <BaseCard onPress={() => {}}>
              <XStack gap="$3" alignItems="center">
                <Thumbnail
                  borderColor="$inkBlack"
                  icon={<Calendar size={20} />}
                />
                <CardInfo
                  displayName={formatDateRange(event.startDate, event.endDate)}
                  subtitle={t("fieldDate")}
                  reverseTitles={true}
                />
              </XStack>
            </BaseCard>

            {/* Location */}
            {event.address && (
              <BaseCard onPress={() => {}}>
                <XStack gap="$3" alignItems="center">
                  <Thumbnail
                    borderColor="$inkBlack"
                    icon={<MapPin size={20} />}
                  />
                  <CardInfo
                    displayName={event.address}
                    subtitle={t("fieldLocation")}
                    reverseTitles={true}
                  />
                </XStack>
              </BaseCard>
            )}

            {/* Price */}
            <BaseCard
              onPress={() => {}}
              backgroundColor="$jadeGreenLighter"
              borderColor="$jadeGreen"
              marginTop="$2"
            >
              <XStack
                gap="$3"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text fontSize="$4" color="$jadeGreenDark">
                  {t("fieldPrice")}
                </Text>
                <Text fontSize="$5" fontWeight="700" color="$jadeGreen">
                  {formatPrice(event.price, event.currency)}
                </Text>
              </XStack>
            </BaseCard>
          </YStack>

          {/* Participants Summary */}
          <YStack gap="$2">
            <Text
              fontSize="$5"
              fontWeight="700"
              color="$inkBlack"
              padding="$3"
              paddingBottom="$0"
            >
              {t("eventsParticipants")}
            </Text>

            <BaseCard onPress={() => {}}>
              <XStack gap="$3" justifyContent="space-around">
                {statistics.map((stat) => (
                  <MiniStat
                    key={stat.label}
                    icon={stat.icon}
                    value={stat.value}
                    color={stat.color}
                    label={stat.label}
                  />
                ))}
              </XStack>
            </BaseCard>
            <Button
              size="$4"
              backgroundColor="$chineseGold"
              onPress={handleManageParticipants}
              icon={<Users size={18} color={theme.pearlWhite?.val} />}
              marginHorizontal="$3"
            >
              <Text color="$pearlWhite" fontWeight="600">
                {t("eventsManageParticipants")}
              </Text>
            </Button>
          </YStack>

          {/* Actions */}
          {!isCancelled && (
            <YStack gap="$2" padding="$3">
              <Text fontSize="$5" fontWeight="700" color="$inkBlack">
                {t("eventsActions")}
              </Text>
              <Button
                size="$4"
                backgroundColor="$chineseGoldLighter"
                borderColor="$chineseGoldDark"
                onPress={handleEdit}
                disabled={isUpdating}
                icon={<Edit size={18} color={theme.chineseGoldDark?.val} />}
              >
                <Text color="$chineseGoldDark" fontWeight="600">
                  {t("eventsEditTitle")}
                </Text>
              </Button>

              <Button
                size="$4"
                backgroundColor="$imperialRedLighter"
                borderColor="$imperialRedLight"
                onPress={handleCancel}
                disabled={isUpdating}
                icon={<XCircle size={18} color={theme.imperialRedLight?.val} />}
              >
                <Text color="$imperialRedLight" fontWeight="600">
                  {t("eventsCancelEvent")}
                </Text>
              </Button>
            </YStack>
          )}
        </YStack>
      </ScrollView>

      {(isUpdating || isDeleting) && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.3)"
          justifyContent="center"
          alignItems="center"
        >
          <Spinner size="large" color="$pearlWhite" />
        </YStack>
      )}
    </View>
  );
}
