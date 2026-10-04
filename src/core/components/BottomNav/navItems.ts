/** The five main destinations of the bottom nav, in order. */
export const NAV_KEYS = ["home", "notebook", "alerts", "profile", "settings"] as const;
export type NavKey = (typeof NAV_KEYS)[number];

/** Which dashboard Home opens: the organization one or the member (student) one. */
export type NavHome = "organization" | "student";

export const NAV_HOME_HREF: Record<NavHome, string> = {
  organization: "/organization/dashboard",
  student: "/user/dashboard",
};

export const NAV_HREF: Record<Exclude<NavKey, "home">, string> = {
  notebook: "/techniques",
  alerts: "/notifications",
  profile: "/user/profile",
  settings: "/user/settings",
};

/** The nav item a route belongs to, or null for screens outside the nav (lists, forms). */
export function activeNavKey(pathname: string): NavKey | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === NAV_HOME_HREF.organization || path === NAV_HOME_HREF.student) return "home";
  if (path === NAV_HREF.notebook || path.startsWith(`${NAV_HREF.notebook}/`)) return "notebook";
  if (path === NAV_HREF.alerts || path.startsWith(`${NAV_HREF.alerts}/`)) return "alerts";
  if (path === NAV_HREF.profile) return "profile";
  if (path === NAV_HREF.settings) return "settings";
  return null;
}

/**
 * Home of the current session: the dashboard last shown, else the
 * organization one for an owner and the member one for everyone else.
 */
export function resolveNavHome(remembered: NavHome | null, ownsOrganization: boolean): NavHome {
  return remembered ?? (ownsOrganization ? "organization" : "student");
}

/** Alerts badge: a dot, shown only with unread notifications. */
export const hasAlertDot = (unread: number) => unread > 0;
