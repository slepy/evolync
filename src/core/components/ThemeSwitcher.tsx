import React from "react";
import { Sun } from "lucide-react-native";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useThemePreference, type ThemePreference } from "@/core/theme";
import { ChoiceList } from "./ChoiceList";
import { SettingsCard } from "./SettingsCard";

const THEME_OPTIONS = [
  { value: "system", labelKey: "themeSystem", hintKey: "themeSystemHint" },
  { value: "light", labelKey: "themeLight" },
  { value: "dark", labelKey: "themeDark" },
] as const satisfies readonly { value: ThemePreference; labelKey: string; hintKey?: string }[];

/**
 * Appearance card of the Settings tab (17A): System / Light / Dark radio rows.
 * The choice applies instantly and is stored per device.
 */
export const ThemeSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { preference, setPreference } = useThemePreference();

  return (
    <SettingsCard icon={Sun} title={t("settingsAppearance")} subtitle={t("settingsAppearanceHint")}>
      <ChoiceList<ThemePreference>
        options={THEME_OPTIONS.map((option) => ({
          value: option.value,
          title: t(option.labelKey),
          hint: "hintKey" in option ? t(option.hintKey) : undefined,
        }))}
        value={preference}
        onChange={setPreference}
        accent="light"
        surface="page"
      />
    </SettingsCard>
  );
};
