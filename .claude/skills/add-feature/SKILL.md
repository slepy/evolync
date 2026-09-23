---
name: add-feature
description: Structured workflow for implementing a complete feature end-to-end
disable-model-invocation: true
argument-hint: "<feature description>"
---

# Add Feature Workflow

Implement the feature: **$ARGUMENTS**

Follow this workflow strictly. Do NOT skip steps. Use TodoWrite to track progress.

## Phase 1: Understand

1. Read the relevant PRD/plan files in `.ai/` directory
2. Identify which existing module this feature belongs to (or if a new module is needed)
3. List ALL files that will need to be created or modified
4. If unclear, ask the user for clarification before proceeding

## Phase 2: Plan the Data Layer

1. Determine if new database models are needed
2. If yes, follow the `new-model` skill for EACH new model:
   - Module schema (`src/modules/{module}/database/schema.ts`)
   - Model class (`src/database/models/{Model}.ts`)
   - Register in `src/database/models/index.ts`, `src/database/index.ts`, `src/database/schema.ts`
   - Migration (`src/database/migrations.ts`)
   - Repository (`src/modules/{module}/repositories/`)
   - Supabase migration (`supabase/migrations/`)
3. Create types/DTOs (`src/modules/{module}/types/`)
4. Create validation schemas if forms are needed (`src/modules/{module}/validation/`)

## Phase 3: Implement Business Logic

1. Create or update service (`src/modules/{module}/services/`)
2. Services should:
   - Validate input
   - Use repositories for data access
   - Call `sync().catch(console.error)` after mutations
   - Throw errors with translation keys

## Phase 4: Build the UI

1. Create hooks with reactive data (`src/modules/{module}/hooks/`)
   - Subscribe to `.observe()` from repositories
   - Return `{ data, isLoading, error, ...handlers }`
2. Create components (`src/modules/{module}/components/`)
   - Use `BaseCard` for cards
   - Use `t()` for ALL text (no imports needed)
   - Use `LoadingScreen` for loading states
3. Create route/screen (`app/{route}/`)
   - Thin wrapper passing route params to components

## Phase 5: Translations

1. Search existing keys in `en.json` and `pl.json` (use Grep to find duplicates!)
2. Add ONLY new keys to BOTH files simultaneously
3. Verify all `t()` calls in new code have matching keys

## Phase 6: Integration & Exports

1. Update barrel exports:
   - `src/modules/{module}/components/index.ts`
   - `src/modules/{module}/hooks/index.ts`
   - `src/modules/{module}/repositories/index.ts`
   - `src/modules/{module}/services/index.ts`
   - `src/modules/{module}/types/index.ts`
   - `src/modules/{module}/index.ts`
2. Verify no circular dependencies between modules

## Phase 7: Verify

1. Run `npm run typecheck` — fix any errors introduced by this feature (pre-existing errors in unrelated files, and Deno edge function `.ts` extension/`Deno` errors under `supabase/functions/`, are expected and can be ignored)
2. Re-read the new/modified files to confirm correctness

## Phase 8: Summary

Present a summary of ALL changes:
- Files created
- Files modified
- New translation keys added
- Database changes (schema version, migration)
- Any remaining TODO items

## Critical Reminders

- **Offline-first**: All reads from WatermelonDB, never Supabase directly
- **Supabase imports**: Use `require()` not `import` for `@supabase/supabase-js`
- **Soft deletes**: Always `Q.where("deleted_at", null)` in queries
- **UUIDs**: Generate in repositories with `v4 as uuidv4`
- **Translations**: Search for existing keys before adding new ones
- **BaseCard**: Use for all interactive cards
- **SubmitComponent**: Use for ALL submit/save buttons — never a raw `Button` at the bottom of forms/sheets. Place outside `ScrollView`, at the bottom of the screen/sheet frame. On **edit screens** wrap in `{isDirty && ...}` using `useDirtyFlag` from `@/modules/core/hooks` (see `dirty-flag` skill). On **create screens** always visible.
- **Sync**: Fire-and-forget in services: `sync().catch(console.error)`

## Phase 2b: Update Edge Function Sync

When adding a new table, **always** update the Supabase Edge Function sync files:

### `supabase/functions/sync/sync-organization.ts`
1. Add table name to `tablesToSync` array (PUSH phase) — respects FK order
2. Add `pullChanges.{table_name} = await fetchTableChanges(...)` in PULL phase
3. Add empty fallback `pullChanges.{table_name} = { created: [], updated: [], deleted: [] }` in the `else` branch

### `supabase/functions/sync/sync-user.ts`
1. Add table name to `tablesToSync` array if users should push their own rows
2. Add security filter in `filterUserData` switch (e.g. `r.user_id === userId`)
3. Add `pullChanges.{table_name} = await fetchTableChanges(...)` in PULL phase

### Notes
- `sync-organization.ts` handles **organization owners** (instructors) — full org data
- `sync-user.ts` handles **regular users** (students) — their own data only
- Utility functions `convertToSupabaseRecord` / `convertToWatermelonRecord` in `utils.ts` handle timestamps automatically — no changes needed for standard timestamp fields
- Deno Edge Functions use `.ts` imports and may show IDE errors like "allowImportingTsExtensions" — these are **expected** and can be ignored (Deno supports them natively)
