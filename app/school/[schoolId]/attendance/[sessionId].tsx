import TrainingSession from "@/database/models/TrainingSession";
import type { AttendanceStatus } from "@/database/models/AttendanceRecord";
import {
  AttendanceListItem,
  AttendanceStats,
  TrainingSessionRepository,
  useAttendance,
} from "@/modules/attendance";
import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { useDirtyFlag } from "@/modules/core/hooks";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack, useTheme } from "tamagui";

/**
 * Attendance detail screen for a training session
 *
 * Route: /school/[schoolId]/attendance/[sessionId]
 *
 * Features:
 * - Shows all school members with attendance status
 * - Toggle attendance by tapping on member
 * - Save button to persist changes
 * - Attendance statistics
 * - Offline support
 */
export default function AttendanceDetailScreen() {
  const { schoolId, sessionId } = useLocalSearchParams<{
    schoolId: string;
    sessionId: string;
  }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<TrainingSession | null>(null);
  const { isDirty, markDirty, reset: resetDirty } = useDirtyFlag();

  const {
    attendanceList,
    stats,
    isLoading,
    isSaving,
    error,
    toggleStatus,
    saveAll,
  } = useAttendance(sessionId, schoolId);

  // Load session details via repository
  useEffect(() => {
    if (!sessionId) return;

    const subscription = TrainingSessionRepository.observeById(
      sessionId,
    ).subscribe({
      next: (loadedSession: TrainingSession) => {
        setSession(loadedSession);
      },
      error: (err: Error) => {
        console.error("[AttendanceDetailScreen] Load session error:", err);
      },
    });

    return () => subscription.unsubscribe();
  }, [sessionId]);

  const handleToggleStatus = (
    memberId: string,
    newStatus: AttendanceStatus,
  ) => {
    markDirty();
    toggleStatus(memberId, newStatus);
  };

  const handleSave = async () => {
    try {
      await saveAll();
      resetDirty();
      // Navigate back to sessions list
      router.back();
    } catch (err) {
      console.error("[AttendanceDetailScreen] Save error:", err);
    }
  };

  // Format date for header
  const formatHeaderDate = (date: Date): string => {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  if (isLoading || !session) {
    return <LoadingScreen showLogo={false} spinnerColor="$blue11" />;
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={
          <HeaderTitle text={formatHeaderDate(session.sessionDate)} />
        }
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

        {/* Attendance Statistics */}
        <AttendanceStats
          total={stats.total}
          present={stats.present}
          absent={stats.absent}
          excused={stats.excused}
        />

        {/* Members List */}
        <FlatList
          data={attendanceList}
          keyExtractor={(item) => item.member.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <AttendanceListItem item={item} onToggle={handleToggleStatus} />
          )}
          ListEmptyComponent={
            <YStack gap="$2" alignItems="center" marginTop="$10">
              <Users size={48} color={theme.softGrayDark?.val} />
              <Text color="$inkBlackLight" textAlign="center">
                {t("emptyNoMembers")}
              </Text>
              <Text color="$softGray" textAlign="center" fontSize="$3">
                {t("emptyNoMembersHint")}
              </Text>
            </YStack>
          }
        />

        {/* Save Button - only visible when attendance has changed */}
        {isDirty && (
          <SubmitComponent
            onPress={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
            title={t("attendanceSave")}
          />
        )}
      </YStack>
    </View>
  );
}
