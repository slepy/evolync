# Confirm before deleting with the trash button

## Goal

Every trash button (`TrashButton`) asks for confirmation (`confirmDelete`) before removing anything.

## Audit

All `TrashButton` call sites were checked. Already confirmed: attendance session, rank, tag, event type, event (delete sheet), training (scoped sheet), order, product, product variant, sequence, sequence step, technique / position, note, all notifications.

Missing a confirmation:

- `StudentDashboard` — rejected join request is soft-deleted right away.
- `NoteRowCard` (via `NoteForm`) — a note row disappears with its text.
- `OrderProductsSection` — a product line is dropped from the order cart.
- `PhotoField` (core) — the photo is cleared from the form.

## Scope

Wrap those four handlers in `confirmDelete(t("delete"), <message>, …)`; add the four messages to `en.json`, `pl.json`, `hu.json`.

## Non-goals

- Swipe-to-delete on notifications (the swipe already reveals a Delete action — two steps).
- `X` remove buttons (series rule card, tag chips) — not trash buttons.
- Changing `TrashButton` itself.

## Risks

- Low: UI-only, behaviour after confirming is unchanged.

## Progress

PR: #74

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Add missing confirmations

- [x] 1.1 Confirm rejected join request removal — 412bc03
- [x] 1.2 Confirm note row, order product and photo removal — daa72f7
