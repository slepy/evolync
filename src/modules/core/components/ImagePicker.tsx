import * as Device from "expo-device";
import * as ExpoImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Platform, Pressable, Image as RNImage } from "react-native";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { Button, Text, XStack, YStack, styled, useTheme } from "tamagui";

// ============================================================================
// Types
// ============================================================================

export interface ImagePickerProps {
  /** Current image URI (local file path or remote URL) */
  value?: string | null;
  /** Callback when image is selected or removed */
  onChange: (uri: string | null) => void;
  /** Label text above the picker */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Aspect ratio for cropping (default: [1, 1]) */
  aspect?: [number, number];
  /** Image quality (0-1, default: 0.8) */
  quality?: number;
  /** Maximum width/height in pixels (default: 800) */
  maxSize?: number;
}

// ============================================================================
// Styled Components
// ============================================================================

const PickerContainer = styled(YStack, {
  gap: "$2",
});

const ImageContainerStyle = styled(YStack, {
  width: "100%",
  aspectRatio: 2,
  borderRadius: "$4",
  borderWidth: 4,
  borderColor: "$borderStrong",
  borderStyle: "dashed",
  overflow: "hidden",
  alignItems: "center",
  justifyContent: "center",
});

const PreviewImage = styled(RNImage, {
  width: "100%",
  height: "100%",
});

const PlaceholderContent = styled(YStack, {
  alignItems: "center",
  justifyContent: "center",
  gap: "$2",
  padding: "$4",
});

// ============================================================================
// ImagePicker Component
// ============================================================================

/**
 * Image picker component that allows selecting one image from camera or gallery
 *
 * Features:
 * - Camera or gallery selection
 * - Image cropping with configurable aspect ratio
 * - Image compression
 * - Preview with remove option
 * - Disabled state support
 * - Error display
 */
export const ImagePicker: React.FC<ImagePickerProps> = ({
  value,
  onChange,
  label,
  error,
  disabled = false,
  aspect = [1, 1],
  quality = 0.8,
  maxSize = 800,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const requestPermissions = async (
    type: "camera" | "gallery",
  ): Promise<boolean> => {
    if (type === "camera") {
      const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("imagePickerCameraPermissionTitle"),
          t("imagePickerCameraPermissionMessage"),
        );
        return false;
      }
    } else {
      const { status } =
        await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("imagePickerGalleryPermissionTitle"),
          t("imagePickerGalleryPermissionMessage"),
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async (source: "camera" | "gallery") => {
    if (disabled || isLoading) return;

    const hasPermission = await requestPermissions(source);
    if (!hasPermission) return;

    setIsLoading(true);

    try {
      // Disable editing on iOS simulator - it causes freezes with expo-image-picker
      const isSimulator = Platform.OS === "ios" && !Device.isDevice;
      const allowsEditing = !isSimulator;

      const options: ExpoImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing,
        aspect: allowsEditing ? aspect : undefined,
        quality,
      };

      const result =
        source === "camera"
          ? await ExpoImagePicker.launchCameraAsync(options)
          : await ExpoImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Error picking image:", err);
      Alert.alert(t("error"), t("imagePickerErrorMessage"));
    } finally {
      setIsLoading(false);
    }
  };

  const showImageOptions = () => {
    if (disabled) return;

    if (value) {
      // Image already selected - show remove or change options
      Alert.alert(t("imagePickerOptionsTitle"), undefined, [
        {
          text: t("imagePickerChangeImage"),
          onPress: showSourceOptions,
        },
        {
          text: t("imagePickerRemoveImage"),
          onPress: () => onChange(null),
          style: "destructive",
        },
        {
          text: t("cancel"),
          style: "cancel",
        },
      ]);
    } else {
      showSourceOptions();
    }
  };

  const showSourceOptions = () => {
    Alert.alert(t("imagePickerSelectSource"), undefined, [
      {
        text: t("imagePickerCamera"),
        onPress: () => pickImage("camera"),
      },
      {
        text: t("imagePickerGallery"),
        onPress: () => pickImage("gallery"),
      },
      {
        text: t("cancel"),
        style: "cancel",
      },
    ]);
  };

  const handleRemove = () => {
    if (disabled) return;
    confirmDelete(t("imagePickerRemoveImage"), "", () => onChange(null));
  };

  return (
    <PickerContainer>
      {/* Label */}
      {label && (
        <Text fontSize="$3" color="$textSecondary" fontWeight="500">
          {label}
        </Text>
      )}

      {/* Image Container / Picker */}
      <Pressable
        onPress={showImageOptions}
        disabled={disabled}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
        })}
      >
        <ImageContainerStyle>
          {value ? (
            <PreviewImage source={{ uri: value }} resizeMode="cover" />
          ) : (
            <PlaceholderContent>
              <ImagePlus size={40} color={theme.textSecondary?.val} pointerEvents="none" />
              <Text fontSize="$3" color="$textMuted" textAlign="center">
                {t("imagePickerPlaceholder")}
              </Text>
            </PlaceholderContent>
          )}
        </ImageContainerStyle>
      </Pressable>

      {/* Action Buttons */}
      {value && !disabled && (
        <XStack gap="$2" justifyContent="center">
          <Button
            size="$3"
            variant="outlined"
            onPress={showSourceOptions}
            icon={<Camera size={16} />}
          >
            {t("imagePickerChangeImage")}
          </Button>
          <Button
            size="$3"
            variant="outlined"
            pressStyle={{
              scale: 0.95,
              backgroundColor: "$dangerSurface",
              borderColor: "$dangerSurface",
            }}
            onPress={handleRemove}
            icon={
              <Trash2
                size={16}
                color={theme.dangerText?.val}
                pointerEvents="none"
              />
            }
          />
        </XStack>
      )}

      {/* Error */}
      {error && (
        <Text fontSize="$2" color="$red10">
          {error}
        </Text>
      )}
    </PickerContainer>
  );
};
