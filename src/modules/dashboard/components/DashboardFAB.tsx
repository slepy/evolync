import {
  OptionsSheet,
  type OptionItem,
} from "@/modules/core/components/OptionsSheet";
import {
  CalendarCheck,
  CalendarPlus,
  MessageSquare,
  UserPlus,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { Platform } from "react-native";

// ============================================================================
// Types
// ============================================================================

interface DashboardFABProps {
  /** Callback when "New Announcement" is pressed */
  onNewAnnouncement: () => void;
  /** Callback when "Add Student" is pressed */
  onAddStudent: () => void;
  /** Callback when "Mark Attendance" is pressed (new session) */
  onMarkAttendance: () => void;
  /** Callback when "Edit Attendance" is pressed (existing session) */
  onEditAttendance?: () => void;
  /** Whether today's attendance session already exists */
  hasTodaySession?: boolean;
}

// ============================================================================
// DashboardFAB Component
// ============================================================================

/**
 * Floating Action Button (FAB) for quick actions on the dashboard.
 *
 * Features:
 * - Expandable menu with common actions
 * - Bottom sheet on mobile for better UX
 * - Accessible and responsive design
 * - Follows Material Design FAB patterns
 *
 * Quick actions include:
 * - New Announcement
 * - Add Student
 * - New Order
 * - Mark Attendance
 */
export const DashboardFAB: React.FC<DashboardFABProps> = ({
  onNewAnnouncement,
  onAddStudent,
  onMarkAttendance,
  onEditAttendance,
  hasTodaySession = false,
}) => {
  // ==========================================================================
  // Quick Actions Configuration
  // ==========================================================================

  const quickActions: OptionItem[] = useMemo(
    () => [
      {
        id: "student",
        label: t("dashboardAddStudent"),
        icon: UserPlus,
        iconColor: "$blue11",
        iconBackground: "$blue4",
        onPress: onAddStudent,
      },
      {
        id: "attendance",
        label: hasTodaySession
          ? t("dashboardEditAttendance")
          : t("dashboardMarkAttendance"),
        icon: hasTodaySession ? CalendarCheck : CalendarPlus,
        iconColor: "$purple11",
        iconBackground: "$purple4",
        onPress: hasTodaySession
          ? (onEditAttendance ?? onMarkAttendance)
          : onMarkAttendance,
      },
      {
        id: "announcement",
        label: t("dashboardNewAnnouncement"),
        icon: MessageSquare,
        iconColor: "$pink11",
        iconBackground: "$pink3",
        onPress: onNewAnnouncement,
      },
    ],
    [
      onNewAnnouncement,
      onAddStudent,
      onMarkAttendance,
      onEditAttendance,
      hasTodaySession,
    ],
  );

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <>
      {/* Quick Actions Sheet */}
      <OptionsSheet
        fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
        snapPoint={40}
        title={t("dashboardQuickActions")}
        options={quickActions}
      />
    </>
  );
};
