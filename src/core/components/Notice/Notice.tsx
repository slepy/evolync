import { warning } from "@/core/theme/tokens";
import { Info, type LucideIcon } from "lucide-react-native";
import { Text, XStack } from "tamagui";

export interface NoticeProps {
  text: string;
  /** Leading icon in amber; `Info` by default (14B3 locked period: `Lock`). */
  icon?: LucideIcon;
}

/** Amber status banner on top of a screen (N3 "This item is no longer available."). */
export function Notice({ text, icon: Icon = Info }: NoticeProps) {
  return (
    <XStack
      role="status"
      alignItems="center"
      gap={12}
      paddingVertical={12}
      paddingHorizontal={16}
      borderRadius={18}
      borderWidth={1}
      borderColor="$noticeBorder"
      backgroundColor="$noticeFill"
    >
      <Icon size={20} color={warning.text} strokeWidth={2} />
      <Text flex={1} fontSize={14} fontWeight="700" lineHeight={20} color="$neutralText">
        {text}
      </Text>
    </XStack>
  );
}
