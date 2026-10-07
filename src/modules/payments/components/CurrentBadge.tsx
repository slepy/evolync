import { Text, View } from "tamagui";

/** "CURRENT" tag after the title of the period that contains today (14A, student Payments). */
export function CurrentBadge() {
  return (
    <View paddingVertical={2} paddingHorizontal={8} borderRadius={8} backgroundColor="$paymentsFill" flexShrink={0}>
      <Text fontSize={10.5} fontWeight="$button" letterSpacing={0.6} textTransform="uppercase" color="$paymentsTint">
        {t("paymentsCurrent")}
      </Text>
    </View>
  );
}
