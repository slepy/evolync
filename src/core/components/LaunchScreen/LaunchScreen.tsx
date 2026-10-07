import { brand, neutral } from "@/core/theme/tokens";
import { useStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { CloudOff } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { resolveLaunchStatus, type LaunchStatus } from "./launchStatus";

const LOGO = 88;
const TRACK = 160;
const BAR = 64;

/**
 * 88px gradient "E" in the middle of the screen: the exact place and size of
 * the native splash logo (L1), so nothing moves when the splash hides.
 */
function LaunchLogo() {
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

/** 160px track with a 64px gradient bar sliding through it (indeterminate). */
function LaunchProgress() {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-BAR, TRACK] });

  return (
    <View role="progressbar" aria-label={t("loading")} width={TRACK} height={4} borderRadius={2} backgroundColor="$neutralRaised" overflow="hidden">
      <Animated.View style={{ width: BAR, height: 4, transform: [{ translateX }] }}>
        <LinearGradient
          colors={[...brand.logo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: 2 }}
        />
      </Animated.View>
    </View>
  );
}

export interface LaunchScreenViewProps {
  status: LaunchStatus;
}

/**
 * Loading between the native splash and the first screen (L2 / L3): the logo
 * stays where the splash drew it, brand glow on top, "Evolync" with its line
 * under the logo, and the sync progress at the bottom. Offline it adds the
 * Offline pill and says the data opens from the device.
 */
export function LaunchScreenView({ status }: LaunchScreenViewProps) {
  const offline = status === "offline";

  return (
    <YStack flex={1} backgroundColor="$neutralPage">
      <LinearGradient
        colors={[brand.glow, "transparent"]}
        locations={[0, 1]}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 340 }}
      />
      <LaunchLogo />
      <YStack position="absolute" left={0} right={0} top="50%" marginTop={LOGO / 2 + 20} alignItems="center" gap={6}>
        <Text fontSize={28} fontWeight="$section" letterSpacing={0.5} color="$neutralText">
          Evolync
        </Text>
        <Text fontSize={14} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {t("launchTagline")}
        </Text>
      </YStack>
      <YStack
        position="absolute"
        left={0}
        right={0}
        bottom={offline ? 64 : 72}
        paddingHorizontal={40}
        alignItems="center"
        gap={offline ? 12 : 14}
      >
        <LaunchProgress />
        {offline ? (
          <>
            <XStack alignItems="center" gap={6} height={30} paddingHorizontal={12} borderRadius={15} backgroundColor="$neutralTintFill">
              <CloudOff size={14} color={neutral.tint} strokeWidth={2.4} />
              <Text fontSize={12} fontWeight="700" color="$neutralTint">
                {t("syncOffline")}
              </Text>
            </XStack>
            <Text fontSize={13} fontWeight="$secondary" lineHeight={19.5} color="$neutralMuted" textAlign="center">
              {t("launchOfflineMessage")}
            </Text>
          </>
        ) : (
          <Text fontSize={13} fontWeight="600" color="$neutralMuted">
            {t("launchSyncing")}
          </Text>
        )}
      </YStack>
    </YStack>
  );
}

/** `LaunchScreenView` following the device connection. */
export function LaunchScreen() {
  const isOnline = useStore((s) => s.sync.isOnline);
  return <LaunchScreenView status={resolveLaunchStatus({ isOnline })} />;
}
