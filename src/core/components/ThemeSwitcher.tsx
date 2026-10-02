import React from "react";
import { Text, YStack, Button, XStack } from "tamagui";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useThemePreference, type ThemePreference } from "@/core/theme";

interface ThemeSwitcherProps {
  variant?: "buttons" | "list";
}

const THEME_OPTIONS = [
  { value: "system", labelKey: "themeSystem" },
  { value: "light", labelKey: "themeLight" },
  { value: "dark", labelKey: "themeDark" },
] as const satisfies readonly { value: ThemePreference; labelKey: string }[];

/**
 * Appearance switcher (System / Light / Dark), styled like LanguageSwitcher.
 * The choice applies instantly and is stored per device.
 *
 * @param variant - Display variant: 'buttons' for horizontal buttons, 'list' for vertical list
 */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = "buttons",
}) => {
  const { t } = useTranslation();
  const { preference, setPreference } = useThemePreference();

  if (variant === "list") {
    return (
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="bold">
          {t("settingsAppearance")}
        </Text>
        {THEME_OPTIONS.map((option) => {
          const isActive = preference === option.value;
          return (
            <Button
              key={option.value}
              onPress={() => setPreference(option.value)}
              variant="outlined"
              color={isActive ? "$pink11" : undefined}
              backgroundColor={isActive ? "$pink3" : undefined}
            >
              {t(option.labelKey)}
            </Button>
          );
        })}
      </YStack>
    );
  }

  return (
    <XStack gap="$2" justifyContent="center" alignItems="center">
      {THEME_OPTIONS.map((option) => {
        const isActive = preference === option.value;
        return (
          <Button
            key={option.value}
            onPress={() => setPreference(option.value)}
            size="$3"
            color={isActive ? "$pink11" : undefined}
            backgroundColor={isActive ? "$pink3" : undefined}
          >
            {t(option.labelKey)}
          </Button>
        );
      })}
    </XStack>
  );
};
