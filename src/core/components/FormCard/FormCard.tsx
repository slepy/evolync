import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";
import { ListIcon } from "../List";
import type { ListAccent } from "../List/accent";

export interface FormCardProps {
  icon: LucideIcon;
  /** Colors the icon square (15A: Basic info in the school red, Payment defaults in green). */
  accent: ListAccent;
  /** "Basic info" */
  title: string;
  /** "Shown to students on the school page" */
  subtitle?: string;
  /** Fields. */
  children: ReactNode;
  /** Space between the header and the fields (17A settings cards: 14). */
  gap?: number;
}

/**
 * Group of form fields in one card (15A School settings, 17A account
 * settings): 40px icon square, 18/800 title with a muted line, then the fields.
 */
export function FormCard({ icon, accent, title, subtitle, children, gap = 16 }: FormCardProps) {
  return (
    <YStack
      gap={gap}
      paddingVertical={18}
      paddingHorizontal={16}
      borderRadius="$card"
      borderWidth={1}
      borderColor="$neutralCardBorder"
      backgroundColor="$neutralCard"
    >
      <XStack alignItems="center" gap={12}>
        <ListIcon icon={icon} accent={accent} size={40} />
        <YStack flex={1} minWidth={0} gap={2}>
          <Text fontSize={18} fontWeight="$section" color="$neutralText" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </YStack>
      </XStack>
      {children}
    </YStack>
  );
}
