import {
  DashboardHeader,
  DashboardPage,
  ContextSheet,
  ListCard,
  ListIcon,
  ListRow,
  ListSection,
  MainNav,
  ModuleTile,
  ModuleTileGrid,
  NextUp,
  SyncedPill,
  TechniqueNotebook,
  type ContextOption,
  type NextUpItem,
} from "@/core/components";
import { PushPermissionPrompt } from "@/modules/notifications";
import { useStore, type Organization } from "@/store";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Building2,
  CalendarDays,
  MapPin,
  Package,
  Repeat,
  ShoppingBag,
} from "lucide-react-native";
import React from "react";
import { useOrganizationDashboard } from "../hooks/useOrganizationDashboard";
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
 * Organization dashboard (boards 1A / 1C): amber context header with the
 * context switcher, next-up header box, the organization's schools and the
 * module tiles. Everything reads from WatermelonDB, so it works offline.
 */
function DashboardInner({ organization, schools }: OrganizationDashboardProps) {
  const router = useRouter();
  const { dashboardData } = useOrganizationDashboard(organization.id);

  const schoolMemberships = useStore((s) => s.schoolMemberships);
  const setActiveMembershipId = useStore((s) => s.setActiveMembershipId);
  const [switcherOpen, setSwitcherOpen] = useState(false);

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

  const ownSchools = useMemo(
    () =>
      schools
        .filter((s) => s.organizationId === organization.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [schools, organization.id],
  );

  // ==========================================================================
  // Context switcher (organization ↔ schools the user is a member of)
  // ==========================================================================

  const handleMembershipSelect = useCallback(
    async (membershipId: string) => {
      setActiveMembershipId(membershipId);
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem("activeMembershipId", membershipId);
      router.replace("/user/dashboard" as any);
    },
    [setActiveMembershipId, router],
  );

  const orgOptionId = `org:${organization.id}`;
  const switcherOptions: ContextOption[] = [
    {
      id: orgOptionId,
      context: "organization",
      title: organization.name,
      subtitle: t("contextOrganization"),
    },
    ...schoolMemberships.map((m) => ({
      id: m.memberId,
      context: "student" as const,
      title: schools.find((s) => s.id === m.schoolId)?.name ?? m.schoolId,
      subtitle: t("contextStudent"),
    })),
  ];

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleNextUpItemPress = (item: NextUpItem) => {
    router.push(
      (item.kind === "event"
        ? `/organization/events/${item.id}`
        : `/organization/trainings/${item.id}`) as any,
    );
  };

  const pendingOrders = dashboardData.pendingOrdersAllSchools;

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <>
      <DashboardPage
        context="organization"
        header={
          <DashboardHeader
            context="organization"
            title={organization.name}
            onSwitchPress={
              schoolMemberships.length > 0
                ? () => setSwitcherOpen(true)
                : undefined
            }
            switchLabel={t("contextSwitchTitle")}
            right={<SyncedPill />}
          />
        }
        banner={<PushPermissionPrompt />}
        nav={<MainNav home="organization" />}
      >
        <NextUp
          scope={{ kind: "organization", organizationId: organization.id }}
          onCalendarPress={() => router.push("/organization/events")}
          onItemPress={handleNextUpItemPress}
        />

        <ListSection
          title={t("dashboardYourSchools")}
          accent="organization"
          action={{
            label: t("addNew"),
            onPress: () => router.push("/school/create"),
          }}
        >
          {ownSchools.length > 0 ? (
            <ListCard aria-label={t("dashboardYourSchools")}>
              {ownSchools.map((school) => (
                <ListRow
                  key={school.id}
                  title={school.name}
                  subtitle={school.address || t("emptyNoAddress")}
                  subtitleIcon={MapPin}
                  leading={<ListIcon icon={Building2} accent="school" />}
                  onPress={() =>
                    router.push(`/school/${school.id}/dashboard` as any)
                  }
                />
              ))}
            </ListCard>
          ) : null}
        </ListSection>

        <ModuleTileGrid title={t("dashboardManage")}>
          <ModuleTile
            module="events"
            icon={CalendarDays}
            title={t("eventsTitle")}
            subtitle={t("dashboardTileEvents")}
            href="/organization/events"
            addHref="/organization/events/create"
          />
          <ModuleTile
            module="trainings"
            icon={Repeat}
            title={t("trainingsTitle")}
            subtitle={t("dashboardTileTrainings")}
            href="/organization/trainings"
            addHref="/organization/trainings/create"
          />
          <ModuleTile
            module="orders"
            icon={ShoppingBag}
            title={t("ordersTitle")}
            subtitle={
              pendingOrders > 0
                ? t("dashboardTileOrdersPending", { count: pendingOrders })
                : t("dashboardTileOrders")
            }
            href="/organization/orders"
          />
          <ModuleTile
            module="products"
            icon={Package}
            title={t("dashboardTileProductsTitle")}
            subtitle={t("dashboardTileProducts")}
            href="/organization/inventory"
            addHref="/organization/inventory/create"
          />
          <ModuleTile
            module="grading"
            icon={Award}
            title={t("gradingTitle")}
            subtitle={t("dashboardTileGrading")}
            href="/organization/grading"
            addHref="/organization/grading?create=1"
          />
        </ModuleTileGrid>

        <TechniqueNotebook />
      </DashboardPage>

      <ContextSheet
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
        options={switcherOptions}
        activeId={orgOptionId}
        onSelect={(option) => handleMembershipSelect(option.id)}
      />
    </>
  );
}

const enhance = withObservables([], () => ({
  schools: SchoolRepository.observeAll(),
}));

export const Dashboard = enhance(DashboardInner);
