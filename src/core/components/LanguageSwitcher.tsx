import React from "react";
import { Globe } from "lucide-react-native";
import { useTranslation } from "@/core/hooks/useTranslation";
import { changeLanguage, getAvailableLanguages } from "@/core/i18n/config";
import { ChoiceList } from "./ChoiceList";
import { FormCard } from "./FormCard";

type LanguageCode = "en" | "pl";

/**
 * Language card of the Settings tab (17A): one radio row per language, each
 * in its own language. Changes the app right away.
 */
export const LanguageSwitcher: React.FC = () => {
  const { t, language } = useTranslation();
  const languages = getAvailableLanguages();

  return (
    <FormCard icon={Globe} accent="neutral" gap={14} title={t("settingsLanguage")} subtitle={t("settingsLanguageHint")}>
      <ChoiceList<LanguageCode>
        options={languages.map((lang) => ({ value: lang.code as LanguageCode, title: lang.label }))}
        value={language as LanguageCode}
        onChange={(code) => {
          changeLanguage(code).catch(console.error);
        }}
        accent="light"
        surface="page"
      />
    </FormCard>
  );
};
