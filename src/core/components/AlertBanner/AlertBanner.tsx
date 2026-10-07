import { danger } from "@/core/theme/tokens";
import { CircleAlert, X } from "lucide-react-native";
import { Text, View, XStack, YStack } from "tamagui";

export interface AlertBannerProps {
  /** Bold first line ("Wrong email or password"). */
  title: string;
  /** What to do about it. */
  message?: string;
  /** Shows the × button. */
  onDismiss?: () => void;
}

/**
 * Error alert above a form (sign in error board): red fill and border,
 * alert icon, bold title, softer message, optional dismiss ×.
 */
export function AlertBanner({ title, message, onDismiss }: AlertBannerProps) {
  return (
    <XStack
      role="alert"
      alignItems="flex-start"
      gap={12}
      paddingVertical={14}
      paddingLeft={16}
      paddingRight={onDismiss ? 8 : 16}
      borderRadius="$card"
      backgroundColor="$trashFill"
      borderWidth={1}
      borderColor="$trashBorder"
    >
      <View paddingTop={1} flexShrink={0}>
        <CircleAlert size={20} color={danger.text} strokeWidth={2} />
      </View>
      <YStack flex={1} gap={3}>
        <Text fontSize={14} fontWeight="$button" color="$neutralText">
          {title}
        </Text>
        {message ? (
          <Text fontSize={13} fontWeight="$secondary" lineHeight={19} color={danger.soft}>
            {message}
          </Text>
        ) : null}
      </YStack>
      {onDismiss ? (
        <View
          role="button"
          aria-label={t("dismiss")}
          onPress={onDismiss}
          pressStyle={{ opacity: 0.7 }}
          width={32}
          height={32}
          marginTop={-6}
          borderRadius={16}
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <X size={16} color={danger.text} strokeWidth={2.4} />
        </View>
      ) : null}
    </XStack>
  );
}
