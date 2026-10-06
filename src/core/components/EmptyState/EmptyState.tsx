import { neutral } from "@/core/theme/tokens";
import { Plus, type LucideIcon } from "lucide-react-native";
import { Text, View, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";
import { PrimaryButton } from "../PrimaryButton/PrimaryButton";

export interface EmptyStateProps {
  icon: LucideIcon;
  /** 22/800 ("No notifications yet"). */
  title: string;
  /** Muted line under the title: what shows up here. */
  text?: string;
  /**
   * Module whose list is empty (T2E notes: Notebook cyan): 88px icon square
   * in its accent. Without it the square is the neutral 72px one (N4).
   */
  accent?: ListAccent;
  /** Primary button under the text ("Add new"), in `accent`. */
  action?: { label: string; onPress: () => void; icon?: LucideIcon };
}

/** Empty screen (N4, T2E): icon square, title and a muted line, centered; optional primary action. */
export function EmptyState({ icon: Icon, title, text, accent, action }: EmptyStateProps) {
  const a = accent ? resolveListAccent(accent) : null;
  const size = a ? 88 : 72;

  return (
    <YStack alignItems="center" gap={14} paddingTop={a ? 120 : 128} paddingHorizontal={24}>
      <View
        width={size}
        height={size}
        borderRadius={a ? "$header" : 24}
        backgroundColor={a ? a.fill : "$neutralTintFill"}
        alignItems="center"
        justifyContent="center"
      >
        <Icon size={a ? 40 : 32} color={a ? a.tint : neutral.tint} strokeWidth={2} />
      </View>
      <Text fontSize={22} fontWeight="$section" letterSpacing={-0.3} color="$neutralText" textAlign="center">
        {title}
      </Text>
      {text ? (
        <Text fontSize={14} fontWeight="$secondary" lineHeight={21} color="$neutralMuted" textAlign="center">
          {text}
        </Text>
      ) : null}
      {action ? (
        <YStack marginTop={10}>
          <PrimaryButton inline label={action.label} icon={action.icon ?? Plus} accent={accent} onPress={action.onPress} />
        </YStack>
      ) : null}
    </YStack>
  );
}
