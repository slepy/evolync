import { moduleAccents } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { View } from "tamagui";

export interface ApproveButtonProps {
  label: string;
  onPress?: () => void;
}

/** 44px round approve button in the Students gradient, check (16B). */
export function ApproveButton({ label, onPress }: ApproveButtonProps) {
  const accent = moduleAccents.students;
  return (
    <View
      role="button"
      aria-label={label}
      onPress={onPress}
      pressStyle={{ opacity: 0.85 }}
      width={44}
      height={44}
      borderRadius={22}
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
    >
      <LinearGradient colors={[accent.from, accent.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Check size={20} color={accent.buttonText} strokeWidth={2.8} />
    </View>
  );
}
