import { neutral } from "@/core/theme/tokens";
import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, Text, View, XStack, YStack } from "tamagui";
import { bottomInsetPadding } from "../../utils/safeArea";

export interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Muted line under the title (6B: the selected day). */
  subtitle?: string;
  /** Right after the title, e.g. a "2 selected" `ListChip` (T5). */
  badge?: ReactNode;
  /** In front of the title, e.g. the member's avatar (14C). */
  leading?: ReactNode;
  /** Next to the close button, e.g. a `TrashButton` when editing. */
  headerAction?: ReactNode;
  /** Fields. */
  children: ReactNode;
  /** Under the fields, usually a `PrimaryButton`. */
  footer?: ReactNode;
  /**
   * Tall sheet (12F Add product): nearly full height, the children fill the
   * space between the header and the footer (put a scroll view in them).
   */
  fill?: boolean;
}

/**
 * Standard bottom sheet with a small form (7B / 8B): raised fill, radius 28
 * on top, handle, title with a 44px close button, fields, primary button.
 * The footer stays above the Android navigation bar (edge-to-edge).
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  leading,
  badge,
  headerAction,
  children,
  footer,
  fill,
}: FormSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode={fill ? "percent" : "fit"}
      snapPoints={fill ? [92] : undefined}
      dismissOnSnapToBottom
      moveOnKeyboardChange
      zIndex={200_000}
    >
      <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame
        backgroundColor="$neutralRaised"
        borderTopLeftRadius="$header"
        borderTopRightRadius="$header"
        paddingHorizontal={20}
        paddingTop={10}
        paddingBottom={bottomInsetPadding(fill ? 28 : 36, insets.bottom)}
      >
        <Sheet.Handle backgroundColor="$neutralControl" />
        <YStack gap={fill ? 14 : 20} paddingTop={12} flex={fill ? 1 : undefined}>
          <XStack alignItems="center" gap={leading ? 12 : 10}>
            {leading}
            <YStack flex={1} minWidth={0} gap={2}>
              <Text fontSize="$section" fontWeight="$section" letterSpacing={-0.2} color="$neutralText" numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text fontSize={13} fontWeight="600" color="$neutralMuted" numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </YStack>
            {badge}
            {headerAction}
            <View
              role="button"
              aria-label={t("close")}
              onPress={() => onOpenChange(false)}
              pressStyle={{ opacity: 0.8 }}
              width={44}
              height={44}
              borderRadius={22}
              borderWidth={1}
              borderColor="$neutralRaisedBorder"
              backgroundColor="$neutralCard"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <X size={20} color={neutral.text} strokeWidth={2.2} />
            </View>
          </XStack>
          {fill ? (
            <YStack flex={1} minHeight={0} gap={14}>
              {children}
            </YStack>
          ) : (
            children
          )}
          {footer}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
