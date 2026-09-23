import React from "react";
import { View, Text, YStack, Button, XStack } from "tamagui";
import { useTranslation } from "@/core/hooks/useTranslation";
import { changeLanguage, getAvailableLanguages } from "@/core/i18n/config";

interface LanguageSwitcherProps {
  variant?: "buttons" | "list";
}

/**
 * Language switcher component
 * Allows users to change the application language
 *
 * @param variant - Display variant: 'buttons' for horizontal buttons, 'list' for vertical list
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "buttons",
}) => {
  const { t, language } = useTranslation();
  const languages = getAvailableLanguages();

  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode as "en" | "pl");
  };

  if (variant === "list") {
    return (
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="bold">
          {t("settingsLanguage")}
        </Text>
        {languages.map((lang) => {
          const isActive = language === lang.code;
          return (
            <Button
              key={lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              variant="outlined"
              color={isActive ? "$pink11" : undefined}
              backgroundColor={isActive ? "$pink3" : undefined}
            >
              {lang.label}
            </Button>
          );
        })}
      </YStack>
    );
  }

  return (
    <XStack gap="$2" justifyContent="center" alignItems="center">
      {languages.map((lang) => {
        const isActive = language === lang.code;
        return (
          <Button
            key={lang.code}
            onPress={() => handleLanguageChange(lang.code)}
            size="$3"
            color={isActive ? "$pink11" : undefined}
            backgroundColor={isActive ? "$pink3" : undefined}
          >
            {lang.label}
          </Button>
        );
      })}
    </XStack>
  );
};
