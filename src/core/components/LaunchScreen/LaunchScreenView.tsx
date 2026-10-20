import { brand, neutral } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { CloudOff } from "lucide-react-native";
import { Text, XStack, YStack } from "tamagui";
import type { LaunchStatus } from "./launchStatus";
import { LOGO, LaunchLogo } from "./LaunchLogo";
import { LaunchProgress } from "./LaunchProgress";

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
