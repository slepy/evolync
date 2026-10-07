import { MainNav, TabPage } from "@/core/components";
import { LanguageSwitcher } from "@/core/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/core/components/ThemeSwitcher";
import { PushNotificationsSetting } from "@/modules/notifications";

/** Settings tab (17A / 17B), every role: push on this device, language, appearance. */
export default function SettingsScreen() {
  return (
    <TabPage title={t("settingsTitle")} gap={16} nav={<MainNav />}>
      <PushNotificationsSetting />
      <LanguageSwitcher />
      <ThemeSwitcher />
    </TabPage>
  );
}
