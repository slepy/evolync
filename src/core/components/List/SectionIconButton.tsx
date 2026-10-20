import type { LucideIcon } from "lucide-react-native";
import { View } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";
import type { ListSectionAction } from "./types";

interface SectionIconButtonProps {
  action: ListSectionAction & { icon: LucideIcon };
  accent: ListAccent;
}

/** 44px round icon button in a `ListSection` header (16A: new invite code). */
export function SectionIconButton({ action, accent }: SectionIconButtonProps) {
  const a = resolveListAccent(accent);
  const Icon = action.icon;

  return (
    <View
      role="button"
      aria-label={action.label}
      onPress={action.onPress}
      pressStyle={{ opacity: 0.8 }}
      width={44}
      height={44}
      borderRadius={22}
      backgroundColor={a.fill}
      alignItems="center"
      justifyContent="center"
    >
      <Icon size={20} color={a.tint} strokeWidth={2.2} />
    </View>
  );
}
