import React, { Component } from "react";
import { Text, YStack } from "tamagui";

/** Catches a GL / model load failure so a 3D screen shows a message instead of crashing. */
export class CanvasErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[CanvasErrorBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center" padding={24} backgroundColor="$neutralPage">
          <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" textAlign="center">
            {t("threedLoadError")}
          </Text>
        </YStack>
      );
    }
    return this.props.children;
  }
}
