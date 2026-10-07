import { ListCard, ListIcon, ListRow, MainNav, TabPage } from "@/core/components";
import { LanguageSwitcher } from "@/core/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/core/components/ThemeSwitcher";
import { PushNotificationsSetting } from "@/modules/notifications";
import { useRouter } from "expo-router";
import { Ticket } from "lucide-react-native";

/** Settings tab (17A / 17B), every role: push on this device, language, appearance, Join a school. */
export default function SettingsScreen() {
  const router = useRouter();

  return (
    <TabPage title={t("settingsTitle")} gap={16} nav={<MainNav />}>
      <PushNotificationsSetting />
      <LanguageSwitcher />
      <ThemeSwitcher />
      <ListCard aria-label={t("noSchoolJoin")}>
        <ListRow
          title={t("noSchoolJoin")}
          subtitle={t("joinSchoolSettingsHint")}
          leading={<ListIcon icon={Ticket} accent="school" size={44} />}
          onPress={() => router.push("/school/join" as any)}
        />
      </ListCard>
    </TabPage>
  );
}
