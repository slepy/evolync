/** Push text languages the server renders (see send-push templates). */
export type PushLocale = "en" | "pl";

export const toPushLocale = (language: string | null | undefined): PushLocale =>
  (language ?? "").toLowerCase().startsWith("pl") ? "pl" : "en";

export type PushPermission = "granted" | "denied" | "undetermined";

/**
 * Whether this device should hold an active push registration: the user has
 * not switched push off in Settings, and the OS permission is granted.
 * `preference === null` means the user never touched the switch (default on).
 */
export const shouldRegisterForPush = (
  preference: boolean | null,
  permission: PushPermission,
): boolean => preference !== false && permission === "granted";

/**
 * Whether to show the pre-permission rationale sheet: only when the OS has
 * not been asked yet, the user has not opted out, and the sheet was not
 * already dismissed.
 */
export const shouldShowPushRationale = (
  preference: boolean | null,
  permission: PushPermission,
  rationaleDismissed: boolean,
): boolean => preference !== false && permission === "undetermined" && !rationaleDismissed;
