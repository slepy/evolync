import { useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { YStack, Text, Button, ScrollView, XStack } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";
import {
  BaseCard,
  CardInfo,
  Header,
  HeaderSelector,
  HeaderTitle,
} from "@/modules/core/components";
import School from "@/database/models/School";
import { JoinRequestStatus } from "@/database/models/SchoolJoinRequest";
import {
  SchoolJoinRequestRepository,
  SchoolRepository,
} from "@/modules/school/repositories";
import { usePendingJoinRequests } from "@/modules/school/hooks";
import { DashboardStatCard } from "@/modules/dashboard/components/DashboardStatCard";
import { NotificationBell, PushPermissionPrompt } from "@/modules/notifications";
import { LaunchScreen, MainNav, useBottomNavSpace } from "@/core/components";
import { useStore } from "@/store";
import { withObservables } from "@nozbe/watermelondb/react";
import {
  CreditCard,
  Calendar,
  CalendarDays,
  CalendarRange,
  ShoppingBag,
  PersonStanding,
  Tags,
  X,
  Building2,
} from "lucide-react-native";

// ============================================================================
// Inner component — receives reactive schools list from WatermelonDB
// ============================================================================

interface UserDashboardInnerProps {
  schools: School[];
}

function UserDashboardInner({ schools }: UserDashboardInnerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navSpace = useBottomNavSpace();
  const schoolMemberships = useStore((s) => s.schoolMemberships);

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
  const activeMembershipId = useStore((s) => s.activeMembershipId);
  const setActiveMembershipId = useStore((s) => s.setActiveMembershipId);
  const organization = useStore((s) => s.organization);
  const user = useStore((s) => s.user);
  const pendingJoinRequests = usePendingJoinRequests(user?.id);

  const activeMembership =
    schoolMemberships.find((m) => m.memberId === activeMembershipId) ?? null;

  const activeSchool = activeMembership
    ? (schools.find((s) => s.id === activeMembership.schoolId) ?? null)
    : null;

  const memberSchoolIds = new Set(schoolMemberships.map((m) => m.schoolId));
  const memberSchools = schools.filter((s) => memberSchoolIds.has(s.id));

  // Wait for active school to arrive from sync before rendering
  const activeMembershipLoaded = !activeMembership || !!activeSchool;

  const ORG_OPTION_ID = organization ? `org:${organization.id}` : null;

  const handleContextSelect = useCallback(
    async (optionId: string) => {
      if (ORG_OPTION_ID && optionId === ORG_OPTION_ID) {
        router.replace("/organization/dashboard" as any);
        return;
      }
      setActiveMembershipId(optionId);
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem("activeMembershipId", optionId);
    },
    [ORG_OPTION_ID, setActiveMembershipId, router],
  );

  const membershipOptions = schoolMemberships.map((m) => {
    const school = schools.find((s) => s.id === m.schoolId);
    return {
      id: m.memberId,
      label: school?.name ?? m.schoolId,
      icon: Building2,
      iconColor: "$blue11",
    };
  });

  const selectorOptions = [
    ...(ORG_OPTION_ID && organization
      ? [
          {
            id: ORG_OPTION_ID,
            label: organization.name,
            icon: Building2,
            iconColor: "$blue11",
          },
        ]
      : []),
    ...membershipOptions,
  ];

  const selectedOption = activeMembership
    ? {
        id: activeMembership.memberId,
        label: activeSchool?.name ?? activeMembership.schoolId,
        icon: Building2,
        iconColor: "$blue11",
      }
    : null;

  const schoolCards = [
    {
      id: "payments",
      title: t("dashboardPayments"),
      Icon: CreditCard,
      iconColor: "$jadeGreen",
      iconBackground: "$successSurface",
      onPress: () => router.push("/user/payments"),
    },
    {
      id: "attendance",
      title: t("dashboardAttendance"),
      Icon: Calendar,
      iconColor: "$primaryText",
      iconBackground: "$primarySurface",
      onPress: () => router.push("/user/attendance"),
    },
    {
      id: "calendar",
      title: t("calendarTitle"),
      Icon: CalendarRange,
      iconColor: "$chineseCyan",
      iconBackground: "$infoSurface",
      onPress: () => router.push("/user/calendar" as any),
    },
    {
      id: "events",
      title: t("eventsTitle"),
      Icon: CalendarDays,
      iconColor: "$chineseGold",
      iconBackground: "$warningSurface",
      onPress: () => router.push("/user/events"),
    },
    {
      id: "orders",
      title: t("dashboardOrders"),
      Icon: ShoppingBag,
      iconColor: "$purple11",
      iconBackground: "$purple3",
      onPress: () => router.push("/user/orders"),
    },
  ];

  const alwaysVisibleCards = [
    {
      id: "threed",
      title: t("techniquesNotebook"),
      Icon: PersonStanding,
      iconColor: "$chineseCyan",
      iconBackground: "$infoSurface",
      onPress: () => router.push("/techniques" as any),
    },
    {
      id: "tags",
      title: t("tagsPicker"),
      Icon: Tags,
      iconColor: "$chineseCoral",
      iconBackground: "$roseSurface",
      onPress: () => router.push("/tags" as any),
    },
  ];

  const headerCenter =
    selectedOption && selectorOptions.length > 0 ? (
      <HeaderSelector
        selectedOption={selectedOption}
        options={selectorOptions}
        onSelect={handleContextSelect}
      />
    ) : (
      <HeaderTitle text={t("userDashboard")} />
    );

  if (!activeMembershipLoaded) {
    return <LaunchScreen />;
  }

  const renderCards = (cards: typeof schoolCards) => (
    <XStack gap="$3" flexWrap="wrap">
      {cards.map((card) => (
        <YStack key={card.id} width="30%">
          <DashboardStatCard
            title={card.title}
            Icon={card.Icon}
            iconColor={card.iconColor}
            iconBackground={card.iconBackground}
            onPress={card.onPress}
          />
        </YStack>
      ))}
    </XStack>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header centerContent={headerCenter} leftContent={<NotificationBell />} />
      <PushPermissionPrompt />

      <ScrollView contentContainerStyle={{ paddingBottom: navSpace }}>
        <YStack padding="$4" gap="$4">
          {pendingJoinRequests.length > 0 && (
            <YStack gap="$2">
              {pendingJoinRequests.map((request) => {
                const school = schools.find((s) => s.id === request.schoolId);
                const isRejected = request.status === JoinRequestStatus.REJECTED;
                return (
                  <BaseCard key={request.id} onPress={() => {}}>
                    <XStack alignItems="center" gap="$2">
                      <CardInfo
                        displayName={school?.name ?? request.schoolId}
                        subtitle={
                          isRejected
                            ? t("joinRequestRejectedCardStatus")
                            : t("joinRequestPendingCardStatus")
                        }
                      />
                      {isRejected && (
                        <Button
                          size="$2"
                          circular
                          chromeless
                          icon={<X size={16} />}
                          onPress={() =>
                            SchoolJoinRequestRepository.softDelete(request.id)
                          }
                        />
                      )}
                    </XStack>
                  </BaseCard>
                );
              })}
            </YStack>
          )}

          {memberSchools.length === 0 ? (
            <YStack padding="$4" gap="$4" alignItems="center">
              <Text fontSize="$6" color="$gray11" textAlign="center">
                {t("notInAnySchool")}
              </Text>
              <Button onPress={() => router.push("/school/join")}>
                {t("joinSchool")}
              </Button>
            </YStack>
          ) : activeMembership ? (
            <YStack marginBottom="$2">
              {renderCards([...schoolCards, ...alwaysVisibleCards])}
            </YStack>
          ) : (
            <YStack padding="$4" alignItems="center">
              <Text fontSize="$4" color="$gray11" textAlign="center">
                {t("pendingMembershipInfo")}
              </Text>
            </YStack>
          )}

          {(memberSchools.length === 0 || !activeMembership) && (
            <YStack marginBottom="$2">{renderCards(alwaysVisibleCards)}</YStack>
          )}
        </YStack>
      </ScrollView>
      <MainNav home="student" />
    </View>
  );
}

// ============================================================================
// Reactive wrapper — observes all schools from WatermelonDB
// ============================================================================

const enhance = withObservables([], () => ({
  schools: SchoolRepository.observeAll(),
}));

const UserDashboardEnhanced = enhance(UserDashboardInner);

export default function UserDashboard() {
  const schoolMemberships = useStore((s) => s.schoolMemberships);

  // Launch loading until the store is hydrated (memberships still loading)
  if (schoolMemberships === undefined) {
    return <LaunchScreen />;
  }

  return <UserDashboardEnhanced />;
}
