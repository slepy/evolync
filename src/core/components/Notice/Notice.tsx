import { warning } from "@/core/theme/tokens";
import { Info } from "lucide-react-native";
import { Text, XStack } from "tamagui";

export interface NoticeProps {
  text: string;
}

/** Amber status banner on top of a screen (N3 "This item is no longer available."). */
export function Notice({ text }: NoticeProps) {
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
      <Info size={20} color={warning.text} strokeWidth={2} />
      <Text flex={1} fontSize={14} fontWeight="700" lineHeight={20} color="$neutralText">
        {text}
      </Text>
    </XStack>
  );
}
