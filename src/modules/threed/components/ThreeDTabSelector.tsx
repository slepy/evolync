import { THREED_TAB, type ThreeDTab } from "@/modules/threed/types";
import React from "react";
import { Button, ScrollView, Text, useTheme } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface ThreeDTabSelectorProps {
  /** Currently active tab */
  activeTab: THREED_TAB;
  /** Callback when tab changes */
  onTabChange: (tab: THREED_TAB) => void;
  /** List of tabs to display */
  tabs: ThreeDTab[];
}

// ============================================================================
// ThreeDTabSelector Component
// ============================================================================

/**
 * Tab selector for switching between Sequences, Techniques, and Starting Positions views.
 *
 * Features:
 * - Three tabs with distinct icons
 * - Active state with gold background
 * - Icon and text labels for visual clarity
 */
export const ThreeDTabSelector: React.FC<ThreeDTabSelectorProps> = ({
  activeTab,
  onTabChange,
  tabs,
}) => {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 8,
        gap: 8,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <Button
            key={tab.value}
            flex={1}
            size="$3"
            backgroundColor={isActive ? "$chineseCyan" : "$fillSubtle"}
            pressStyle={{
              scale: 0.95,
              backgroundColor: isActive ? "$chineseCyan" : "$fillSubtle",
            }}
            onPress={() => onTabChange(tab.value)}
            icon={
              <tab.icon
                size={16}
                color={isActive ? theme.pearlWhite?.val : theme.textMuted?.val}
                pointerEvents="none"
              />
            }
          >
            <Text
              color={isActive ? "$pearlWhite" : "$textMuted"}
              fontWeight="500"
            >
              {tab.label}
            </Text>
          </Button>
        );
      })}
    </ScrollView>
  );
};
