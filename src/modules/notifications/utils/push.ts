/** Push text languages the server renders (see send-push templates). */
export type PushLocale = "en" | "pl" | "hu";

export const toPushLocale = (language: string | null | undefined): PushLocale => {
  const code = (language ?? "").toLowerCase();
  if (code.startsWith("pl")) return "pl";
  if (code.startsWith("hu")) return "hu";
  return "en";
};

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

/** Re-register at most this often unless something changed. */
export const PUSH_REREGISTER_INTERVAL_MS = 12 * 60 * 60 * 1000;

/**
 * Whether a routine (dashboard) sync should re-register the token: never
 * registered, the push language changed, or the last registration is stale.
 */
export const isPushRegistrationStale = (
  last: { at: number; locale: PushLocale } | null,
  locale: PushLocale,
  now: number,
): boolean => !last || last.locale !== locale || now - last.at >= PUSH_REREGISTER_INTERVAL_MS;
