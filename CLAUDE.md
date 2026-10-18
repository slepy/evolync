# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Evolync is a cross-platform mobile application (React Native + Expo) combining sports school CRM functionality with advanced 3D visualization and notation tools for movement techniques. The system is designed with an **offline-first architecture**, critical for instructors working in locations with limited internet connectivity.

**Key Roles:**

- **Instructor:** Manages schools, students, payments, equipment orders, and creates training plans with 3D visualizations
- **Student:** Monitors payment status, orders equipment, receives announcements, and creates private 3D technical notes

## Available Skills

Use these skills for structured workflows:

| Skill | Type | When to use |
| --- | --- | --- |
| `new-model` | Auto | Adding a new database model (schema, model class, migrations, repository, Supabase) |
| `new-screen` | Auto | Adding a new screen/route (hook, component, route, translations) |
| `new-module` | Auto | Creating a new feature module from scratch |
| `add-types` | Auto | Adding DTOs, enums, db interfaces, or helpers to a module's types/ folder |
| `threed-guide` | Auto | Working with 3D editor, techniques, sequences, bone transforms |
| `design-mockups` | Auto | Building design mockups on the canvas: accent colors, button labels, list / tile / hero header components |
| `/add-feature` | Manual | End-to-end feature implementation workflow |
| `/fix-bug` | Manual | Systematic bug investigation and fixing |
| `/add-translations` | Manual | Adding translation keys with mandatory duplicate checking |

## Technology Stack

- **Framework:** React Native + Expo (Managed Workflow), TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Local DB:** WatermelonDB (offline-first, sync with Supabase)
- **3D:** React Three Fiber, expo-gl, Drei. PRD: [.ai/3d-prd.md](.ai/3d-prd.md)
- **State:** Zustand
- **UI:** Tamagui, Expo Router, React Hook Form + Zod, Lucide icons
- **i18n:** i18next + react-i18next + expo-localization

## Critical Rules

### Supabase Import

Due to Metro bundler limitations, Supabase client MUST use `require()`:

```typescript
// CORRECT
const { createClient } = require('@supabase/supabase-js');

// WRONG - causes bundler errors
import { createClient } from '@supabase/supabase-js';
```

Primary instance: `import { supabase } from '@/config/supabase';`

### Translations (i18n)

- `t()` is available **globally** - NO IMPORTS needed
- **NEVER hardcode user-facing text** - always use `t("key")`
- **CRITICAL:** Before adding new keys, search `en.json`/`pl.json` for existing duplicates
- Add keys to BOTH `en.json` AND `pl.json` simultaneously
- Location: `src/core/i18n/locales/`

### Shared Components and Design Tokens

- **All general (module-independent) components go in `src/core/components/`**, one folder per component (e.g. `src/core/components/NextUp/`), exported from `src/core/components/index.ts`, imported as `@/core/components`. Module folders keep only module-specific UI. There is one `core` folder: shared hooks go in `src/core/hooks/` (`@/core/hooks`, e.g. `useDirtyFlag`), shared helpers in `src/core/utils/` (`@/core/utils/…`: `formatters`, `confirmDelete`, `phoneHelpers`, `currencies`, `uploadImage`, `signOutBridge`); there is no `src/modules/core`.
- Components never hardcode hex: values come from `src/core/theme/tokens.ts`, exposed in Tamagui as tokens (`$neutralCard`, `$paymentsTint`, `$schoolFrom`, radius `$header` / `$card`, text roles `fontSize="$section" fontWeight="$section"`). Rules and component specs: `design-mockups` skill.
- Split presentational from data: the presentational component takes plain props (`NextUpCard`); a connected wrapper loads its own data from WatermelonDB through module repositories (`NextUp` + `useNextUp`). Pure logic in its own file, tested in `__tests__/`.
- Built so far: dashboard layout → `DashboardPage` (context glow) + `DashboardHeader` (`ContextSwitcher` left, `SyncedPill` / `SyncedPillView` right); context switch (3) → `ContextSwitcher` (organization / school / student / `neutral` variant: kicker over the name, up/down chevron) + `ContextSheet` (MANAGE / TRAIN AS STUDENT sections, `onJoinSchool` adds "Join another school"), options and actions from `useContextSwitch()`; student dashboard (4 in a school, 5 without one) → `StudentDashboard` in the dashboard module, page `context="neutral"` + `MainNav context="neutral"` before the first school; bottom nav → `MainNav` (Home / Notebook / Alerts / Profile / Settings, active pill in the context gradient; dashboards pass `home`, screens with it pad content by `useBottomNavSpace()`) on top of the presentational `BottomNav`; shared notebook section → `TechniqueNotebook` (connected) / `TechniqueNotebookSection` (Open notebook + Tags rows, `+` adds a tag); header box → `NextUp` / `NextUpCard`; calendar opened from the hero (6 / 6A / 6B) → `Calendar` (connected: scope organization / school / student, `show`, `canAdd`, `onAdd(kind, day)`, `onItemPress`) on top of `CalendarView` + `CalendarAddSheet`, month logic in `calendarMonth.ts`; tile → `ModuleTile` in `ModuleTileGrid`; wide neutral row below the tiles ("School settings", 2A) → `SettingsTile`; list → `ListSection` + `ListCard` + `ListRow` (slots filled with `ListIcon`, `ListAvatar` (member photo via `uri`, initials otherwise), `ListChip`, `ListCheckbox`, `ListCheck`, `ListUnreadDot`, `ListAddButton`); sub-screen (list / form opened from a dashboard) → `SubScreenPage` / `SubScreenHeader` (back chevron, title, Sync pill; `footer` pins a form screen's primary button above the keyboard, 9B); photo in a list row → `ListImage` (falls back to `ListIcon`); photo field of a form → `PhotoField`; primary action (Create / Save) → `PrimaryButton` (`label`, `onPress`, `accent` or explicit `colors`, `loading`, `disabled`), never a module-local button; delete → `TrashButton`; text input → `TextField` (focus border in the module accent, `keyboardType`, `multiline`); field that opens a picker (COLOR, STUDENT) → `SelectField` (label, value / placeholder, optional leading swatch, chevron); search above a long list (select sheet with more than 8 options, 12E1) → `SearchField` + `matchesSearch` (case- and diacritic-insensitive); small form sheet → `FormSheet` (title, close, optional `headerAction`, `footer`); one answer from 2–4 options → `ChoiceList` (radio rows, 11A "Who is it for?"); row of pills picking one value → `PillGroup` (`segment`: Single / Recurring, Weekly / Monthly; `circle`: weekdays); field opening the system date / time picker → `DateTimeField` (`mode` date / time, `format`, `min` / `max`); "Who is it for?" / "Who can see it?" (organization / one school / selected members, 10A / 11A) → `AudienceChoice` (`title`, `accent`); CURRENCY picker → `CurrencySheet` (`options`, `accent`); half-width Edit / Cancel pills of a details screen → `ActionPill`; counts of people by status (Paid / Attending / Absent) → `StatusSummary` (header, segmented bar, legend; `onPress` + `actionLabel` make it the "Manage ›" link of a details screen, static above the list it summarizes), never a row of separate counters; two views of one screen (Orders / Shopping list, 12A) → `ViewSwitch` (`accent`, `first` / `second`: icon, label, `onPress`; `active`); status chips above a list (12A) → `StatusFilter` (`options` with `label`, status `color`, `count`; `showCounts={false}` for label-only chips; selected options without a color take `accent`); status of a list row (right edge, under the amount) → `StatusBadge` (`label`, `color`: a `ListAccent` or `{ tint, fill }`); status toggle on the right of a member row (10D / 13B / 14B, a tap cycles to the next status) → `StatusButton` (`icon`, `color`, `label`); rate chip color (13A "70%", 14A "6/10": ≥80% green, 50–79% amber, <50% red) → `rateAccent(done, total)` + `ratePercent`, with the `success` / `warning` / `danger` list accents; tag after a row title (14A "CURRENT") → `ListRow` `badge`; empty list in place of a card → `ListEmpty` (`text`, `hint`); extra content under a Status summary (14B "Amounts") → `StatusSummary` children; avatar in front of a sheet title (14C) → `FormSheet` `leading`. Member avatar in any list or sheet (16A, rank corner in the belt color) → `MemberAvatar` (`name`, `uri`, `rankId`; loads the rank color), presentational `ListAvatar` `rankColor` / `dimmed`, sizes 36–64; group of fields in a card with an icon header (15A) → `FormCard`, its fields `inset`; leading icon in a text field (ADDRESS pin) → `TextField` `icon`; phone with country prefix (16C) → `PhoneField` (`prefixes`); three or more tabs with icon over label, each in its module color (16E) → `IconTabs`; count on a `ViewSwitch` tab (16A Requests) → item `badge`; round icon button before Add new (16A new invite code) → `ListSection` `iconAction`; destructive sheet row (16G Archive) → `ListRow` `danger`. Nav-tab screen other than Home (N1 Notifications, 17A Settings) → `TabPage` (28/800 title, Sync pill, `actions`, optional `context` glow, `nav`); 44px round button next to a title (N1 "Mark all as read") → `IconButton`; amber banner on top of a screen (N3 "no longer available") → `Notice`; empty screen (N4) → `EmptyState` (`icon`, `title`, `text`; with `accent` + `action` the module's empty list with its primary button, T2E); account-settings group (17A) → `FormCard` `accent="neutral"` `gap={14}`; switch row (17A push) → `ToggleRow` / `Toggle`; second button of a sheet ("Not now") or small pill in a card (17B "Open device settings") → `SecondaryButton` (`size` `lg` / `sm`); white selection of account settings (17A radio, switch, N5 "Turn on") → `light` accent; radio rows inside a card → `ChoiceList` `surface="page"`. Screens before a context exists (sign in, sign up, password reset) → `AuthPage` (brand glow, optional back `title`, pinned `footer`, `bottom` line) + `AuthIntro` (24/800 title, muted description, optional icon) + `AuthPrompt` ("No account yet? Sign up"); their fields → `TextField` `size="large"` (52px, page fill), `secure` for a password (eye toggle), `footer` for chips under the input (auth `PasswordRules`), `invalid` for a red border without a message; error alert above a form → `AlertBanner` (`title`, `message`, `onDismiss`). Tag (always Tags rose, whatever color it was saved with; T2 row 26px, T4 field 36px with `×`) → `TagChip`; category chips above a list (T2 tag filter: All, Guard…; selected in the accent gradient) → `ChipFilter`, status chips stay `StatusFilter`; dashed "add one more" (Add row block, Add tag chip, T3) → `DashedButton`; label-sized primary button (T2E) → `PrimaryButton` `inline`; "N selected" chip after a sheet title (T5) → `FormSheet` `badge`; row delete inside a card (T4) → `TrashButton` `size={40}`; rose text on the 16% fill (`#FDA4AF`) comes from the accent's `label`. Launch (L2 / L3): from the native splash (`expo-splash-screen`, page color + centered 88px logo) to the first screen every launch-path route (index, sign-in session check, OAuth callback, dashboards waiting for data) renders `LaunchScreen` (logo in the splash position, sync progress, Offline variant from the store), never a spinner; those routes fade in. Own-data form on a nav tab (P2 Profile) → `TabPage` `footer` (Save in place of the nav); read-only value with a lock (P1 sign-in EMAIL) → `TextField` `locked` + `hint`; phone in a 52px page-fill form → `PhoneField` `size="large"`. Student's own read-only lists (Payments / Attendance from the student dashboard) → static `StatusSummary` on top, rows with a `StatusBadge` on the right (amount above it for payments), no status buttons. Centered intro with an icon square (Join a school) → `AuthIntro` `centered` + `IntroIcon`; numbered "How it works" card → `StepList`; outcome of a flow ("Request sent": 88px status circle with a halo) → `StatusHero`; a context glow on an `AuthPage` → `context`. TAGS field of a form (notes, new 3D sequence) → `TagsField` from the tags module. 3D notebook (D2–D12, 3D lime) → the threed module screens: library `IconTabs` Sequences / Techniques / Positions; a screen showing the model → `SceneScreen` (the real `HumanModel` full screen, `SubScreenHeader` `compact` over it, card panel from the bottom); the sequence screen (D6) shows no model, the figure renders only after View (viewer) or in the editor; scene colors from `threedScene` tokens; the boards draw the figure as lines, the app always renders the 3D model.

### Offline-First Data Flow

1. All reads/writes go through local **WatermelonDB** - never directly from Supabase
2. UI subscribes to `.observe()` for reactive updates
3. Services call `sync().catch(console.error)` after mutations (fire-and-forget)
4. Only allowed direct Supabase calls: `auth.*`, `storage.*`, `rpc('setup_instructor_organization')`, `rpc('register_push_token')` / `rpc('disable_push_token')` (device push tokens are device state, not offline data), sync edge function

### Repository Pattern

- One repository per model in `src/modules/{module}/repositories/`
- Always `database.write()` for mutations
- Always `uuidv4()` for new record IDs
- Always `Q.where("deleted_at", null)` in queries
- Always include `observe*` methods for reactive UI
- Services orchestrate business logic, repositories handle data access only

## Architecture

### Modular Structure

```text
src/modules/{module}/
├── components/     # UI components (export via index.ts)
├── hooks/          # React hooks with .observe() subscriptions
├── repositories/   # Data access (CRUD + observe)
├── services/       # Business logic + sync triggers
├── types/          # DTOs and interfaces
├── validation/     # Zod schemas
├── database/       # WatermelonDB table schema
└── index.ts        # Public API barrel export
```

**Modules:** attendance, auth, dashboard, events, grading, inventory, notifications, orders, organization, payments, school, settings, students, threed

**Infrastructure:** `src/database/` - central WatermelonDB config, models, schema, migrations · `src/core/` - shared components, hooks, utils, design tokens/theme, i18n (`src/core/components` may read data only through module repositories, never services or module components)

**Rules:** No circular deps between modules. `core` never imports from other modules. Import from barrel exports.

### Authentication & School Management

- Email + Google OAuth via Supabase Auth
- Persistent sessions in Expo SecureStore
- Organization created on registration (Instructor = Owner)
- Student flow: Register → Join School (code) → Pending → Instructor approval → Active

### Key Features Not Included

- No online payment processing (manual only)
- No real-time collaborative 3D editing
- No sharing training plans with students
- No animated playback (static frames only)

## Performance Targets

- **3D:** 60 FPS during manipulation on mid-range devices
- **Pose creation:** Under 30 seconds for simple pose (trained users)
- **Sync:** 100% success rate when device returns online

## References

- Full PRD: [.ai/prd.md](.ai/prd.md)
- Tech stack: [.ai/tech_stack.md](.ai/tech_stack.md)
- 3D PRD: [.ai/3d-prd.md](.ai/3d-prd.md)
- i18n docs: [src/core/i18n/README.md](src/core/i18n/README.md)
