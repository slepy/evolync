import { danger } from "@/core/theme/tokens";
import { X } from "lucide-react-native";
import { View } from "tamagui";

export interface RejectButtonProps {
  label: string;
  onPress?: () => void;
}

/** 44px round reject button: red outline, x (16B). */
export function RejectButton({ label, onPress }: RejectButtonProps) {
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
      borderColor={danger.border}
      backgroundColor={danger.fill}
      alignItems="center"
      justifyContent="center"
    >
      <X size={20} color={danger.text} strokeWidth={2.4} />
    </View>
  );
}
