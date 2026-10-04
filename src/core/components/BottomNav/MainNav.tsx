import { NotificationRepository } from "@/modules/notifications/repositories";
import { useStore } from "@/store";
import { usePathname, useRouter, type Href } from "expo-router";
import { Bell, House, NotebookPen, Settings, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { BottomNav, type BottomNavItem } from "./BottomNav";
import {
  activeNavKey,
  hasAlertDot,
  NAV_HOME_HREF,
  NAV_HREF,
  resolveNavHome,
  type NavHome,
} from "./navItems";
import { useNavStore } from "./navStore";

export interface MainNavProps {
  /** Set on a dashboard: makes it the Home the tab screens go back to. */
  home?: NavHome;
}

function useUnreadCount(userId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    const subscription = NotificationRepository.observeUnreadCount(userId).subscribe(setCount);
    return () => subscription.unsubscribe();
  }, [userId]);

  return count;
}

/**
 * The app's bottom nav: Home, Notebook, Alerts, Profile, Settings. Knows the
 * active item from the route, the Home dashboard from the last one shown and
 * the unread alerts from the local database.
 */
export function MainNav({ home: homeProp }: MainNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const ownsOrganization = useStore((s) => !!s.organization);
  const userId = useStore((s) => s.user?.id);
  const remembered = useNavStore((s) => s.home);
  const setHome = useNavStore((s) => s.setHome);
  const unread = useUnreadCount(userId);

  useEffect(() => {
    if (homeProp) setHome(homeProp);
  }, [homeProp, setHome]);

  const home = homeProp ?? resolveNavHome(remembered, ownsOrganization);
  const go = (href: string) => () => router.navigate(href as Href);

  const items: BottomNavItem[] = [
    { key: "home", icon: House, label: t("navHome"), onPress: go(NAV_HOME_HREF[home]) },
    { key: "notebook", icon: NotebookPen, label: t("navNotebook"), onPress: go(NAV_HREF.notebook) },
    {
      key: "alerts",
      icon: Bell,
      label: t("navAlerts"),
      onPress: go(NAV_HREF.alerts),
      dot: hasAlertDot(unread),
    },
    { key: "profile", icon: UserRound, label: t("navProfile"), onPress: go(NAV_HREF.profile) },
    { key: "settings", icon: Settings, label: t("navSettings"), onPress: go(NAV_HREF.settings) },
  ];

  return <BottomNav context={home} items={items} activeKey={activeNavKey(pathname)} />;
}
