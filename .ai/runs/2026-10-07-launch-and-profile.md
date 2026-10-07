# Launch (L1–L3) and Profile (P1–P2) on the design boards

Source doc: canvas boards "Launch — native splash, then loading until the first screen (same logo position, no white frame)" (L1 Splash, L2 Loading, L3 Loading offline) and "Profile — your own data (nav tab, every role)" (P1 Profile, P2 Profile after a change).

## Goal

Rebuild the launch sequence (native splash → loading until the first screen) and the Profile tab with its edit flow to match the boards.

## Scope

- **L1** native splash: page color `#0B0E14` (no white), only the 88px gradient "E" logo, centered.
- **L2 / L3** JS loading screen: the logo stays in the same centered position, brand glow on top, "Evolync" + "Your schools and techniques in one place" under the logo, a 160px progress track at the bottom with "Syncing your schools…"; offline: Offline pill + "Opening data saved on this device. Changes sync when you are back online."
- The loading screen covers every step between the native splash and the first real screen: the index redirect, the session check on the sign-in route, the OAuth callback, the organization dashboard waiting for its organization. Those transitions do not animate, so no frame of another color shows.
- **P1** Profile tab: `TabPage` title "Profile" + Sync pill, `PhotoField` (same as products), "Personal info" card (FULL NAME, PHONE (OPTIONAL) with prefix), "Sign-in" card with the locked EMAIL field and its note, `MainNav` with Profile active.
- **P2** after the first change: Save (light) pinned at the bottom in place of the nav.
- Save keeps the existing persistence: avatar upload to the `avatars` bucket, `supabase.auth.updateUser` metadata (allowed direct `auth.*` call).

## Non-goals

- In-screen spinners of other screens (`LoadingScreen` stays for lists/details).
- Changing the sign-in email, password change, account deletion.
- The older Profile photo sheet board (superseded by "Photo field as on products").

## Implementation Plan

### Phase 1: Launch

1. Native splash: logo PNG on transparent background, `expo-splash-screen` plugin with `#0B0E14` (light and dark), Android adaptive icon background unchanged.
2. `LaunchScreen` shared component (`src/core/components/LaunchScreen`): logo, glow, title, progress, offline variant; status copy picked by a pure helper with a test.
3. Wire `LaunchScreen` into the launch path (index, sign-in session check, OAuth callback, organization dashboard) and turn off the stack animation for those replaces.

### Phase 2: Profile

1. Shared field changes: `TextField` `locked` (dashed, muted, lock icon, read-only), `PhoneField` `size="large"` (52px page fill), `TabPage` `footer` (pinned button in place of the nav).
2. `ProfileScreen` (auth module) on P1 / P2 + route, translations (en / pl), remove the unused old `ProfileForm`.
3. Tests for the profile form logic (validation / payload).

## Risks

- Native splash changes apply only after a new native build (`expo prebuild` / EAS); Expo Go keeps its own splash.
- Android 12+ splash API draws the icon inside a circular mask; the logo is centered with padding so it is not cropped.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Launch

- [ ] 1.1 Native splash on the page color with the centered logo
- [ ] 1.2 LaunchScreen shared component (L2 / L3)
- [ ] 1.3 LaunchScreen on the launch path without white frames

### Phase 2: Profile

- [ ] 2.1 Locked TextField, large PhoneField, TabPage footer
- [ ] 2.2 ProfileScreen on P1 / P2 with translations
- [ ] 2.3 Profile form logic tests
