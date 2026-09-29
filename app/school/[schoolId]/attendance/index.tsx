import AttendanceRecord from "@/database/models/AttendanceRecord";
import {
  AttendanceRecordRepository,
  TrainingSessionCard,
  useTrainingSessions,
} from "@/modules/attendance";
import { Header, HeaderTitle } from "@/modules/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { OptionsSheet } from "@/modules/core/components/OptionsSheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

/**
 * Training sessions list screen
 *
 * Route: /school/[schoolId]/attendance
 *
 * Features:
 * - Lists all training sessions for the school
 * - Shows attendance count per session
 * - FAB for creating new session (today)
 * - Offline support via WatermelonDB
 */
export default function AttendanceSessionsScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const { sessions, isLoading, error } = useTrainingSessions(schoolId);
  const insets = useSafeAreaInsets();

  // All attendance records for the school, observed independently of the
  // sessions list so it doesn't wait on `sessions` to resolve first (that
  // chain was the source of the visible "0/0 then 1/1" flash).
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  // Gates the first paint so the list never shows the "0/0" default before
  // this subscription's first emission arrives (mirrors the detail screen,
  // which stays on isLoading until its stats-backing data is ready).
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setAttendanceRecords([]);
      setIsStatsLoading(false);
      return;
    }

    const subscription = AttendanceRecordRepository.observeBySchoolId(
      schoolId,
    ).subscribe({
      next: (records: AttendanceRecord[]) => {
        setAttendanceRecords(records);
        setIsStatsLoading(false);
      },
      error: (err: Error) => {
        console.error("[AttendanceSessionsScreen] Attendance records error:", err);
        setIsStatsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [schoolId]);

  // Derived in the same render as the data that feeds it - counts and list
  // are always in sync, never a stale default before a second query resolves.
  const { attendanceCounts, totalParticipants } = useMemo(() => {
    const counts: Record<string, number> = {};
    const totals: Record<string, number> = {};
    for (const record of attendanceRecords) {
      const sessionId = record.trainingSessionId;
      totals[sessionId] = (totals[sessionId] || 0) + 1;
      if (record.status === "present") {
        counts[sessionId] = (counts[sessionId] || 0) + 1;
      }
    }
    return { attendanceCounts: counts, totalParticipants: totals };
  }, [attendanceRecords]);

  // Check if today's session already exists
  const hasTodaySession = sessions.some((session) => {
    const today = new Date();
    const sessionDate = session.sessionDate;
    return (
      sessionDate.getDate() === today.getDate() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getFullYear() === today.getFullYear()
    );
  });

  const handleSessionPress = (sessionId: string) => {
    router.push(`/school/${schoolId}/attendance/${sessionId}`);
  };

  const handleCreateToday = () => {
    router.push(`/school/${schoolId}/attendance/create`);
  };

  if (isLoading || isStatsLoading) {
    return <LoadingScreen showLogo={false} spinnerColor="$blue11" />;
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("attendanceTitle")} />}
      />
      <YStack
        flex={1}
        maxWidth={500}
        width="100%"
        alignSelf="center"
        paddingVertical="$2"
      >
        {error && (
          <YStack
            backgroundColor="$red3"
            padding="$3"
            borderRadius="$3"
            marginBottom="$3"
          >
            <Text color="$red10">{error}</Text>
          </YStack>
        )}

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <TrainingSessionCard
              session={item}
              attendanceCount={attendanceCounts[item.id] || 0}
              totalMembers={totalParticipants[item.id] || 0}
              onPress={() => handleSessionPress(item.id)}
            />
          )}
          ListEmptyComponent={
            <YStack gap="$2" alignItems="center" marginTop="$10">
              <Text color="$inkBlackLight" textAlign="center">
                {t("emptyNoSessions")}
              </Text>
              <Text color="$softGray" textAlign="center" fontSize="$3">
                {t("emptyNoSessionsHint")}
              </Text>
            </YStack>
          }
        />
      </YStack>

      {/* FAB - Create Today's Session (hidden if today's session exists) */}
      {!hasTodaySession && (
        <OptionsSheet
          fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
          action={handleCreateToday}
        />
      )}
    </View>
  );
}
