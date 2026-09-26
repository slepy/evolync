# Backward compatibility

This document inventories the protected contract surfaces of this repository and how a change to each must be handled. Review skills check changes against this file; implementation skills warn the user whenever a change is not compliant with it.

## 1. WatermelonDB local schema (`src/database/schema.ts`, `src/database/migrations.ts`, `src/modules/*/database/schema.ts`)

The local database schema is a contract between the app binary already installed on a device and the data already stored on that device. Every user's local WatermelonDB predates any given release.

- **Breaking change**: removing a table or column, changing a column's type, or renaming a table/column without a migration step.
- **Required path**: any schema change bumps `version` in `appSchema({ version: N, ... })` (currently `17`) in `src/database/schema.ts`, and adds a corresponding step (`createTable` / `addColumns` / `unsafeExecuteSql`) to `schemaMigrations` in `src/database/migrations.ts`. The two files change together in the same PR — one without the other is a blocker. A column can be added as optional and backfilled; a column cannot be silently dropped while older app versions are still in the field, since WatermelonDB migrations only run forward.
- **Never**: editing a merged migration step in place. A mistake in an already-released migration gets a new corrective migration, not a rewrite of history.

## 2. Supabase schema and RLS (`supabase/migrations/`)

The Supabase Postgres schema is the sync target every device eventually reconciles against, and its Row Level Security policies are the actual data-isolation boundary between schools/organizations and users.

- **Breaking change**: dropping/renaming a column or table still read by the current or previous app version, narrowing a column's type, or tightening/loosening an RLS policy in a way that changes who can read or write which rows.
- **Required path**: a new, timestamped migration file (`YYYYMMDDHHMMSS_description.sql`, matching the existing convention under `supabase/migrations/`) that is additive where possible (new nullable column, new table) and includes the RLS policy for any new table. Never edit an already-committed migration file.
- **Required path for a genuinely breaking change**: a deprecation window where both the old and new shape are readable, coordinated with the client-side sync/repository code so an app version in the field does not break against the new schema before it's updated.

## 3. Sync edge function and RPCs (`supabase/functions/sync`, `rpc('setup_instructor_organization')`)

These are the only server endpoints the offline-first client calls directly outside of `auth.*`/`storage.*` (per `CLAUDE.md`), so every installed app version depends on their exact request/response shape.

- **Breaking change**: changing the sync function's expected payload shape, removing a field from its response, or changing `setup_instructor_organization`'s parameters or return shape.
- **Required path**: additive changes only (new optional fields) unless every client is known to be updated; version or feature-flag a genuinely incompatible change rather than mutating the existing contract in place.

## 4. Module public APIs (`src/modules/{module}/index.ts` barrel exports)

Each module (`attendance`, `auth`, `core`, `dashboard`, `events`, `grading`, `home`, `inventory`, `orders`, `organization`, `payments`, `school`, `settings`, `students`, `tags`, `techniques`, `threed`) exposes its public surface through its `index.ts` barrel. `core` is imported by every other module and never imports from them.

- **Breaking change**: removing or changing the signature of an exported hook, component, service function, or type that another module imports from a barrel.
- **Required path**: check `grep -r "from \"@/modules/<module>\"" src` (or the module's alias) for consumers before changing a barrel export's shape; update all call sites in the same PR, or keep the old export as a thin wrapper if consumers can't be updated in the same change.

## 5. Translation keys (`src/core/i18n/locales/en.json`, `pl.json`)

- **Breaking change**: removing or renaming a key still referenced by `t("key")` anywhere in the codebase — this renders literally as the raw key string to the user, in either language, silently.
- **Required path**: `grep -r "t(\"<key>\"" src` (or the module's usage) before removing a key; add new keys to both `en.json` and `pl.json` in the same PR, never one without the other.

## 6. Technique/pose data formats (`src/modules/threed`)

Saved techniques, positions, and hand presets are stored as versioned JSON (V1/V2/V3, normalized via `dataCompat.ts`) and persisted both locally and in Supabase (`body_pose_presets` and technique/sequence tables).

- **Breaking change**: changing the meaning of an existing bone-transform field, or a version's shape, in a way that `normalizeTechniqueData()` can no longer read old saved data.
- **Required path**: introduce a new version tag and extend `dataCompat.ts` to normalize the old version(s) forward; never repurpose an existing version number's shape.

## Out of scope

This app has no public HTTP API and no external CLI, so there are no externally-versioned REST/CLI contracts beyond the four above. No online payment processing, real-time collaborative editing, or plan-sharing exists (per `CLAUDE.md`), so there is no contract surface for those areas to protect yet.
