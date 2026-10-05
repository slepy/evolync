import * as Device from "expo-device";
import * as ExpoImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
} from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { neutral } from "@/core/theme/tokens";
import { resolveListAccent, type ListAccent } from "../List/accent";
import { TrashButton } from "../TrashButton/TrashButton";

export interface PhotoFieldProps {
  /** Accessible name of the photo ("Photo"); not drawn, 9B / 9C have no label. */
  label: string;
  /** Local file URI or remote URL; empty shows the add placeholder. */
  value?: string | null;
  onChange: (uri: string | null) => void;
  /** Tints the Add / Change photo action (module accent). */
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
    t(
      source === "camera"
        ? "imagePickerCameraPermissionTitle"
        : "imagePickerGalleryPermissionTitle",
    ),
    t(
      source === "camera"
        ? "imagePickerCameraPermissionMessage"
        : "imagePickerGalleryPermissionMessage",
    ),
  );
  return false;
}

/**
 * Photo of a form (9B / 9C): centered 96px square. Empty it is a dashed square
 * with a camera icon and the "Add photo" link in the module tint; with a photo
 * it shows the image, and under it the "Change photo" pill and the red trash.
 * Tapping the square or the pill asks Camera or Gallery.
 */
export function PhotoField({
  label,
  value,
  onChange,
  accent = "neutral",
  disabled,
}: PhotoFieldProps) {
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

  const busy = disabled || loading;
  const handlePress = () => {
    if (!busy) chooseSource();
  };

  const a = resolveListAccent(accent);

  return (
    <YStack alignItems="center" gap={10}>
      <YStack
        role="button"
        aria-label={`${label}, ${value ? t("imagePickerChangePhoto") : t("imagePickerAddPhoto")}`}
        aria-disabled={disabled}
        onPress={handlePress}
        pressStyle={disabled ? undefined : { opacity: 0.85 }}
        opacity={disabled ? 0.5 : 1}
        width={96}
        height={96}
        borderRadius={24}
        overflow="hidden"
        backgroundColor="$neutralCard"
        borderWidth={value ? 0 : 1.5}
        borderStyle="dashed"
        borderColor="$neutralControl"
        alignItems="center"
        justifyContent="center"
      >
        {value ? (
          <Image
            source={{ uri: value }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : loading ? (
          <ActivityIndicator color={a.tint} />
        ) : (
          <Camera size={24} color={neutral.muted} strokeWidth={2} />
        )}
      </YStack>
      {value ? (
        <XStack alignItems="center" gap={10}>
          <XStack
            role="button"
            aria-label={t("imagePickerChangePhoto")}
            aria-disabled={busy}
            onPress={busy ? undefined : chooseSource}
            pressStyle={busy ? undefined : { opacity: 0.8 }}
            opacity={busy ? 0.5 : 1}
            height={44}
            paddingHorizontal={18}
            borderRadius="$pill"
            backgroundColor={a.fill}
            alignItems="center"
            justifyContent="center"
          >
            <Text
              fontSize="$button"
              fontWeight="$button"
              color={a.tint}
              numberOfLines={1}
            >
              {t("imagePickerChangePhoto")}
            </Text>
          </XStack>
          <TrashButton
            onPress={() => onChange(null)}
            label={t("imagePickerRemoveImage")}
            disabled={busy}
          />
        </XStack>
      ) : (
        <Text
          role="button"
          aria-disabled={busy}
          onPress={busy ? undefined : chooseSource}
          fontSize={14}
          fontWeight="$button"
          color={a.tint}
        >
          {t("imagePickerAddPhoto")}
        </Text>
      )}
    </YStack>
  );
}
