import {
  OptionsSheet,
  type OptionItem,
} from "@/modules/core/components/OptionsSheet";
import { useRouter } from "expo-router";
import { Package, Building2, CalendarDays } from "lucide-react-native";
import React, { useMemo } from "react";
import { Platform } from "react-native";

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
 *
 * Quick actions include:
 * - Create School
 * - Create Inventory Item
 * - Create Event Item
 */
export const DashboardFAB: React.FC = () => {
  const router = useRouter();

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleCreateSchool = () => {
    router.push("/school/create");
  };

  const handleAddInventoryItem = () => {
    router.push("/organization/inventory/create");
  };

  const handleAddEventItem = () => {
    router.push("/organization/events/create");
  };

  // ==========================================================================
  // Quick Actions Configuration
  // ==========================================================================

  const quickActions: OptionItem[] = useMemo(
    () => [
      {
        id: "school",
        label: t("schoolCreateTitle"),
        icon: Building2,
        iconColor: "$blue11",
        iconBackground: "$blue3",
        onPress: handleCreateSchool,
      },
      {
        id: "inventory",
        label: t("inventoryCreateTitle"),
        icon: Package,
        iconColor: "$pink11",
        iconBackground: "$pink3",
        onPress: handleAddInventoryItem,
      },
      {
        id: "event",
        label: t("eventsTitle"),
        icon: CalendarDays,
        iconColor: "$chineseGold",
        iconBackground: "$warningSurface",
        onPress: handleAddEventItem,
      },
    ],
    [],
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
        options={quickActions}
      />
    </>
  );
};
