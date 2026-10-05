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

### BaseCard Component

Always use `BaseCard` from `@/modules/core/components` for interactive cards (not raw Tamagui Card):

```typescript
import { BaseCard } from "@/modules/core/components";
<BaseCard onPress={handlePress}>{/* content */}</BaseCard>
```

### Shared Components and Design Tokens

- **All general (module-independent) components go in `src/core/components/`**, one folder per component (e.g. `src/core/components/NextUp/`), exported from `src/core/components/index.ts`, imported as `@/core/components`. Module folders keep only module-specific UI. Do not add new shared components to `src/modules/core/components` (legacy: `BaseCard`, `Header`, …).
- Components never hardcode hex: values come from `src/core/theme/tokens.ts`, exposed in Tamagui as tokens (`$neutralCard`, `$paymentsTint`, `$schoolFrom`, radius `$header` / `$card`, text roles `fontSize="$section" fontWeight="$section"`). Rules and component specs: `design-mockups` skill.
- Split presentational from data: the presentational component takes plain props (`NextUpCard`); a connected wrapper loads its own data from WatermelonDB through module repositories (`NextUp` + `useNextUp`). Pure logic in its own file, tested in `__tests__/`.
- Built so far: dashboard layout → `DashboardPage` (context glow) + `DashboardHeader` (`ContextSwitcher` left, `SyncedPill` / `SyncedPillView` right); context switch → `ContextSwitcher` (organization / school / student variant) + `ContextSheet`; bottom nav → `MainNav` (Home / Notebook / Alerts / Profile / Settings, active pill in the context gradient; dashboards pass `home`, screens with it pad content by `useBottomNavSpace()`) on top of the presentational `BottomNav`; shared notebook section → `TechniqueNotebook` (connected) / `TechniqueNotebookSection` (Open notebook + Tags rows, `+` adds a tag); header box → `NextUp` / `NextUpCard`; calendar opened from the hero (6 / 6A / 6B) → `Calendar` (connected: scope organization / school / student, `show`, `canAdd`, `onAdd(kind, day)`, `onItemPress`) on top of `CalendarView` + `CalendarAddSheet`, month logic in `calendarMonth.ts`; tile → `ModuleTile` in `ModuleTileGrid`; wide neutral row below the tiles ("School settings", 2A) → `SettingsTile`; list → `ListSection` + `ListCard` + `ListRow` (slots filled with `ListIcon`, `ListAvatar`, `ListChip`, `ListCheckbox`, `ListCheck`, `ListUnreadDot`, `ListAddButton`); sub-screen (list / form opened from a dashboard) → `SubScreenPage` / `SubScreenHeader` (back chevron, title, Sync pill; `footer` pins a form screen's primary button above the keyboard, 9B); photo in a list row → `ListImage` (falls back to `ListIcon`); photo field of a form → `PhotoField`; primary action (Create / Save) → `PrimaryButton` (`label`, `onPress`, `accent` or explicit `colors`, `loading`, `disabled`), never a module-local button; delete → `TrashButton`; text input → `TextField` (focus border in the module accent, `keyboardType`, `multiline`); field that opens a picker (COLOR, STUDENT) → `SelectField` (label, value / placeholder, optional leading swatch, chevron); small form sheet → `FormSheet` (title, close, optional `headerAction`, `footer`); one answer from 2–4 options → `ChoiceList` (radio rows, 11A "Who is it for?"); row of pills picking one value → `PillGroup` (`segment`: Single / Recurring, Weekly / Monthly; `circle`: weekdays); field opening the system date / time picker → `DateTimeField` (`mode` date / time, `format`, `min` / `max`); "Who is it for?" / "Who can see it?" (organization / one school / selected members, 10A / 11A) → `AudienceChoice` (`title`, `accent`); CURRENCY picker → `CurrencySheet` (`options`, `accent`); half-width Edit / Cancel pills of a details screen → `ActionPill`; counts of people by status (Paid / Attending / Absent) → `StatusSummary` (header, segmented bar, legend; `onPress` + `actionLabel` make it the "Manage ›" link of a details screen, static above the list it summarizes), never a row of separate counters.

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

**Modules:** attendance, auth, core, dashboard, events, grading, inventory, notifications, orders, organization, payments, school, settings, students, threed

**Infrastructure:** `src/database/` - central WatermelonDB config, models, schema, migrations · `src/core/` - shared components, design tokens/theme, i18n (`src/core/components` may read data only through module repositories, never services or module components)

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
