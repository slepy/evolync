# Dashboard Module — Specification (as-built + remediation)

> **Status (2026-09-30):** All four applicable fixes are implemented and live on `main` (commit `2c81b92`, landed the same day this spec was authored — the remediation shipped directly alongside the as-built documentation rather than through a separate PR). Verified by direct code inspection: `src/modules/home/` and its `homeSchema` spread in `src/database/schema.ts` no longer exist; `DashboardFAB`/`SchoolDashboard.tsx` carry no `onNewAnnouncement` prop or announcement stubs, and the three orphaned i18n keys (`dashboardAnnouncements`, `dashboardAnnouncementsSubtitle`, `dashboardNewAnnouncement`) are gone from `en.json`/`pl.json`; `useSchoolDashboard.ts` computes `overduePayments` reactively via `PaymentCycleRepository.observeBySchoolId` + `PaymentRecordRepository.observeByCycleIds`, and the badge is wired at `SchoolDashboard.tsx:178`; the hook now goes exclusively through `OrderRepository`/`SchoolJoinRequestRepository`/`PaymentCycleRepository`/`PaymentRecordRepository`, no raw `database.get(...)` calls remain. The fifth item (student payment-status widget) was a decision against building, not an implementation — nothing to verify there. No implementation PR was needed — the remediation had already shipped.

## 📝 TLDR
"Dashboard" in this codebase refers to `src/modules/dashboard/` — a pure UI/aggregation layer with no data ownership of its own, rendering the **school-level** dashboard (`SchoolDashboard`, route `/school/[schoolId]/dashboard`) for an instructor managing one specific school. It owns zero database tables. The **organization-level** dashboard is a separate, already-documented thing owned by `organization`. The **student's** home screen (`/user/dashboard`) is a third, distinct screen that lives directly in the route file, not in this module — it is currently pure navigation tiles with no live stats, payment-status widget, or announcements, despite an earlier UX plan calling for those.

Five changes have already landed during this pass:
1. The dead-scaffolding `home` module (an unused Expo-template leftover with zero tables/components) was deleted, and its no-op `homeSchema` spread was removed from the bootstrap schema.
2. Dead announcement stubs (a commented-out stat tile, a `console.log`-only "New Announcement" FAB handler and its "Navigate to Communication" counterpart, and the now-unused `dashboardAnnouncements`/`dashboardAnnouncementsSubtitle`/`dashboardNewAnnouncement` i18n keys) were removed — the announcements feature has backend tables in Supabase but no WatermelonDB model, repository, or screen anywhere in the app; these stubs falsely implied otherwise.
3. `SchoolDashboard`'s "overdue payments" badge, previously hardcoded to `0`, is now wired to a real count.
4. `useSchoolDashboard` was rewritten to go through `OrderRepository`/`SchoolJoinRequestRepository`/`PaymentCycleRepository`/`PaymentRecordRepository` instead of raw `database.get(...)` calls, fixing the repository-pattern deviation.
5. A student-facing payment-status widget on `/user/dashboard` was explicitly decided **against** — the student dashboard stays pure navigation, by choice, not as a gap.

## 📝 Problem Statement (as found, before this pass)
- `src/modules/home/` was dead scaffolding: an empty `homeSchema` array and an unused types stub, contributing nothing but import noise.
- `SchoolDashboard` had a commented-out "Announcements" tile and a "New Announcement" FAB action whose handler was a bare `console.log`, with no backing feature anywhere in the frontend (only Supabase-side tables + RLS exist) — misleading as "current behavior" since nothing worked.
- `SchoolDashboard`'s payments badge was permanently `0` (`mockData.overduePayments`), regardless of actual overdue payment records.
- `useSchoolDashboard` queried `orders`/`school_join_requests` tables directly via `database.get(...)` + raw `Q.where`, instead of `OrderRepository`/`SchoolJoinRequestRepository`, unlike sibling code in the same component (`SchoolRepository`, `TrainingSessionRepository`).
- The student's `/user/dashboard` screen omits the payment-status widget and announcements the original `.ai/ui-plan.md` UX plan specified for it.
- No client-side role distinction exists between an "instructor employee of a school" and a "student member of a school" — both land on the same `/user/dashboard`. This remains an open, **paused** product question (see below), not resolved by this pass.

## 📝 Proposed Solution — implemented
1. **Deleted `src/modules/home/`** and its `homeSchema` import/spread in `src/database/schema.ts`. No functional change (it contributed zero tables), pure dead-code removal.
2. **Removed the announcement stubs**: the commented-out tile and its dead handlers in `SchoolDashboard.tsx`, the `onNewAnnouncement` prop and its FAB menu entry in `DashboardFAB.tsx`, and the three now-orphaned i18n keys in `en.json`/`pl.json`. Announcements remain a real product need (backend already has tables for it per `.ai/db-plan.md`) — but it should be scoped and built as its own feature/spec when scheduled, not left as a misleading half-visible stub.
3. **Wired the overdue-payments badge to real data**: `useSchoolDashboard` now computes it from `PaymentCycleRepository.observeBySchoolId` (cycles whose `periodEnd` has passed) joined with `PaymentRecordRepository.observeByCycleIds` (counting `pending`-status records among those overdue cycles), fully reactive.
4. **Fixed the repository-pattern deviation**: `useSchoolDashboard` now uses `OrderRepository.observeBySchoolId` (filtering `PLACED` status client-side, since no status-scoped observe method exists yet) and `SchoolJoinRequestRepository.observeCountBySchoolId`, instead of raw collection queries.
5. **Confirmed as intentional, not built**: the student dashboard payment-status widget from the original UX plan is explicitly out of scope — the product decision is to keep `/user/dashboard` as pure navigation for now.

## 📝 Architecture
- `dashboard` remains a pure aggregation/UI layer with no repository of its own — it now correctly reads through other modules' repositories (`orders`, `school` (join requests), `payments`) instead of bypassing them.
- No change to module boundaries otherwise. The organization-level dashboard remains owned by `organization` (out of scope, already documented).

## 📝 Data Model
No schema changes. Removing `home`'s empty schema array is a no-op at the data layer.

## 📝 API Contracts
- `useSchoolDashboard(schoolId)` gains a third field on its returned `dashboardData`: `overduePayments` (previously always implicitly `0` via the component's own mock, not even part of the hook's return shape).
- `DashboardFAB`'s `onNewAnnouncement` prop is removed — no other call site existed besides `SchoolDashboard.tsx`, which was updated in the same pass.
- No other public contract changes.

## 📝 UI/UX
- The "New Announcement" quick action no longer appears in the school dashboard's FAB menu (it never did anything).
- The school dashboard's "Payments" tile now shows a real overdue-payment count instead of always showing no badge.
- No change to the student dashboard's UI.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Before | After |
|---|---|---|
| School has payment cycles with pending records past their period end | Badge always showed no count | Badge shows the real overdue count, reactively |
| School has no payment cycles at all | Badge showed no count (coincidentally correct) | Still shows no count (0 overdue cycles → 0 overdue records) |
| Instructor taps "New Announcement" in the FAB | Logged to console, did nothing | Action removed — no longer offered |
| Student lands on `/user/dashboard` | Pure navigation tiles, no stats | Unchanged — confirmed intentional |

## 📝 Risks & Impact Review
- Deleting `home` is zero-risk: it defined no tables and had zero consumers.
- Removing the announcement stubs is zero-risk: none of the removed code paths were reachable/functional.
- The overdue-payments fix and repository-pattern fix are read-only query changes (no writes), low risk, fully reversible.
- **Open, paused product question** (not addressed by this pass): no client-side role distinction between an instructor employee of a school and a student member. The backend already models `role_id`/`organization_roles`; the frontend router (`app/index.tsx`) only branches on "does this user own an organization," routing every non-owner to `/user/dashboard` regardless of their actual role. Explicitly deferred — work on this is paused pending further design, per direction; do not build against an assumed shape for this until it's picked back up.
- **Announcements remains an unbuilt feature** (backend tables exist, no frontend model/repository/screen) — flagged as a future-spec candidate, not designed here, consistent with how password reset (`auth`) and school-deletion (`organization`/`school`) were carried forward in earlier specs.

## 📋 Phasing
All five changes for this pass have already landed; no further phasing needed for this module today.
- **Fix #1** — Deleted dead `src/modules/home/` scaffolding and its `homeSchema` spread. *Status: ✅ implemented, on `main`.*
- **Fix #2** — Removed dead announcement stubs (tile, FAB handler, orphaned i18n keys). *Status: ✅ implemented, on `main`.*
- **Fix #3** — Wired the overdue-payments badge to real data. *Status: ✅ implemented, on `main`.*
- **Fix #4** — Fixed the repository-pattern deviation in `useSchoolDashboard`. *Status: ✅ implemented, on `main`.*
- **Fix #5** — Student payment-status widget: confirmed as an intentional non-build, not a fix. *Status: ⚪ decided against, not applicable.*

Two items are explicitly deferred, not phased:
- Announcements (future-spec candidate, unscheduled).
- Instructor-employee vs. student role distinction (paused product design question).

## 📋 Implementation Plan (already executed)
1. Deleted `src/modules/home/`; removed its import/spread from `src/database/schema.ts`.
2. Removed the commented-out announcement tile, its handlers, and the `onNewAnnouncement` FAB prop/menu entry from `SchoolDashboard.tsx`/`DashboardFAB.tsx`; removed the three orphaned i18n keys from `en.json`/`pl.json`.
3. Rewrote `useSchoolDashboard` to use `OrderRepository.observeBySchoolId`, `SchoolJoinRequestRepository.observeCountBySchoolId`, `PaymentCycleRepository.observeBySchoolId`, and `PaymentRecordRepository.observeByCycleIds`, computing `pendingOrders`, `pendingJoinRequests`, and the new `overduePayments` reactively.
4. Wired `SchoolDashboard.tsx`'s payments tile badge to `dashboardData.overduePayments`.

Verification: `npm run typecheck` shows no new errors in `src/modules/dashboard/*`, `src/database/schema.ts`, or the i18n files touched — remaining typecheck output is pre-existing, unrelated errors in other modules (confirmed by comparing against the baseline captured in the `grading` module spec's verification pass).
