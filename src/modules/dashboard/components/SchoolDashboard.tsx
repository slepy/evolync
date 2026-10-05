import {
  DashboardPage,
  MainNav,
  ModuleTile,
  ModuleTileGrid,
  NextUp,
  SettingsTile,
  SubScreenHeader,
} from "@/core/components";
import School from "@/database/models/School";
import { schoolTileSubtitles, type TileSubtitle } from "@/modules/dashboard/hooks/schoolTileSubtitles";
import { useSchoolDashboard } from "@/modules/dashboard/hooks/useSchoolDashboard";
import { SchoolRepository } from "@/modules/school";
import { withObservables } from "@nozbe/watermelondb/react";
import { useRouter } from "expo-router";
import {
  CalendarCheck,
  CreditCard,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react-native";
import React from "react";

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
 * School dashboard (board 2A, tile grid): back button + school name +
 * Synced pill, the red next-up header box with this school's upcoming
 * trainings, the module tiles and the School settings row. Everything reads
 * from WatermelonDB, so it works offline.
 */
const SchoolDashboardComponent: React.FC<SchoolDashboardProps> = ({
  schoolId,
  schools,
}) => {
  const router = useRouter();
  const { dashboardData } = useSchoolDashboard(schoolId);
  const subtitles = schoolTileSubtitles(dashboardData);

  const currentSchool = schools.find((s) => s.id === schoolId) ?? null;

  /** Back to where the school was opened from, else the organization dashboard. */
  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/organization/dashboard" as any);
  };

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <DashboardPage
      context="school"
      header={
        <SubScreenHeader title={currentSchool?.name ?? ""} onBack={handleBack} />
      }
      nav={<MainNav context="school" />}
    >
      <NextUp
        scope={schoolId ? { kind: "school", schoolId } : undefined}
        show={["trainings"]}
        onCalendarPress={() => router.push(`/school/${schoolId}/calendar` as any)}
        onItemPress={(item) =>
          router.push(`/organization/trainings/${item.id}?schoolId=${schoolId}` as any)
        }
      />

      <ModuleTileGrid>
        <ModuleTile
          module="students"
          icon={Users}
          title={t("studentsTitle")}
          subtitle={subtitle(subtitles.students)}
          href={`/school/${schoolId}/students` as any}
          addHref={`/school/${schoolId}/students/create` as any}
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
          addHref={`/school/${schoolId}/orders/create` as any}
        />
        <ModuleTile
          module="attendance"
          icon={CalendarCheck}
          title={t("attendanceTitle")}
          subtitle={subtitle(subtitles.attendance)}
          href={`/school/${schoolId}/attendance` as any}
          addHref={`/school/${schoolId}/attendance/create` as any}
        />
      </ModuleTileGrid>

      <SettingsTile
        icon={Settings}
        title={t("settingsSchool")}
        subtitle={t("dashboardTileSchoolSettings")}
        href={`/school/${schoolId}/settings` as any}
      />
    </DashboardPage>
  );
};

const enhance = withObservables([], () => ({
  schools: SchoolRepository.observeAll(),
}));

export const SchoolDashboard = enhance(SchoolDashboardComponent);
