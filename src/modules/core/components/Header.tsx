import { AppLogo } from "@/modules/core/components/AppLogo";
import {
  OptionsSheet,
  type OptionItem,
} from "@/modules/core/components/OptionsSheet";
import { SyncStatusBar } from "@/modules/core/components/SyncStatusBar";
import { signOut } from "@/modules/core/utils/signOutBridge";
import { ArrowLeft, LogOut, Settings, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { TouchableOpacity } from "react-native";
import { useTheme, YStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

export interface HeaderProps {
  /** 1. Back button - shown when navigation back is possible */
  onBack?: () => void;
  /** 1b. Custom left content - shown in the back button slot when there is no back button */
  leftContent?: React.ReactNode;
  /** 2. Center content - injectable React element (can be text, selector, custom component) */
  centerContent: React.ReactNode;
  /** 3. Show app logo with menu (default: true) */
  showLogoMenu?: boolean;
  /** 3b. Custom right content - replaces logo menu when provided */
  rightContent?: React.ReactNode;
}

// ============================================================================
// Header Component
// ============================================================================

/**
 * Modular header component composed of 4 elements:
 *
 * Structure:
 * ┌─────────────────────────────────────────┐
 * │ [Back] [Center Content] [Logo + Menu]   │  <- Top bar (3 elements)
 * ├─────────────────────────────────────────┤
 * │ [Sync Status Bar]                       │  <- Bottom bar (4th element)
 * └─────────────────────────────────────────┘
 *
 * 1. Back Button: Optional, shown when onBack is provided (otherwise leftContent, e.g. a bell)
 * 2. Center Content: Fully customizable React element
 * 3. App Logo: Opens user menu (profile, settings, logout)
 * 4. Sync Status Bar: Always shown, automatically detects network status
 *
 * Design follows the offline-first architecture requirements.
 */
export const Header: React.FC<HeaderProps> = ({
  onBack,
  leftContent,
  centerContent,
  showLogoMenu = true,
  rightContent,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  // ==========================================================================
  // Menu Options Configuration
  // ==========================================================================

  const menuOptions: OptionItem[] = useMemo(
    () => [
      {
        id: "profile",
        label: t("settingsProfile"),
        icon: User,
        iconColor: "$blue11",
        iconBackground: "$blue3",
        onPress: () => {
          router.push("/user/profile");
        },
      },
      {
        id: "settings",
        label: t("settingsTitle"),
        icon: Settings,
        iconColor: "$purple11",
        iconBackground: "$purple3",
        onPress: () => {
          router.push("/user/settings");
        },
      },
      {
        id: "logout",
        label: t("logout"),
        icon: LogOut,
        iconColor: "$red11",
        iconBackground: "$red4",
        onPress: async () => {
          await signOut();
        },
      },
    ],
    [],
  );

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <>
      {/* Top Bar: 3 Elements */}
      <YStack
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <YStack
          flexDirection="row"
          paddingHorizontal="$4"
          paddingVertical="$3"
          justifyContent="space-between"
          alignItems="center"
        >
          {/* 1. Left: Back Button, Custom Content, or Spacer */}
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <YStack pointerEvents="none">
                <ArrowLeft size={24} color={theme.textPrimary?.val} />
              </YStack>
            </TouchableOpacity>
          ) : leftContent ? (
            <YStack
              width={44}
              height={44}
              alignItems="center"
              justifyContent="center"
            >
              {leftContent}
            </YStack>
          ) : (
            <YStack width={44} height={44} />
          )}

          {/* 2. Center: Injectable Content */}
          <YStack
            flex={1}
            marginHorizontal="$3"
            alignItems="center"
            justifyContent="center"
          >
            {centerContent}
          </YStack>

          {/* 3. Right: Custom Content, App Logo with Menu, or Spacer */}
          {rightContent ? (
            <YStack
              width={44}
              height={44}
              alignItems="center"
              justifyContent="center"
            >
              {rightContent}
            </YStack>
          ) : showLogoMenu ? (
            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              activeOpacity={0.7}
              style={{ width: 44, height: 44 }}
            >
              <AppLogo size={44} showText={false} />
            </TouchableOpacity>
          ) : (
            <YStack width={44} height={44} />
          )}
        </YStack>
      </YStack>

      {/* 4. Bottom: Sync Status Bar (always shown) */}
      <SyncStatusBar />

      {/* User Menu Sheet */}
      {showLogoMenu && (
        <OptionsSheet
          open={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          options={menuOptions}
        />
      )}
    </>
  );
};
