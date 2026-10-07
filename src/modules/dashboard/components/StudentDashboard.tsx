import {
  ContextSheet,
  DashboardHeader,
  DashboardPage,
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
  TrashButton,
  useContextSwitch,
} from "@/core/components";
import { JoinRequestStatus } from "@/database/models/SchoolJoinRequest";
import { PushPermissionPrompt } from "@/modules/notifications";
import { usePendingJoinRequests } from "@/modules/school/hooks";
import { SchoolJoinRequestRepository, SchoolRepository } from "@/modules/school/repositories";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { Building2, CalendarCheck, CreditCard, ShoppingBag } from "lucide-react-native";
import { useEffect, useState } from "react";
import { NoSchoolCard } from "./NoSchoolCard";

/**
 * Student dashboard. In a school (board 4): blue context with the switcher,
 * next up in the school, Payments / Attendance / Orders tiles and the
 * technique notebook. Without a school (board 5): neutral "My dashboard",
 * the Join a school box and the notebook. Join requests waiting for the
 * instructor are listed under the box until they are decided.
 */
export function StudentDashboard() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const organization = useStore((s) => s.organization);
  const memberships = useStore((s) => s.schoolMemberships);
  const activeMembershipId = useStore((s) => s.activeMembershipId);
  const setActiveMembershipId = useStore((s) => s.setActiveMembershipId);
  const { options, schools, select, joinSchool } = useContextSwitch();
  const joinRequests = usePendingJoinRequests(user?.id);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const membership = memberships.find((m) => m.memberId === activeMembershipId) ?? memberships[0] ?? null;
  const school = membership ? schools.find((s) => s.id === membership.schoolId) : undefined;

  // A member always trains somewhere: fall back to the first school.
  useEffect(() => {
    if (membership && membership.memberId !== activeMembershipId) setActiveMembershipId(membership.memberId);
  }, [membership, activeMembershipId, setActiveMembershipId]);

  // Schools of pending requests usually belong to another organization: fetch their names.
  useEffect(() => {
    for (const request of joinRequests) {
      if (!schools.some((s) => s.id === request.schoolId)) {
        SchoolRepository.findByIdOrFetchFromSupabase(request.schoolId).catch(console.error);
      }
    }
  }, [joinRequests, schools]);

  const requests =
    joinRequests.length > 0 ? (
      <ListSection title={t("joinRequestsTitle")}>
        <ListCard aria-label={t("joinRequestsTitle")}>
          {joinRequests.map((request) => {
            const rejected = request.status === JoinRequestStatus.REJECTED;
            return (
              <ListRow
                key={request.id}
                title={schools.find((s) => s.id === request.schoolId)?.name ?? "…"}
                subtitle={rejected ? t("joinRequestRejectedCardStatus") : t("joinRequestPendingCardStatus")}
                leading={<ListIcon icon={Building2} accent={rejected ? "danger" : "neutral"} />}
                trailing={
                  rejected ? (
                    <TrashButton size={40} onPress={() => SchoolJoinRequestRepository.softDelete(request.id)} />
                  ) : undefined
                }
              />
            );
          })}
        </ListCard>
      </ListSection>
    ) : null;

  const sheet = (
    <ContextSheet
      open={switcherOpen}
      onOpenChange={setSwitcherOpen}
      options={options}
      activeId={membership?.memberId ?? null}
      onSelect={select}
      onJoinSchool={joinSchool}
    />
  );

  if (!membership) {
    return (
      <>
        <DashboardPage
          context="neutral"
          header={
            <DashboardHeader
              context="neutral"
              title={t("userDashboard")}
              onSwitchPress={organization ? () => setSwitcherOpen(true) : undefined}
              switchLabel={t("contextSwitchTitle")}
              right={<SyncedPill />}
            />
          }
          banner={<PushPermissionPrompt />}
          nav={<MainNav home="student" context="neutral" />}
        >
          <NoSchoolCard onJoin={joinSchool} />
          {requests}
          <TechniqueNotebook />
        </DashboardPage>
        {sheet}
      </>
    );
  }

  return (
    <>
      <DashboardPage
        context="student"
        header={
          <DashboardHeader
            context="student"
            title={school?.name ?? "…"}
            onSwitchPress={() => setSwitcherOpen(true)}
            switchLabel={t("contextSwitchTitle")}
            right={<SyncedPill />}
          />
        }
        banner={<PushPermissionPrompt />}
        nav={<MainNav home="student" />}
      >
        <NextUp
          scope={{ kind: "student", memberId: membership.memberId, schoolId: membership.schoolId }}
          onCalendarPress={() => router.push("/user/calendar" as any)}
          onItemPress={() => router.push("/user/calendar" as any)}
        />

        <ModuleTileGrid>
          <ModuleTile
            module="payments"
            icon={CreditCard}
            title={t("paymentsTitle")}
            subtitle={t("dashboardStudentTilePayments")}
            href="/user/payments"
          />
          <ModuleTile
            module="attendance"
            icon={CalendarCheck}
            title={t("attendanceTitle")}
            subtitle={t("dashboardStudentTileAttendance")}
            href="/user/attendance"
          />
          <ModuleTile
            module="orders"
            icon={ShoppingBag}
            title={t("ordersTitle")}
            subtitle={t("dashboardStudentTileOrders")}
            href="/user/orders"
            addHref="/user/orders/create"
          />
        </ModuleTileGrid>

        {requests}

        <TechniqueNotebook />
      </DashboardPage>
      {sheet}
    </>
  );
}
