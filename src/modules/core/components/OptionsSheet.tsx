import React, { useState } from "react";
import { Platform } from "react-native";
import { Button, Sheet, Text, XStack, YStack, useTheme } from "tamagui";
import { Plus } from "lucide-react-native";
import { BaseCard } from "./BaseCard";
import { CardInfo } from "./CardInfo";
import { Thumbnail } from "./Thumbnail";

// ============================================================================
// Types
// ============================================================================

export interface OptionItem {
  /** Unique identifier for the option */
  id: string;
  /** Display label for the option */
  label: string;
  /** Optional icon component (React component from lucide-react-native or similar) */
  icon?: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  /** Icon color (Tamagui token or hex/rgb color) */
  iconColor?: string;
  /** Icon background color (Tamagui token or hex/rgb color) */
  iconBackground?: string;
  /** Callback when option is pressed */
  onPress: () => void;
  /** Whether this option is currently selected (for selection mode) */
  isSelected?: boolean;
  /** Custom background color when selected (for selection mode) */
  selectedBackgroundColor?: string;
  /** Custom border color when selected (for selection mode) */
  selectedBorderColor?: string;
  /** Custom text color when selected (for selection mode) */
  selectedTextColor?: string;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Optional description or hint text shown below the label */
  hint?: string;
}

export interface OptionsSheetProps {
  /** Array of options to display (required if action is not provided) */
  options?: OptionItem[];
  /** Single action callback (if provided, FAB executes this directly without showing sheet) */
  action?: () => void;
  /**
   * Mode for rendering options
   * - 'menu': Standard menu with icons and actions
   * - 'selection': Selection list with highlighting for selected items
   */
  mode?: "menu" | "selection";
  /** Snap point percentage (default: 40) */
  snapPoint?: number;
  /** Button height in pixels (default: 56) */
  buttonHeight?: number;
  /** Z-index for the sheet (default: 100) */
  zIndex?: number;
  /**
   * FAB configuration - if provided, renders a FAB button that opens the sheet
   * If not provided, you must control open/onOpenChange externally
   */
  fab?: {
    /** Custom bottom position (default: iOS: 90, Android: 80) */
    bottom?: number;
    /** Custom right position (default: 20) */
    right?: number;
    /** Custom button size (default: $6) */
    size?: "$3" | "$4" | "$5" | "$6" | "$7" | "$8";
    /** Custom background color (default: $blue11) */
    backgroundColor?: string;
    /** Custom icon element (default: Plus). Will be cloned with size={28} and color={theme.pearlWhite} */
    icon?: React.ReactElement;
  };
  /** Whether the sheet is open (only required if not using FAB) */
  open?: boolean;
  /** Callback when sheet open state changes (only required if not using FAB) */
  onOpenChange?: (open: boolean) => void;
}

// ============================================================================
// OptionsSheet Component
// ============================================================================

/**
 * Reusable bottom sheet component for displaying a list of options.
 *
 * Features:
 * - Configurable options with icons, colors, and callbacks
 * - Supports both menu mode (actions) and selection mode (highlighting)
 * - Optional FAB button that opens the sheet
 * - Auto-executes single option without showing sheet
 * - Responsive to different content sizes via snapPoint
 * - Accessible and follows bottom sheet patterns
 *
 * @example
 * // With FAB and single action (direct execution)
 * <OptionsSheet
 *   fab={{ bottom: 90, right: 20 }}
 *   action={() => router.push('/create')}
 * />
 *
 * @example
 * // With FAB and multiple options (shows sheet)
 * <OptionsSheet
 *   title="Quick Actions"
 *   fab={{ bottom: 90, right: 20 }}
 *   options={[
 *     {
 *       id: 'new',
 *       label: 'New Item',
 *       icon: Plus,
 *       iconColor: '$blue11',
 *       iconBackground: '$blue4',
 *       onPress: () => handleNew(),
 *     },
 *   ]}
 * />
 *
 * @example
 * // Without FAB (manual control)
 * <OptionsSheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   mode="selection"
 *   options={schools.map(school => ({
 *     id: school.id,
 *     label: school.name,
 *     isSelected: school.id === currentSchoolId,
 *     onPress: () => handleSchoolChange(school.id),
 *   }))}
 * />
 */
export const OptionsSheet: React.FC<OptionsSheetProps> = ({
  options,
  action,
  mode = "menu",
  snapPoint = 40,
  zIndex = 100,
  fab,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}) => {
  const theme = useTheme();

  // Internal state for FAB mode
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external or internal state
  const isOpen = fab ? internalOpen : (externalOpen ?? false);
  const setIsOpen = fab
    ? setInternalOpen
    : (externalOnOpenChange ?? (() => {}));

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleFABPress = () => {
    // If action is provided, execute it directly
    if (action) {
      action();
    } else {
      // Otherwise, show the sheet with options
      setIsOpen(true);
    }
  };

  // ==========================================================================
  // Render Helpers
  // ==========================================================================

  const renderOption = (option: OptionItem) => {
    // Determine button styling based on mode and disabled state
    const isSelectionMode = mode === "selection";
    const isSelected = option.isSelected ?? false;
    const isDisabled = option.disabled ?? false;

    const backgroundColor = isDisabled
      ? "$white"
      : isSelectionMode && isSelected
        ? (option.selectedBackgroundColor ?? "$blue2")
        : (option.iconBackground ?? "$white");

    const borderColor = isDisabled
      ? "$softGray"
      : isSelectionMode && isSelected
        ? (option.selectedBorderColor ?? "$blue8")
        : "$softGray";

    // Get Icon component
    const IconComponent = option.icon;

    // Resolve Tamagui color tokens to actual color values for Lucide icons
    const resolvedIconColor = isDisabled
      ? theme.softGray?.val || "#999"
      : option.iconColor
        ? option.iconColor.startsWith("$")
          ? theme[option.iconColor.slice(1)]?.val || option.iconColor
          : option.iconColor
        : theme.inkBlackLight?.val || "#666";

    const handleOptionPress = () => {
      if (isDisabled) return;
      setIsOpen(false);
      setTimeout(option.onPress, 350);
    };

    return (
      <BaseCard
        onPress={handleOptionPress}
        key={option.id}
        backgroundColor={backgroundColor}
        borderColor={borderColor}
      >
        <XStack gap="$3" alignItems="center">
          {IconComponent && (
            <Thumbnail
              backgroundColor={backgroundColor}
              borderColor={resolvedIconColor}
              size={40}
              iconSize={20}
              icon={<IconComponent />}
            />
          )}

          <CardInfo displayName={option.label} subtitle={option.hint} />
        </XStack>
      </BaseCard>
    );
  };

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <>
      {/* FAB Button (if configured) */}
      {fab && (
        <Button
          height="$6"
          width="$6"
          backgroundColor={fab.backgroundColor ?? "$blue11"}
          position="absolute"
          bottom={fab.bottom ?? (Platform.OS === "ios" ? 90 : 80)}
          right={fab.right ?? 20}
          onPress={handleFABPress}
          pressStyle={{
            scale: 0.95,
            backgroundColor: fab.backgroundColor ?? "$blue11",
          }}
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.3}
          shadowRadius={5}
          elevation={8}
          zIndex={zIndex}
        >
          <YStack pointerEvents="none">
            {React.isValidElement(fab.icon) ? (
              React.cloneElement(
                fab.icon as React.ReactElement<{
                  size?: number;
                  color?: string;
                }>,
                {
                  size: 28,
                  color: theme.pearlWhite?.val,
                },
              )
            ) : (
              <Plus
                size={28}
                color={theme.pearlWhite?.val}
                pointerEvents="none"
              />
            )}
          </YStack>
        </Button>
      )}

      {/* Sheet (only rendered if multiple options or not using FAB) */}
      <Sheet
        modal
        open={isOpen}
        onOpenChange={setIsOpen}
        snapPoints={[snapPoint]}
        dismissOnSnapToBottom
        zIndex={zIndex + 100}
      >
        <Sheet.Overlay
          backgroundColor="rgba(0, 0, 0, 0.5)"
          opacity={0.5}
          zIndex={zIndex + 99}
        />
        <Sheet.Frame
          padding="$4"
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          zIndex={zIndex + 100}
        >
          <Sheet.Handle />
          <YStack gap="$3">
            {/* Options List */}
            {options?.map(renderOption)}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
};
