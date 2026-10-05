import * as Device from "expo-device";
import * as ExpoImagePicker from "expo-image-picker";
import { ImagePlus } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface PhotoFieldProps {
  /** Uppercase field label above the photo ("PHOTO"). */
  label: string;
  /** Local file URI or remote URL; empty shows the add placeholder. */
  value?: string | null;
  onChange: (uri: string | null) => void;
  /** Tints the placeholder icon (module accent). */
  accent?: ListAccent;
  disabled?: boolean;
}

async function hasPermission(source: "camera" | "gallery"): Promise<boolean> {
  const { status } =
    source === "camera"
      ? await ExpoImagePicker.requestCameraPermissionsAsync()
      : await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
  if (status === "granted") return true;
  Alert.alert(
    t(source === "camera" ? "imagePickerCameraPermissionTitle" : "imagePickerGalleryPermissionTitle"),
    t(source === "camera" ? "imagePickerCameraPermissionMessage" : "imagePickerGalleryPermissionMessage"),
  );
  return false;
}

/**
 * Photo of a form (9B): 12/800 uppercase label, 2:1 card on the card fill.
 * Empty it shows a dashed border and the add icon in the module tint; tapping
 * picks from the camera or gallery, tapping a photo offers change / remove.
 */
export function PhotoField({ label, value, onChange, accent = "neutral", disabled }: PhotoFieldProps) {
  const [loading, setLoading] = useState(false);
  const tint = resolveListAccent(accent).tint;

  const pick = async (source: "camera" | "gallery") => {
    if (!(await hasPermission(source))) return;
    setLoading(true);
    try {
      // Editing freezes expo-image-picker on the iOS simulator.
      const allowsEditing = !(Platform.OS === "ios" && !Device.isDevice);
      const options: ExpoImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing,
        aspect: allowsEditing ? [1, 1] : undefined,
        quality: 0.8,
      };
      const result =
        source === "camera"
          ? await ExpoImagePicker.launchCameraAsync(options)
          : await ExpoImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
    } catch (err) {
      console.error("Error picking image:", err);
      Alert.alert(t("error"), t("imagePickerErrorMessage"));
    } finally {
      setLoading(false);
    }
  };

  const chooseSource = () =>
    Alert.alert(t("imagePickerSelectSource"), undefined, [
      { text: t("imagePickerCamera"), onPress: () => pick("camera") },
      { text: t("imagePickerGallery"), onPress: () => pick("gallery") },
      { text: t("cancel"), style: "cancel" },
    ]);

  const handlePress = () => {
    if (disabled || loading) return;
    if (!value) {
      chooseSource();
      return;
    }
    Alert.alert(t("imagePickerOptionsTitle"), undefined, [
      { text: t("imagePickerChangeImage"), onPress: chooseSource },
      { text: t("imagePickerRemoveImage"), style: "destructive", onPress: () => onChange(null) },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      <YStack
        role="button"
        aria-label={value ? `${label}, ${t("imagePickerChangeImage")}` : `${label}, ${t("imagePickerPlaceholder")}`}
        aria-disabled={disabled}
        onPress={handlePress}
        pressStyle={disabled ? undefined : { opacity: 0.85 }}
        opacity={disabled ? 0.5 : 1}
        width="100%"
        aspectRatio={2}
        borderRadius={16}
        overflow="hidden"
        backgroundColor="$neutralCard"
        borderWidth={value ? 1 : 1.5}
        borderStyle={value ? "solid" : "dashed"}
        borderColor="$neutralRaisedBorder"
        alignItems="center"
        justifyContent="center"
        gap={8}
      >
        {value ? (
          <Image source={{ uri: value }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : loading ? (
          <ActivityIndicator color={tint} />
        ) : (
          <>
            <ImagePlus size={28} color={tint} strokeWidth={2} />
            <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted">
              {t("imagePickerPlaceholder")}
            </Text>
          </>
        )}
      </YStack>
    </YStack>
  );
}
