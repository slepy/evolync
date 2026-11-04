import { danger } from "@/core/theme/tokens";
import { Trash2 } from "lucide-react-native";
import type { ReactNode } from "react";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Text, YStack } from "tamagui";

const ACTION_WIDTH = 88;

export interface SwipeToDeleteProps {
  /** The row; it slides left over the red Delete action. */
  children: ReactNode;
  onDelete: () => void;
  /** Action label (default: "Delete"). */
  label?: string;
}

/**
 * Swipe a list row to the left to reveal a red Delete action (Alerts inbox);
 * a tap on the action deletes. The row gets the card fill so the action never
 * shows through a transparent row. The action is hidden from screen readers:
 * the row must expose a "delete" accessibility action instead. Needs the
 * `GestureHandlerRootView` of the root layout.
 */
export function SwipeToDelete({ children, onDelete, label }: SwipeToDeleteProps) {
  const text = label ?? t("delete");

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      renderRightActions={(_progress, _translation, methods) => (
        <YStack
          // Rendered (at opacity 0) even while closed: hidden from screen
          // readers, which use the row's "delete" accessibility action.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-label={text}
          onPress={() => {
            methods.close();
            onDelete();
          }}
          pressStyle={{ opacity: 0.8 }}
          width={ACTION_WIDTH}
          alignItems="center"
          justifyContent="center"
          gap={4}
          backgroundColor="$trashFill"
        >
          <Trash2 size={20} color={danger.text} strokeWidth={2.2} />
          <Text fontSize={12} fontWeight="700" color="$trashText">
            {text}
          </Text>
        </YStack>
      )}
    >
      <YStack backgroundColor="$neutralCard">{children}</YStack>
    </ReanimatedSwipeable>
  );
}
