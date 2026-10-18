---
name: design-mockups
description: Styleguide and rules for building Evolync design mockups (Claude Design canvas, `.dc.html` boards). Use when creating or editing a mockup screen, picking module accent colors, button labels, or reusing the list, tile and hero header components.
---

# Evolync design mockups

Source of truth for the redesign canvas "Evolync Redesign Mockups" (boards 1A, 2A, 4, 0). Follow it for every new screen so boards stay consistent. Ready-to-paste markup for the components is in [components.md](components.md).

## Before you design: read the canvas

Canvas: https://claude.ai/artifact/5GM35Pr9XwTRWQAez7pCWx ("Evolync Redesign Mockups", Design type). Before building or changing any screen, read these two boards with the Artifact tool (`action: "read"`, `url` above, `paths`) so you work from the live version, not only from this file:

| Board | Path | What it holds |
| --- | --- | --- |
| **0 · Color and label rules** | `project/ColorRules.dc.html` | Module accent table (tint, fill, button gradient, button text), the color rules and the one-word button labels |
| **S · Styleguide (list, tile, header box, choice, checklist, status summary)** | `project/Styleguide.dc.html` | The reusable components: header box (amber / red / blue), list card, module tile (+ wide settings row), radio choice list, checkbox list, status summary, select, view switch, status filter, status badge, photo field |

Also read `project/canvas.json` when you add a board (layout, `order`, free position).

Order of authority: the canvas boards 0 and S are the source of truth. If they differ from this skill or `components.md`, follow the canvas and update the skill in the same task. Then read the existing board closest to your screen (1A / 2A / 4 for dashboards, 7A / 8A / 9A for lists, 7B / 8B for bottom sheets, 9B for forms) and reuse its structure.

Reading a board: `.dc.html` is one file of inline-styled markup; copy the component blocks as they are and swap only text, icon and accent values.

## Board basics

- Phone board: `390` wide, height = content (`h` in `canvas.json`), `box-sizing: border-box`, `overflow: hidden`.
- Dark theme only. Font: Manrope 500/600/700/800 via Google Fonts `<link>` in `<helmet>`.
- Page padding: `56px 20px 0` (top clears the status bar area), vertical `gap: 22–24px`.
- Floating bottom nav: `position: absolute; left/right: 16px; bottom: 20px`. Leave ~110px free at the bottom of the board. Five items: Home, Notebook, Alerts, Profile, Settings (gear, opens 17A). Inactive items are 56px wide; the active one is the context-colored pill. Account settings (push, language, appearance) live only in the Settings tab (17A / 17B, its own section on the canvas, not part of Notifications), never as a row on a dashboard. There are no organization settings.
- Icons: inline Lucide-style stroke SVG (`fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"`), stroke 2 (2.2 in nav/header, 2.8 for `+`). Never emoji.
- Touch targets at least 44px (quick actions are 40px and sit inside a larger tile).
- Real `<a>` / `<button>`, `aria-label` on icon-only buttons.
- No lorem ipsum. Use plausible Evolync data (Warszawa Mokotów, Dragon Gate Academy, ul. Puławska 18).

## Neutral tokens

| Token | Value | Use |
| --- | --- | --- |
| page | `#0B0E14` | board background (plus context glow) |
| card | `#131823` | tiles, lists, rows |
| card border | `#232B3B` | 1px border, list dividers |
| raised | `#1A2130` / `#2A3345` | bottom nav, switcher button (fill / border) |
| text | `#F4F6FA` | primary text |
| muted | `#A7B1C6` | secondary text |
| radius | 28 hero · 22 card/tile/list · 16 row icon · 14 tile icon · 20 pill button | |
| neutral tint | `rgba(148,163,184,0.16)` / `#CBD5E1` | settings rows (no module) |
| synced | `rgba(52,211,153,0.12)` / `#4ADE9F` | "Synced" pill |
| alert dot | `#FF5A5A` | notification badge |

Type: board title 28/800 · section title 20/800 (`letter-spacing: -0.2px`) · tile/row title 16–17/800 · secondary 13/500 · eyebrow 10.5–12/800 uppercase with `letter-spacing` 0.6–1px.

## Context colors (hero header, Home pill, page glow)

Organization = amber, School = red, Student = blue. They tint **only** the hero header box, the active Home pill in the nav, the context switcher and the radial glow at the top of the page. Never used for module tiles.

| Context | Hero gradient (135deg) | Hero text | Glow `rgba` (top of page) | Eyebrow / label color |
| --- | --- | --- | --- | --- |
| Organization (amber) | `#FBBF24` 0% → `#F59E0B` 45% → `#D97706` 100% | dark `#1B1203` | `rgba(245,158,11,0.22)` | `#FBBF24` |
| School (red) | `#DC2626` 0% → `#9F1239` 55% → `#4C0519` 100% | white | `rgba(239,68,68,0.22)` | `#FF8F8F` |
| Student (blue) | `#3F5AE0` 0% → `#2B3DB0` 50% → `#17205E` 100% | white | `rgba(79,107,240,0.26)` | `#9DB0FF` |

Page background: `radial-gradient(120% 40% at 50% -6%, <glow>, rgba(0,0,0,0) 62%), #0B0E14` (use `120% 50% at 50% -8%` for the blue board).

## Module accents

The accent of a module is the color of its tile on the dashboards (organization, school, student). It is the same in every context.

| Module | Tint (text/icon) | Primary button gradient | Button text |
| --- | --- | --- | --- |
| Students | `#FB923C` | `#FB923C` → `#C2410C` | dark `#1B0A02` |
| Attendance | `#8DB8FF` | `#2563EB` → `#1E40AF` | white |
| Payments | `#4ADE9F` | `#059669` → `#065F46` | white |
| Grading | `#CBD5E1` (gray) | `#64748B` → `#334155` | white |
| Orders | `#C4AEFF` | `#7C3AED` → `#5B21B6` | white |
| Products | `#F9A8D4` | `#DB2777` → `#9D174D` | white |
| Events | `#F5B53D` | `#FBBF24` → `#D97706` | dark `#1B1203` |
| Trainings | `#5EEAD4` | `#2DD4BF` → `#0F766E` | dark `#04201D` |
| Tags | `#FB7185` (rose; "Add new" text `#FDA4AF`) | `#FB7185` → `#E11D48` | white |
| Notebook (technique notes) | `#67E8F9` (cyan, fill `rgba(34,211,238,0.16)`) | `#22D3EE` → `#0891B2` | dark `#03222A` |
| 3D (sequences, techniques, poses; D1–D9) | `#BEF264` (lime, fill `rgba(190,242,100,0.16)`) | `#A3E635` → `#65A30D` | dark `#142003` |

Tiles and quick actions use the tint at 16% opacity as the fill (`rgba(r,g,b,0.16)`).

### Rules

1. One module, one color, in every context.
2. The accent runs through the module: tile icon, the + quick action, the "Add new" button in the list header, the primary Create / Save button, the focused field border, switches.
3. No two tiles on one screen share a color. A new module picks an unused hue.
4. Tinted for chrome, solid gradient for actions.
5. Text on buttons has at least 4.5 : 1 contrast. Light accents (orange, amber, teal) use dark text.
6. Context colors tint the hero card, the Home pill and the page glow. They are never used for module tiles.

Lists of things that belong to no module (e.g. "Your schools") use the context color of the current board for the "Add new" button and the context color of the *target* context for row icons (schools are red because tapping opens the School context).

### Button labels

One word: Create, Save, Add new, Delete. Destructive row actions (remove a variant) are an icon-only trash button.

Every trash button is red, the same as the header delete in 11D: `44×44px; border-radius: 22px; border: 1px solid rgba(255,90,90,0.4); background: rgba(255,90,90,0.10); color: #FF8A8A`, 18–20px trash icon. Never neutral gray. The screen title already names the object, so never "Create product" or "Save changes".

### No chevrons in rows

List rows never end with a `>` chevron. The whole row is the link (`<a>`), and the right edge is free for data (amounts, status, counts). This holds for every list: schools, tags, ranks, products, orders, calendar items, settings rows, sheet option lists. Chevrons stay only where they are a control, not a row decoration: the back button, the month arrows in the calendar, the "Manage ›" link inside a card, and a form field that opens a picker (e.g. the COLOR field in 8B / 8C).

### Sub-screen header

A screen opened from the main screen (list, form, sheet parent) starts with the sub-screen header: chevron back button (never the module icon), title, and the Synced pill on the right (see "Shared pieces" in [components.md](components.md)). This is the usual header whenever we enter from the main screen.

### Known exceptions to fix

- Grading is gray (tile on 1A / 1C, boards 8A–8D). Rank icons keep their belt colors (data, not accent). Gray is also the neutral tint of settings rows and count chips, so keep those on a different screen area from the Grading tile or accept the similarity.
- Tags (7A–7C) are rose, taken from the existing boards. Tags have no tile; rose is close to Products pink, so never put both in one grid. The light end of the gradient (`#FB7185`) is below 4.5 : 1 with white text; the deep end (`#E11D48`) passes.

## Components

Picking the right selection control: 2–4 fixed options → Radio choice list (round radio, left). Any number of answers → Checkbox list (square box, right). One answer from 5+ options or a growing list → Select (field + sheet, plain check icon on the selected row). Never mix their markers.

Full markup with placeholders is in [components.md](components.md). Rendered examples live on board S in the canvas.

| Component | Reference board | Use for |
| --- | --- | --- |
| **List** (`ListCard`) | 1A "Your schools" | A collection of rows: section header + "Add new" button + one card with dividers, no chevrons |
| **Tile** (`ModuleTile`) | 1A "Manage" | Module entry on a dashboard: 2-column grid, tint icon, title, one-line description, optional `+` quick action |
| **Hero header** (`HeroCard`) | 1A amber, 2A red, 4 blue | Top card of a context dashboard: date/title + optional event/training rows |
| **Radio choice** (`ChoiceList`) | 10A "Who can see it?" | One answer from 2–4 options in a form: group title, 56px rows with radio, title and hint; selected row in the module accent |
| **Checkbox list** (`CheckList`) | 10B "SELECT MEMBERS" | Any number of rows: label + "N selected" chip, one list card, square checkbox on the right in the module accent |
| **Select** (`SelectField` + sheet) | 12E / 12E1 / 12E2 "Student" | One answer from 5+ options or a list that grows (students, schools, products): a field that opens a sheet with search; tap a row to choose and close |
| **Status summary** (`StatusSummary`) | 10C / 10D "Participants" | Counts of people by status (Paid / Attending / Absent): header, segmented bar, legend. Linked with "Manage ›" on a details screen, static on the list it summarizes |
| **View switch** (`ViewSwitch`) | S section 8, 12A "Orders / Shopping list" | Two views of one screen: card track, two 40px tabs with icon + label, active tab in the module accent at 16% |
| **Status filter** (`StatusFilter`) | S section 9, 12A status chips | Chips above a list, one per status: selected = status fill, border, label and filled count circle; unselected = page fill, muted label, status dot left, neutral count. Variant without counts |
| **Status badge** (`StatusBadge`) | S section 10, 12A rows | Read-only mini badge on the right of a list row, under the amount: 6px dot + name in the status color on its fill |
| **Photo field** (`PhotoField`) | S section 11, 9B / 9C products, P1 / P2 profile | Every photo of a form, the profile photo included: 96px square (radius 24) at the top. Empty = dashed square + "Add photo" link in the accent; with a photo = image + "Change photo" pill + red trash. Camera / Gallery from the system sheet. Module accent, `light` on profile / account screens. Never a round avatar with a camera badge or a custom photo sheet |

When a brief says "list", "tile", "header box" or "choice" / "radio" or "checklist" / "checkbox" or "select" / "dropdown" / "picker" or "status summary" / "counters" or "switch" / "status filter" / "status badge" or "photo" / "avatar upload", use these components unchanged and only swap the placeholders. Do not invent new radii, paddings or colors.

## Creating a board

0. Read boards 0 and S from the canvas (see "Before you design").
1. Pick the context (Organization / School / Student) → hero gradient, glow, Home pill.
2. Pick the module accent for every tile / list / button from the module table. Check rule 3 (no repeated colors on one screen).
3. Paste components from [components.md](components.md), replace placeholders.
4. Write the `.dc.html` under `project/`, add a `boards` entry (390 × content height, title like `9A · Products list`) and an `order` slot in `project/canvas.json`.
5. `.dc.html` rules: keep `<script src="./support.js"></script>` exactly; close every element; inline `style` only; no `<iframe>`; include the `data-dc-script` block with `$preview` equal to the board size.
6. Read the canvas first and publish with the artifact `url`, only changed files (see the Artifact tool's "Design" type instructions).
