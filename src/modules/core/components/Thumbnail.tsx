import { User } from "lucide-react-native";
import React, { cloneElement, isValidElement } from "react";
import { Image, View } from "react-native";
import { XStack, useTheme, type XStackProps } from "tamagui";

// ============================================================================
// Types
// ============================================================================

export interface ThumbnailProps extends Omit<XStackProps, "children"> {
  size?: number;
  iconSize?: number;
  borderColor?: string;
  backgroundColor?: string;
  icon?: React.ReactElement;
  imageUrl?: string | null;
  rankColor?: string | null;
}

// ============================================================================
// Thumbnail Component
// ============================================================================

export const Thumbnail: React.FC<ThumbnailProps> = ({
  size = 40,
  iconSize = 20,
  borderColor = "$fillMuted",
  backgroundColor = "$fillSubtle",
  icon,
  imageUrl,
  rankColor,
  ...props
}) => {
  const theme = useTheme();

  const resolvedIconColor =
    (borderColor.startsWith("$")
      ? theme[borderColor.slice(1) as keyof typeof theme]?.val
      : borderColor) ?? theme.textMuted?.val;

  const renderContent = () => {
    if (imageUrl) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size, borderRadius: 12 }}
          resizeMode="cover"
        />
      );
    }

    if (icon && isValidElement(icon)) {
      const iconProps = icon.props as Record<string, unknown>;
      return cloneElement(icon, {
        size: iconSize,
        color: resolvedIconColor,
        ...iconProps,
      } as React.Attributes);
    }

    return <User size={iconSize} color={resolvedIconColor} />;
  };

  return (
    <XStack
      width={size}
      height={size}
      backgroundColor={imageUrl ? "transparent" : backgroundColor}
      borderColor={borderColor}
      borderWidth={0.2}
      borderRadius="$5"
      justifyContent="center"
      alignItems="center"
      pointerEvents="none"
      overflow="hidden"
      {...props}
    >
      {renderContent()}
      {rankColor && (
        <View
          style={{
            position: "absolute",
            top: -size * 0.3,
            right: -size * 0.3,
            width: size * 0.6,
            height: size * 0.6,
            backgroundColor: rankColor,
            transform: [{ rotate: "45deg" }],
          }}
        />
      )}
    </XStack>
  );
};
