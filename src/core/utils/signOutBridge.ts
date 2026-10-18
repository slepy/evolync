/**
 * Sign-out bridge.
 *
 * `core` must never import from other modules (see CLAUDE.md), but the shared
 * `Header` component needs to trigger sign-out from its logout menu item.
 * The `auth` module registers its real implementation here once, near the app
 * root (see app/_layout.tsx), so `core` never has a static import of `auth`.
 */
let signOutHandler: (() => Promise<void>) | null = null;

export const registerSignOutHandler = (handler: () => Promise<void>): void => {
  signOutHandler = handler;
};

export const signOut = async (): Promise<void> => {
  if (!signOutHandler) {
    console.warn("[signOutBridge] No sign-out handler registered");
    return;
  }
  await signOutHandler();
};
