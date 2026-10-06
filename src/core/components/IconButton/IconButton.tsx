import { neutral } from "@/core/theme/tokens";
import type { LucideIcon } from "lucide-react-native";
import { View } from "tamagui";

export interface IconButtonProps {
  icon: LucideIcon;
  /** Accessible label ("Mark all as read"). */
  label: string;
  onPress: () => void;
}

/** 44px round neutral button next to a screen title (N1 "Mark all as read"). */
export function IconButton({ icon: Icon, label, onPress }: IconButtonProps) {
  return (
    <View
      role="button"
      aria-label={label}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      width={44}
      height={44}
      borderRadius={22}
      borderWidth={1}
      borderColor="$neutralRaisedBorder"
      backgroundColor="$neutralCard"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Icon size={20} color={neutral.text} strokeWidth={2.2} />
    </View>
  );
}
