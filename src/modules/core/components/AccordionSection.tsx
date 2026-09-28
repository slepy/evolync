import { ChevronDown } from "lucide-react-native";
import React, { createContext, useContext, useState } from "react";
import { XStack, YStack, useTheme } from "tamagui";
import { BaseCard } from "./BaseCard";
import { CardInfo } from "./CardInfo";
import { StatusIndicator } from "./StatusIndicator";
import { Thumbnail } from "./Thumbnail";

// ============================================================================
// Types
// ============================================================================

export interface AccordionRenderProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export interface AccordionSectionProps {
  /** Unique value for the accordion item (required when used in AccordionGroup) */
  value?: string;
  /** Section title - used with default header */
  title: string;
  /** Section subtitle - used with default header */
  subtitle?: string;
  /** Optional icon component - used with default header */
  icon?: React.ReactNode;
  /** Status icon component - displayed in status indicator */
  statusIcon?: React.ReactNode;
  /** Status indicator background color */
  statusColor?: string;
  /** Custom header render function - overrides title/icon */
  renderHeader?: (props: AccordionRenderProps) => React.ReactNode;
  /** Content to display when expanded */
  children: React.ReactNode;
  /** Card background color */
  backgroundColor?: string;
  /** Card border color */
  borderColor?: string;
  /** Whether the header row triggers expand (default: true) */
  headerPressToExpand?: boolean;
  /** Margin vertical */
  marginVertical?: string | number;
  /** Margin horizontal */
  marginHorizontal?: string | number;
  /** Optional image URL for thumbnail (used if icon not provided) */
  imageUrl?: string;
  /** Optional rank color for thumbnail border */
  rankColor?: string;
  /** Callback when card is pressed (separate from expand) */
  onPress?: () => void;
}

export interface AccordionGroupProps {
  /** Currently expanded section value (controlled) */
  value: string;
  /** Callback when section changes */
  onValueChange: (value: string) => void;
  /** Accordion sections */
  children: React.ReactNode;
}

// ============================================================================
// Context
// ============================================================================

interface AccordionContextValue {
  activeValue: string;
  onValueChange: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

// ============================================================================
// AccordionSection Component
// ============================================================================

export function AccordionSection({
  value,
  title,
  subtitle,
  icon,
  statusIcon,
  statusColor,
  renderHeader,
  children,
  backgroundColor = "rgba(255, 255, 255, 0.7)",
  borderColor = "$borderColor",
  headerPressToExpand = true,
  marginVertical = "$1",
  marginHorizontal = "$3",
  imageUrl,
  rankColor,
  onPress,
}: AccordionSectionProps) {
  const theme = useTheme();
  const context = useContext(AccordionContext);

  // Standalone mode (no AccordionGroup) - manage own state
  const [standaloneExpanded, setStandaloneExpanded] = useState(false);

  const isExpanded =
    context && value ? context.activeValue === value : standaloneExpanded;

  const handleToggle = () => {
    if (context && value) {
      context.onValueChange(isExpanded ? "" : value);
    } else {
      setStandaloneExpanded(!standaloneExpanded);
    }
  };

  const handleHeaderPress = () => {
    if (onPress) {
      onPress();
    }
    if (headerPressToExpand) {
      handleToggle();
    }
  };

  const renderProps: AccordionRenderProps = {
    isExpanded,
    onToggle: handleToggle,
  };

  return (
    <BaseCard
      onPress={() => {}}
      backgroundColor="rgba(255, 255, 255, 0.7)"
      borderColor="$borderColor"
      borderWidth={1}
      padding="$2"
      marginVertical={marginVertical}
      marginHorizontal={marginHorizontal}
      pressStyle={{}}
      hoverStyle={{}}
    >
      {/* Custom Header */}
      {renderHeader ? (
        renderHeader(renderProps)
      ) : (
        /* Default Header */
        <XStack gap="$3" alignItems="center">
          {/* Main pressable area */}
          <XStack
            flex={1}
            gap="$3"
            alignItems="center"
            onPress={handleHeaderPress}
            cursor="pointer"
          >
            <Thumbnail
              icon={icon && React.isValidElement(icon) ? icon : undefined}
              backgroundColor={backgroundColor}
              borderColor={borderColor}
              imageUrl={imageUrl}
              rankColor={rankColor}
            />

            <CardInfo displayName={title} subtitle={subtitle} />

            <StatusIndicator
              icon={statusIcon}
              color={statusColor}
              onPress={handleHeaderPress}
            />
          </XStack>

          {/* Chevron - separate pressable for expand/collapse */}
          <XStack
            onPress={handleToggle}
            pressStyle={{ opacity: 0.7 }}
            cursor="pointer"
            padding="$2"
            margin="$-2"
          >
            <XStack
              animation="quick"
              rotate={isExpanded ? "180deg" : "0deg"}
              pointerEvents="none"
            >
              <ChevronDown size={20} color={theme.softGray?.val} />
            </XStack>
          </XStack>
        </XStack>
      )}

      {/* Expandable Content */}
      {isExpanded && (
        <YStack
          paddingTop="$3"
          gap="$3"
          animation="quick"
          enterStyle={{ opacity: 0, y: -10 }}
          exitStyle={{ opacity: 0, y: -10 }}
        >
          {children}
        </YStack>
      )}
    </BaseCard>
  );
}

// ============================================================================
// AccordionGroup Component
// ============================================================================

export function AccordionGroup({
  value,
  onValueChange,
  children,
}: AccordionGroupProps) {
  return (
    <AccordionContext.Provider value={{ activeValue: value, onValueChange }}>
      <YStack gap="$1">{children}</YStack>
    </AccordionContext.Provider>
  );
}
