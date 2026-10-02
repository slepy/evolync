import School from "@/database/models/School";
import { useTodaySession } from "@/modules/attendance/hooks";
import { Header, HeaderTitle } from "@/modules/core/components";
import { useSchoolDashboard } from "@/modules/dashboard/hooks/useSchoolDashboard";
import { SchoolRepository } from "@/modules/school";
import { withObservables } from "@nozbe/watermelondb/react";
import { useRouter } from "expo-router";
import {
  Calendar,
  CreditCard,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { DashboardFAB } from "./DashboardFAB";
import { DashboardStatCard } from "./DashboardStatCard";

// ============================================================================
// Types
// ============================================================================

interface SchoolDashboardProps {
  /** Current school ID */
  schoolId: string;
  /** List of schools from WatermelonDB */
  schools: School[];
}

// ============================================================================
// SchoolDashboard Component
// ============================================================================

/**
 * Main dashboard component for a specific school.
 *
 * Features:
 * - School switcher in header
 * - Sync status indicator
 * - Key metrics tiles (Students, Payments, Orders, Attendance, Communication)
 * - FAB for quick actions
 * - Responsive grid layout
 * - Offline-first architecture
 *
 * This component will later be connected to WatermelonDB for real-time data.
 */
const SchoolDashboardComponent: React.FC<SchoolDashboardProps> = ({
  schoolId,
  schools,
}) => {
  const router = useRouter();
  const { todaySession, hasSessionToday } = useTodaySession(schoolId);
  const { dashboardData } = useSchoolDashboard(schoolId);

  // ==========================================================================
  // Mock Data (Replace with WatermelonDB queries)
  // ==========================================================================

  const currentSchool = schools.find((s) => s.id === schoolId) ?? null;

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Students module navigation
   * @param schoolId
   */
  const handleNavigateToStudents = (schoolId: string) => {
    router.push(`/school/${schoolId}/students`);
  };

  const handleAddStudent = () => {
    router.push(`/school/${schoolId}/students/create`);
  };

  /**
   * Payments module navigation
   * @param schoolId
   */
  const handleNavigateToPayments = (schoolId: string) => {
    router.push(`/school/${schoolId}/payments`);
  };

  /**
   * Orders module navigation
   * @param schoolId
   */
  const handleNavigateToOrders = (schoolId: string) => {
    router.push(`/school/${schoolId}/orders`);
  };

  /**
   * Attendance module navigation
   * @param schoolId
   */
  const handleNavigateToAttendance = (schoolId: string) => {
    router.push(`/school/${schoolId}/attendance`);
  };

  const handleMarkAttendance = () => {
    router.push(`/school/${schoolId}/attendance/create`);
  };

  const handleEditAttendance = () => {
    if (todaySession) {
      router.push(`/school/${schoolId}/attendance/${todaySession.id}`);
    }
  };

  /**
   * Settings navigation
   */
  const handleSettingsPress = () => {
    router.push(`/school/${schoolId}/settings`);
  };

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <YStack flex={1}>
        {/* Header with School Switcher and Sync Status */}
        <Header
          onBack={() => router.back()}
          centerContent={
            <HeaderTitle text={currentSchool?.name ?? ""} />
          }
        />

        {/* Scrollable Content */}
        <ScrollView
          flex={1}
          contentContainerStyle={{
            padding: 16,
          }}
        >
          <YStack
            maxWidth={500}
            width="100%"
            alignSelf="center"
            gap="$4"
            paddingVertical="$4"
          >
            {/* Welcome Section */}
            <YStack gap="$2" marginBottom="$2">
              <Text fontSize="$7" fontWeight="700" color="$textPrimary">
                {t("dashboardWelcomeBack")}
              </Text>
              <Text fontSize="$4" color="$textBody">
                {t("dashboardOverview")}
              </Text>
            </YStack>

            {/* Stats Grid - 3 per row */}
            <XStack gap="$3" flexWrap="wrap">
              <YStack width="30%">
                <DashboardStatCard
                  title={t("dashboardStudents")}
                  Icon={Users}
                  iconColor="$blue11"
                  iconBackground="$blue3"
                  badgeCount={dashboardData.pendingJoinRequests}
                  onPress={() => handleNavigateToStudents(schoolId)}
                />
              </YStack>

              <YStack width="30%">
                <DashboardStatCard
                  title={t("dashboardPayments")}
                  Icon={CreditCard}
                  iconColor="$jadeGreen"
                  iconBackground="$successSurface"
                  badgeCount={dashboardData.overduePayments}
                  onPress={() => handleNavigateToPayments(schoolId)}
                />
              </YStack>

              <YStack width="30%">
                <DashboardStatCard
                  title={t("dashboardOrders")}
                  Icon={ShoppingBag}
                  iconColor="$purple11"
                  iconBackground="$purple3"
                  badgeCount={dashboardData.pendingOrders}
                  onPress={() => handleNavigateToOrders(schoolId)}
                />
              </YStack>

              <YStack width="30%">
                <DashboardStatCard
                  title={t("dashboardAttendance")}
                  Icon={Calendar}
                  iconColor="$primaryText"
                  iconBackground="$primarySurface"
                  onPress={() => handleNavigateToAttendance(schoolId)}
                />
              </YStack>

              <YStack width="30%">
                <DashboardStatCard
                  title={t("settingsSchool")}
                  Icon={Settings}
                  iconColor="$textBody"
                  iconBackground="$fillStrong"
                  onPress={handleSettingsPress}
                />
              </YStack>
            </XStack>

            <YStack
              backgroundColor="$blue2"
              padding="$4"
              borderRadius="$4"
              borderLeftWidth={4}
              borderLeftColor="$blue11"
              marginTop="$2"
            >
              <Text
                fontSize="$4"
                fontWeight="600"
                color="$blue11"
                marginBottom="$2"
              >
                {t("dashboardTipTitle")}
              </Text>
              <Text fontSize="$3" color="$blue11" lineHeight="$1">
                {t("dashboardTipMessage")}
              </Text>
            </YStack>
          </YStack>
        </ScrollView>

        {/* Floating Action Button */}
        <DashboardFAB
          onAddStudent={handleAddStudent}
          onMarkAttendance={handleMarkAttendance}
          onEditAttendance={handleEditAttendance}
          hasTodaySession={hasSessionToday}
        />
      </YStack>
    </SafeAreaView>
  );
};

const enhance = withObservables([], () => ({
  schools: SchoolRepository.observeAll(),
}));

export const SchoolDashboard = enhance(SchoolDashboardComponent);
