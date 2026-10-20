import { neutral } from "@/core/theme/tokens";
import { Mail } from "lucide-react-native";
import { Text, XStack } from "tamagui";

export interface MetaLineProps {
  icon: typeof Mail;
  text: string;
  weight?: "500" | "600";
  italic?: boolean;
}

export function MetaLine({ icon: Icon, text, weight = "500", italic }: MetaLineProps) {
  return (
    <XStack alignItems="center" gap={6}>
      <Icon size={13} color={neutral.muted} strokeWidth={2} />
      <Text flex={1} fontSize={12.5} fontWeight={weight} fontStyle={italic ? "italic" : "normal"} color="$neutralMuted" numberOfLines={1}>
        {text}
      </Text>
    </XStack>
  );
}
