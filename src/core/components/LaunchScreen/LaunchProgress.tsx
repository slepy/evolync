import { brand } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { View } from "tamagui";

const TRACK = 160;

const BAR = 64;

/** 160px track with a 64px gradient bar sliding through it (indeterminate). */
export function LaunchProgress() {
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
