import {
  ContextSheet,
  DashboardHeader,
  DashboardPage,
  MainNav,
  ModuleTile,
  ModuleTileGrid,
  NextUp,
  SettingsTile,
  SyncedPill,
  TechniqueNotebook,
  type ContextOption,
} from "@/core/components";
import School from "@/database/models/School";
import { schoolTileSubtitles, type TileSubtitle } from "@/modules/dashboard/hooks/schoolTileSubtitles";
import { useSchoolDashboard } from "@/modules/dashboard/hooks/useSchoolDashboard";
import { SchoolRepository } from "@/modules/school";
import { useStore } from "@/store";
import { withObservables } from "@nozbe/watermelondb/react";
import { useRouter } from "expo-router";
import {
  CalendarCheck,
  CreditCard,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";

// ============================================================================
// Types
// ============================================================================

interface SchoolDashboardProps {
  /** Current school ID */
  schoolId: string;
  /** List of schools from WatermelonDB */
  schools: School[];
}

const subtitle = ({ key, count }: TileSubtitle) =>
  count === undefined ? t(key) : t(key, { count });

// ============================================================================
// SchoolDashboard Component
// ============================================================================

/**
 * School dashboard (board 2A, tile grid): red context header with the
 * context switcher, the next-up header box with this school's upcoming
 * trainings, the module tiles and the School settings row. Everything reads
 * from WatermelonDB, so it works offline.
 */
const SchoolDashboardComponent: React.FC<SchoolDashboardProps> = ({
  schoolId,
  schools,
}) => {
  const router = useRouter();
  const organization = useStore((s) => s.organization);
  const { dashboardData } = useSchoolDashboard(schoolId);
  const subtitles = schoolTileSubtitles(dashboardData);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const currentSchool = schools.find((s) => s.id === schoolId) ?? null;

  // ==========================================================================
  // Context switcher (organization ↔ its schools)
  // ==========================================================================

  const orgOptionId = organization ? `org:${organization.id}` : null;
  const switcherOptions = useMemo<ContextOption[]>(() => {
    if (!organization) return [];
    return [
      {
        id: `org:${organization.id}`,
        context: "organization",
        title: organization.name,
        subtitle: t("contextOrganization"),
      },
      ...schools
        .filter((s) => s.organizationId === organization.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({
          id: s.id,
          context: "school" as const,
          title: s.name,
          subtitle: t("contextSchool"),
        })),
    ];
  }, [organization, schools]);

  // The sheet closes itself and never reports the active (current) school.
  const handleContextSelect = (option: ContextOption) => {
    router.replace(
      (option.id === orgOptionId
        ? "/organization/dashboard"
        : `/school/${option.id}/dashboard`) as any,
    );
  };

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <>
      <DashboardPage
        context="school"
        header={
          <DashboardHeader
            context="school"
            title={currentSchool?.name ?? ""}
            onSwitchPress={
              switcherOptions.length > 1 ? () => setSwitcherOpen(true) : undefined
            }
            switchLabel={t("contextSwitchTitle")}
            right={<SyncedPill />}
          />
        }
        nav={<MainNav />}
      >
        <NextUp
          scope={schoolId ? { kind: "school", schoolId } : undefined}
          show={["trainings"]}
          onCalendarPress={() => router.push(`/school/${schoolId}/calendar` as any)}
          onItemPress={(item) =>
            router.push(`/organization/trainings/${item.id}?schoolId=${schoolId}` as any)
          }
        />

        <ModuleTileGrid title={t("dashboardManage")}>
          <ModuleTile
            module="students"
            icon={Users}
            title={t("studentsTitle")}
            subtitle={subtitle(subtitles.students)}
            href={`/school/${schoolId}/students` as any}
            addHref={`/school/${schoolId}/students/create` as any}
          />
          <ModuleTile
            module="attendance"
            icon={CalendarCheck}
            title={t("attendanceTitle")}
            subtitle={subtitle(subtitles.attendance)}
            href={`/school/${schoolId}/attendance` as any}
            addHref={`/school/${schoolId}/attendance/create` as any}
          />
          <ModuleTile
            module="payments"
            icon={CreditCard}
            title={t("paymentsTitle")}
            subtitle={subtitle(subtitles.payments)}
            href={`/school/${schoolId}/payments` as any}
            addHref={`/school/${schoolId}/payments/create` as any}
          />
          <ModuleTile
            module="orders"
            icon={ShoppingBag}
            title={t("ordersTitle")}
            subtitle={subtitle(subtitles.orders)}
            href={`/school/${schoolId}/orders` as any}
          />
        </ModuleTileGrid>

        <SettingsTile
          icon={Settings}
          title={t("settingsSchool")}
          subtitle={t("dashboardTileSchoolSettings")}
          href={`/school/${schoolId}/settings` as any}
        />

        <TechniqueNotebook />
      </DashboardPage>

      <ContextSheet
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
        options={switcherOptions}
        activeId={schoolId}
        onSelect={handleContextSelect}
      />
    </>
  );
};

const enhance = withObservables([], () => ({
  schools: SchoolRepository.observeAll(),
}));

export const SchoolDashboard = enhance(SchoolDashboardComponent);
