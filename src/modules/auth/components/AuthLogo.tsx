import { brand } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import { Text, View, YStack } from "tamagui";

export interface AuthLogoProps {
  subtitle: string;
}

/** Sign in header: 72px gradient "E" logo, "Evolync", one muted line under it. */
export const AuthLogo: React.FC<AuthLogoProps> = ({ subtitle }) => (
  <YStack alignItems="center" gap={10} marginBottom={6}>
    <View
      role="img"
      aria-label={t("authLogoLabel")}
      width={72}
      height={72}
      borderRadius={20}
      marginBottom={4}
      shadowColor={brand.logoShadow}
      shadowOffset={{ width: 0, height: 12 }}
      shadowOpacity={1}
      shadowRadius={16}
    >
      <View flex={1} borderRadius={20} overflow="hidden" alignItems="center" justifyContent="center">
        <LinearGradient colors={[...brand.logo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Text position="relative" zIndex={1} fontSize={36} fontWeight="$section" color={brand.logoText}>
          E
        </Text>
      </View>
    </View>
    <Text fontSize={28} fontWeight="$section" letterSpacing={0.5} color="$neutralText">
      Evolync
    </Text>
    <Text fontSize={14} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
      {subtitle}
    </Text>
  </YStack>
);
