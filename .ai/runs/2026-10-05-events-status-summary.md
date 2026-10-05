# Events — Status summary card on 10C / 10D

Engine: om-auto-create-pr (steps: 4, --loop: no)

## Goal

Replace the separate participant counters on event details (10C) and participants (10D) with the shared Status summary component from styleguide board S section 6 (header, segmented bar, legend), as on the current boards "10C · Event details (progress bar, Manage in the card)" and 10D.

## Brief (operator, translated)

> 10C · Event details (progress bar, Manage in the card): participants do not look like the design; this should be a new core component. Check the style guide, 6 · STATUS SUMMARY: counts of people by status in one card: header, a segmented bar and a legend. Replaces a row of separate counters.

## Design source

- `design-mockups` skill `components.md` §6 (`StatusSummary`): card 16px padding, radius 22, header (title 16/800 "{{TOTAL}} members", secondary "{{COMING}} coming", "Manage ›" in the module tint when linked), bar 10px with 3px gaps (outer radius 5, inner 2, zero segments dropped), legend (15px icon stroke 2.6, count 13/800, label 13/600). Fixed order and colors: Paid wallet `#4ADE9F`, Attending check `#FBBF24`, Absent x (bar `#3A4458`, icon `#CBD5E1`).
- Boards 10C (linked card, no separate Manage button) and 10D (static card; status buttons are 44px icon-only circles with the same icons).

## Scope

- New `src/core/components/StatusSummary` (presentational, generic segments) + pure bar logic with tests.
- Events: `EventDetailsScreen` uses the linked card, `EventParticipantsScreen` the static card and icon status buttons; `ParticipantCountsCard` removed; status icons follow the styleguide.
- Translations (en / pl), CLAUDE.md component list.

## Non-goals

- Attendance (13B/13C) and payments (14B) variants — the component supports them, screens are not touched.
- Data layer changes.

## Risks

- Not checked on a device (needs an owner account).

## Progress

PR: #26

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Status summary component

- [x] 1.1 StatusSummary core component with bar tests — 80789ae

### Phase 2: Events screens

- [x] 2.1 Linked status summary on event details (10C) — dbb3e80
- [x] 2.2 Static summary and icon status buttons on participants (10D) — d10bfa4
- [x] 2.3 Docs and full validation gate — 4b37777

- Gate (2026-10-05): `npm run typecheck` ✅, `npm run check:theme` ✅, `npm test` ✅ 211 pass.
