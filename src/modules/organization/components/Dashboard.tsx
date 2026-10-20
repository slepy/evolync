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
  orgOptionId,
  useContextSwitch,
  type NextUpItem,
} from "@/core/components";
import { PushPermissionPrompt } from "@/modules/notifications";
import type { Organization } from "@/store";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Award,
  Building2,
  MapPin,
  Package,
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

  const { options: switcherOptions, select, joinSchool } = useContextSwitch();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const ownSchools = useMemo(
    () =>
      schools
        .filter((s) => s.organizationId === organization.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [schools, organization.id],
  );

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
            onSwitchPress={() => setSwitcherOpen(true)}
            switchLabel={t("contextSwitchTitle")}
            right={<SyncedPill />}
          />
        }
        banner={<PushPermissionPrompt />}
        nav={<MainNav home="organization" />}
      >
        <NextUp
          scope={{ kind: "organization", organizationId: organization.id }}
          onCalendarPress={() => router.push("/organization/calendar" as any)}
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

        <ModuleTileGrid title={t("manage")}>
          <ModuleTile
            module="orders"
            icon={ShoppingBag}
            title={t("orders")}
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
            title={t("products")}
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
        activeId={orgOptionId(organization.id)}
        onSelect={select}
        onJoinSchool={joinSchool}
      />
    </>
  );
}

const enhance = withObservables([], () => ({
  schools: SchoolRepository.observeAll(),
}));

export const Dashboard = enhance(DashboardInner);
