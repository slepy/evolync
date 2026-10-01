import { Header, HeaderSelector, HeaderTitle } from "@/modules/core/components";
import { NotificationBell, PushPermissionPrompt } from "@/modules/notifications";
import { useStore, type Organization } from "@/store";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  Award,
  Building2,
  CalendarDays,
  Package,
  ShoppingBag,
  PersonStanding,
  Tags,
} from "lucide-react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { useOrganizationDashboard } from "../hooks/useOrganizationDashboard";
import { DashboardFAB } from "./DashboardFAB";
import { DashboardStatCard } from "../../dashboard/components/DashboardStatCard";
import { withObservables } from "@nozbe/watermelondb/react";
import { SchoolRepository } from "@/modules/school/repositories";
import School from "@/database/models/School";

// ============================================================================
// Types
// ============================================================================

interface OrganizationDashboardProps {
  organization: Organization;
  schools: School[];
}

// ============================================================================
// OrganizationDashboard Component
// ============================================================================

/**
 * Main dashboard component for organization-level view.
 *
 * Features:
 * - Organization overview across all schools
 * - Sync status indicator
 * - Aggregated metrics (Schools, Students, Revenue, Orders, Inventory)
 * - FAB for quick actions at organization level
 * - Responsive grid layout
 * - Offline-first architecture with WatermelonDB observables
 * - Real-time updates when data changes
 */
function DashboardInner({ organization, schools }: OrganizationDashboardProps) {
  const router = useRouter();

  const { dashboardData, isLoading } = useOrganizationDashboard(
    organization.id,
  );

  const schoolMemberships = useStore((s) => s.schoolMemberships);
  const setActiveMembershipId = useStore((s) => s.setActiveMembershipId);

  // Fetch schools from Supabase for memberships not yet in local DB (foreign org schools)
  useEffect(() => {
    for (const m of schoolMemberships) {
      const exists = schools.some((s) => s.id === m.schoolId);
      if (!exists) {
        SchoolRepository.findByIdOrFetchFromSupabase(m.schoolId).catch(
          console.error,
        );
      }
    }
  }, [schoolMemberships, schools]);

  const ORG_OPTION_ID = `org:${organization.id}`;
  const selectorOptions = [
    { id: ORG_OPTION_ID, label: organization.name, icon: Building2, iconColor: "$blue11" },
    ...schoolMemberships.map((m) => {
      const school = schools.find((s) => s.id === m.schoolId);
      return {
        id: m.memberId,
        label: school?.name ?? m.schoolId,
        icon: Building2,
        iconColor: "$blue11",
      };
    }),
  ];

  const handleContextSelect = useCallback(
    async (optionId: string) => {
      if (optionId === ORG_OPTION_ID) return; // already here
      // Switch to user dashboard with chosen membership active
      setActiveMembershipId(optionId);
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem("activeMembershipId", optionId);
      router.replace("/user/dashboard" as any);
    },
    [ORG_OPTION_ID, setActiveMembershipId, router],
  );

  const headerCenter =
    schoolMemberships.length > 0 ? (
      <HeaderSelector
        selectedOption={{ id: ORG_OPTION_ID, label: organization.name }}
        options={selectorOptions}
        onSelect={handleContextSelect}
      />
    ) : (
      <HeaderTitle text={organization.name} />
    );

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleNavigateToSchools = () => {
    router.push("/school");
  };

  const handleNavigateToOrders = () => {
    router.push("/organization/orders");
  };

  const handleNavigateToInventory = () => {
    router.push("/organization/inventory");
  };

  const handleNavigateToEvents = () => {
    router.push("/organization/events");
  };

  const handleNavigateToGrading = () => {
    router.push("/organization/grading");
  };

  const handleNavigateToThreed = () => {
    router.push("/techniques" as any);
  };

  const handleNavigateToTags = () => {
    router.push("/tags" as any);
  };

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <YStack flex={1}>
        {/* Header with Organization Info and Sync Status */}
        <Header centerContent={headerCenter} leftContent={<NotificationBell />} />
        <PushPermissionPrompt />

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
              <Text fontSize="$7" fontWeight="700" color="$inkBlack">
                {t("dashboardWelcomeBack")}
              </Text>
              <Text fontSize="$4" color="$inkBlackLight">
                {t("dashboardOverview")}
              </Text>
            </YStack>

            {/* Stats Grid - 3 per row */}
            <XStack gap="$3" flexWrap="wrap">
              <YStack width="30%">
                <DashboardStatCard
                  title={t("schoolsTitle")}
                  Icon={Building2}
                  iconColor="$blue11"
                  iconBackground="$blue3"
                  onPress={handleNavigateToSchools}
                />
              </YStack>

              <YStack width="30%">
                <DashboardStatCard
                  title={t("eventsTitle")}
                  Icon={CalendarDays}
                  iconColor="$chineseGold"
                  iconBackground="$chineseGoldLighter"
                  onPress={handleNavigateToEvents}
                />
              </YStack>

              <YStack width="30%">
                <DashboardStatCard
                  title={t("ordersTitle")}
                  Icon={ShoppingBag}
                  iconColor="$purple11"
                  iconBackground="$purple3"
                  badgeCount={dashboardData.pendingOrdersAllSchools}
                  onPress={handleNavigateToOrders}
                />
              </YStack>
            </XStack>

            <XStack gap="$3" flexWrap="wrap">
              <YStack width="30%">
                <DashboardStatCard
                  title={t("inventoryTitle")}
                  Icon={Package}
                  iconColor="$pink11"
                  iconBackground="$pink3"
                  onPress={handleNavigateToInventory}
                />
              </YStack>

              <YStack width="30%">
                <DashboardStatCard
                  title={t("gradingTitle")}
                  Icon={Award}
                  iconColor="$softGray"
                  iconBackground="$softGrayLighter"
                  onPress={handleNavigateToGrading}
                />
              </YStack>

              <YStack width="30%">
                <DashboardStatCard
                  title={t("techniquesNotebook")}
                  Icon={PersonStanding}
                  iconColor="$chineseCyan"
                  iconBackground="$chineseCyanLighter"
                  onPress={handleNavigateToThreed}
                />
              </YStack>

              <YStack width="30%">
                <DashboardStatCard
                  title={t("tagsPicker")}
                  Icon={Tags}
                  iconColor="$chineseCoral"
                  iconBackground="$chineseCoralLighter"
                  onPress={handleNavigateToTags}
                />
              </YStack>
            </XStack>
          </YStack>
        </ScrollView>

        {/* Floating Action Button */}
        <DashboardFAB />
      </YStack>
    </SafeAreaView>
  );
}

const enhance = withObservables([], () => ({
  schools: SchoolRepository.observeAll(),
}));

export const Dashboard = enhance(DashboardInner);
