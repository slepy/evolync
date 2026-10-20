import type { LucideIcon } from "lucide-react-native";
import { Image, StyleSheet } from "react-native";
import { View } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";
import { ListIcon } from "./ListIcon";

export interface ListImageProps {
  uri?: string | null;
  icon: LucideIcon;
  accent?: ListAccent;
  size?: 48 | 44 | 36;
}

/** Photo in the icon square (product image); without a photo, the module-tinted `ListIcon`. */
export function ListImage({ uri, icon, accent = "neutral", size = 48 }: ListImageProps) {
  if (!uri) return <ListIcon icon={icon} accent={accent} size={size} />;
  return (
    <View
      width={size}
      height={size}
      borderRadius={size === 48 ? "$rowIcon" : size === 44 ? 14 : 12}
      overflow="hidden"
      backgroundColor={resolveListAccent(accent).fill}
      flexShrink={0}
    >
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
    </View>
  );
}
