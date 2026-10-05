import { neutral } from "@/core/theme/tokens";
import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Sheet, Text, View, XStack, YStack } from "tamagui";

export interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Muted line under the title (6B: the selected day). */
  subtitle?: string;
  /** Next to the close button, e.g. a `TrashButton` when editing. */
  headerAction?: ReactNode;
  /** Fields. */
  children: ReactNode;
  /** Under the fields, usually a `PrimaryButton`. */
  footer?: ReactNode;
}

/**
 * Standard bottom sheet with a small form (7B / 8B): raised fill, radius 28
 * on top, handle, title with a 44px close button, fields, primary button.
 */
export function FormSheet({ open, onOpenChange, title, subtitle, headerAction, children, footer }: FormSheetProps) {
  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode="fit"
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
        paddingBottom={36}
      >
        <Sheet.Handle backgroundColor="$neutralControl" />
        <YStack gap={20} paddingTop={12}>
          <XStack alignItems="center" gap={10}>
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
          {children}
          {footer}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
