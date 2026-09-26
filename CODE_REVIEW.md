# Code review checklist

This is the repo-specific review checklist `om-code-review` (and therefore `om-auto-review-pr`) applies automatically. It complements, not replaces, an optional `reviewChecklist` path in `.ai/agentic.config.json`.

## Review priorities, in order

1. **Correctness** — does the change do what the ticket/PR says, including edge cases (empty, loading, error, no-permission states for anything user-facing)?
2. **Offline-first contract** — see below; this is the single most repo-specific correctness class here.
3. **Security** — auth boundaries, school/organization data scoping, payment data.
4. **Contracts** — anything covered by `BACKWARD_COMPATIBILITY.md` (WatermelonDB schema/migrations, Supabase schema/RPCs/edge functions, module public APIs).
5. Everything else: readability, test coverage, reuse.

## Repo-specific checks

### Offline-first data flow (`src/database/`, `src/modules/*/repositories`, `src/modules/*/services`)

- All reads/writes go through local WatermelonDB — flag any direct Supabase read/write in a service or component. The only allowed direct Supabase calls are `auth.*`, `storage.*`, `rpc('setup_instructor_organization')`, and the `sync` edge function.
- Every repository mutation runs inside `database.write(...)`.
- Every new record uses `uuidv4()` for its id (`import { v4 as uuidv4 } from "uuid"`), never a Supabase-generated id created client-side.
- Every query filters soft-deleted rows: `Q.where("deleted_at", null)`.
- Every repository that backs a UI list exposes an `observe*` method (`.observe()` / `.query(...).observe()`), and components consume it reactively instead of one-shot fetches.
- Services, not repositories, hold business logic; a mutation that changes remote state fires `sync().catch(console.error)` afterwards (fire-and-forget — flag a service that `await`s sync and blocks the UI on it, and flag one that swallows the mutation's own errors instead of the sync's).

### Supabase import

- `@supabase/supabase-js` is imported via `require()`, never `import`, due to Metro bundler limitations (see `CLAUDE.md`). Flag any `import { createClient } from '@supabase/supabase-js'` or similar static import.
- Prefer the shared `import { supabase } from '@/config/supabase'` instance over constructing a new client.

### Translations (i18n)

- No hardcoded user-facing strings — everything goes through the global `t("key")` (no import needed).
- A new key is added to **both** `src/core/i18n/locales/en.json` and `pl.json` in the same PR.
- Before adding a key, the PR should show evidence an existing key was searched for (avoid duplicate keys carrying the same meaning).

### Module boundaries (`src/modules/{module}/`)

- No circular dependencies between modules; `core` never imports from another module.
- Cross-module imports go through a module's `index.ts` barrel export, not deep paths into another module's internals.
- New module code follows the standard subfolder shape: `components/`, `hooks/`, `repositories/`, `services/`, `types/`, `validation/`, `database/`.

### WatermelonDB schema and migrations (`src/database/schema.ts`, `src/database/migrations.ts`, `src/modules/*/database/`)

- A schema change (new table/column) bumps `appSchema({ version: N, ... })` in `src/database/schema.ts` and adds a matching step to `schemaMigrations` in `src/database/migrations.ts` — a PR that edits one without the other is a blocker.
- New tables include the standard soft-delete/timestamp columns (`created_at`, `updated_at`, `deleted_at`) unless there's a stated reason not to.
- A migration step never mutates data destructively without an explicit note on the down-path/rollback risk.

### Supabase migrations (`supabase/migrations/`, `supabase/functions/`)

- New SQL migrations are added as new timestamped files (`YYYYMMDDHHMMSS_description.sql`), never edited after being merged.
- RLS policies are reviewed for every new/changed table: does the policy correctly scope rows to the owning school/organization/user?
- Edge function changes (`supabase/functions/`) are reviewed for the same offline-first contract: the client should not depend on synchronous edge-function calls for core flows.

### Validation (Zod)

- Forms and DTOs entering a repository/service boundary are validated with a Zod schema in the module's `validation/` folder (see e.g. `src/modules/auth/validation/registerSchema.ts`) rather than validated ad hoc inline.

### 3D module (`src/modules/threed/`)

- Follow `threed-guide` conventions for bone transforms, technique/sequence data formats (V1/V2/V3 compatibility via `dataCompat.ts`), and the 60 FPS / mid-range-device performance target during manipulation.

## Severity guidance

- **Blocker** — breaks the offline-first contract (direct Supabase read/write bypassing WatermelonDB), a schema change without a matching migration, a hardcoded user-facing string, a `risk-high` area (auth, payments, org/school membership, schema migrations) without the evidence `SDLC.md` requires.
- **Major** — missing `observe*` reactive method on a new list-backing repository, missing soft-delete filter, i18n key added to only one locale file, module boundary violation (deep import bypassing a barrel).
- **Minor** — style/readability, missed opportunity for reuse, a service awaiting `sync()` when fire-and-forget was intended but the UI isn't actually blocked in a way a user would notice.

## Validation gate

Every PR passes `npm run typecheck` (the currently configured gate — see `.ai/agentic.config.json` and `SDLC.md`) before review sign-off. This repository has no configured lint or automated test command yet; a reviewer should not assume test coverage exists beyond what the PR itself demonstrates manually.
