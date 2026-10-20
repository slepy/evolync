import { brand } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, View } from "tamagui";

export const LOGO = 88;

/**
 * 88px gradient "E" in the middle of the screen: the exact place and size of
 * the native splash logo (L1), so nothing moves when the splash hides.
 */
export function LaunchLogo() {
  return (
    <View
      role="img"
      aria-label={t("authLogoLabel")}
      position="absolute"
      top="50%"
      left="50%"
      marginTop={-LOGO / 2}
      marginLeft={-LOGO / 2}
      width={LOGO}
      height={LOGO}
      borderRadius={24}
      shadowColor={brand.logoShadow}
      shadowOffset={{ width: 0, height: 14 }}
      shadowOpacity={1}
      shadowRadius={20}
    >
      <View flex={1} borderRadius={24} overflow="hidden" alignItems="center" justifyContent="center">
        <LinearGradient colors={[...brand.logo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Text position="relative" zIndex={1} fontSize={44} fontWeight="$section" color={brand.logoText}>
          E
        </Text>
      </View>
    </View>
  );
}
