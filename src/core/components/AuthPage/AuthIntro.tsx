import type { ReactNode } from "react";
import { Text, YStack } from "tamagui";

export interface AuthIntroProps {
  title: string;
  description?: ReactNode;
  /** Optional 56px icon square above the title (`IntroIcon`; Join a school: ticket). */
  icon?: ReactNode;
  /** Icon, title and description centered, 10px apart (Join a school "Enter the school code"). */
  centered?: boolean;
}

/** 24/800 title with a muted 14/500 description (forgot password, new password, Join a school). */
export function AuthIntro({ title, description, icon, centered }: AuthIntroProps) {
  const align = centered ? "center" : undefined;
  return (
    <YStack gap={centered ? 10 : 18} alignItems={align} paddingHorizontal={centered ? 8 : 0} paddingTop={centered ? 4 : 0}>
      {icon}
      <YStack gap={centered ? 10 : 6} alignItems={align}>
        <Text fontSize={24} lineHeight={29} fontWeight="$section" letterSpacing={-0.4} color="$neutralText" textAlign={align}>
          {title}
        </Text>
        {description ? (
          <Text fontSize={14} lineHeight={21} fontWeight="$secondary" color="$neutralMuted" textAlign={align}>
            {description}
          </Text>
        ) : null}
      </YStack>
    </YStack>
  );
}
