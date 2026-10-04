# Evolync mockup components

Copy the markup, replace the `{{PLACEHOLDERS}}`, keep everything else. Values come from [SKILL.md](SKILL.md).

Placeholders:

- `{{TINT}}` – module tint hex (text/icon), e.g. `#F9A8D4`
- `{{FILL}}` – tint at 16%: `rgba(r,g,b,0.16)`, e.g. `rgba(249,168,212,0.16)`
- `{{ICON}}` – inline Lucide `<path>` / `<circle>` elements (22px icon)
- `{{TITLE}}`, `{{TEXT}}`, `{{HREF}}`, `{{LABEL}}` – copy

Every example is a child of the board root (`display: flex; flex-direction: column; gap: 22–24px`).

---

## 1. List (`ListCard`)

Reference: 1A "Your schools". Section header with title and an "Add new" pill, then one card holding rows separated by 1px dividers (`margin: 0 16px`). The divider is not rendered after the last row.

- Header button: tint fill + tint text (chrome). Label is always `Add new`.
- Row: 48px icon square (radius 16, 16% fill), title 16/800, optional secondary line 13/500 muted with a 13px icon. No chevron: the whole row is an `<a>` and the right edge stays free for data (amount, status, count).
- For plain rows without a secondary line drop the second `<span>` line and keep `gap: 3px`.
- Screen header: when a list screen is opened from the main screen (dashboard tile or `+`), use the sub-screen header from "Shared pieces" (back chevron + title + Synced pill on the right), as in 7A, 8A, 9A.

```html
<div style="display: flex; flex-direction: column; gap: 14px">
  <div
    style="display: flex; align-items: center; justify-content: space-between"
  >
    <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.2px"
      >{{SECTION_TITLE}}</span
    >
    <button
      style="display: flex; align-items: center; gap: 6px; height: 40px; padding: 0 16px 0 12px; border-radius: 20px; border: 0; background: {{FILL}}; color: {{TINT}}; font-size: 14px; font-weight: 800"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12h14M12 5v14"></path></svg
      >Add new
    </button>
  </div>
  <div
    style="display: flex; flex-direction: column; border-radius: 22px; background: #131823; border: 1px solid #232B3B"
  >
    <!-- row (repeat) -->
    <a
      href="{{HREF}}"
      style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; text-decoration: none; color: inherit"
    >
      <span
        style="width: 48px; height: 48px; border-radius: 16px; background: {{FILL}}; color: {{TINT}}; display: flex; align-items: center; justify-content: center; flex-shrink: 0"
        ><svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {{ICON}}
        </svg></span
      >
      <span
        style="display: flex; flex-direction: column; gap: 3px; flex-grow: 1; min-width: 0"
        ><span style="font-size: 16px; font-weight: 800">{{TITLE}}</span
        ><span
          style="display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 500; color: #A7B1C6"
          ><svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle></svg
          >{{TEXT}}</span
        ></span
      >
    </a>
    <!-- divider between rows -->
    <div style="height: 1px; background: #232B3B; margin: 0 16px"></div>
  </div>
</div>
```

Example (1A): section `Your schools`, `Add new` in Organization amber (`rgba(245,158,11,0.16)` / `#FBBF24`), rows in School red (`rgba(239,68,68,0.16)` / `#FF8F8F`) with a building icon.

---

## 2. Tile (`ModuleTile`)

Reference: 1A "Manage". Section title, then a 2-column grid (`gap: 12px`). One tile per module, one color per tile (rule 3).

- Min height 148px on every dashboard (organization, school, student).
- Icon square 44px, radius 14, 16% fill. Title 17/800, description 13/500 muted, one line of copy.
- Quick action `+` (40px circle, top-right, 16% fill, tint icon) only when the module has a create flow. A tile without a quick action just has no button.
- A tile is a navigation target: wrap in `<a>` when it navigates (the `+` button then sits outside the link or the whole tile stays a `div` with a stretched link, as in 1A).

```html
<div style="display: flex; flex-direction: column; gap: 14px">
  <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.2px"
    >{{SECTION_TITLE}}</span
  >
  <div
    style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px"
  >
    <!-- tile (repeat) -->
    <div
      style="position: relative; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; min-height: 148px; box-sizing: border-box; padding: 16px; border-radius: 22px; background: #131823; border: 1px solid #232B3B"
    >
      <button
        aria-label="{{LABEL}}"
        style="position: absolute; top: 12px; right: 12px; width: 40px; height: 40px; border-radius: 20px; border: 0; background: {{FILL}}; color: {{TINT}}; display: flex; align-items: center; justify-content: center; padding: 0"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14M12 5v14"></path>
        </svg>
      </button>
      <span
        style="width: 44px; height: 44px; border-radius: 14px; background: {{FILL}}; color: {{TINT}}; display: flex; align-items: center; justify-content: center"
        ><svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {{ICON}}
        </svg></span
      >
      <div style="display: flex; flex-direction: column; gap: 3px">
        <span style="font-size: 17px; font-weight: 800">{{TITLE}}</span
        ><span
          style="font-size: 13px; font-weight: 500; line-height: 1.4; color: #A7B1C6"
          >{{TEXT}}</span
        >
      </div>
    </div>
  </div>
</div>
```

Wide variant (settings row, no module color): `display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 22px; background: #131823; border: 1px solid #232B3B`, 44px icon square in neutral tint `rgba(148,163,184,0.16)` / `#CBD5E1`, title 16/800 + 13/500 muted, no chevron. See "School settings" in 2A.

Module icons (Lucide paths, 22px):

| Module                  | Icon elements                                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Students                | `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`                                                   |
| Payments                | `<rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line>`                                                                                                                                       |
| Orders                  | `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path>`                                                                                                       |
| Attendance              | `<rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path><path d="m9 16 2 2 4-4"></path>`                                                                                                             |
| Events                  | `<rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"></path>`                                                                                            |
| Products                | `<path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path>` |
| Grading                 | `<circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>`                                                                                                                                           |
| Trainings               | `<path d="m17 2 4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="m7 22-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path>`                                                                                       |
| Building (school / org) | `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4M10 10h4M10 14h4M10 18h4"></path>`           |

---

## 3. Hero header (`HeroCard`)

Reference: amber in 1A, red in 2A, blue in 4. Same structure, only the gradient and text colors change per context.

- Radius 28, padding 22, two decorative outlined circles top-right (`1.5px` border at 16% of the text color), content `position: relative`.
- All three dashboards use the same layout as 1C: a small "NEXT UP" eyebrow (11/800, `letter-spacing: 0.9px`, `{{FG_SOFT}}`) above the date title, with the calendar shortcut on the right (A), then the nearest event / training rows (C). The school hero (2A) shows the nearest training; the school name is already in the screen header, so there is no eyebrow + name + address block.
- Inside rows: translucent fill (12% dark on amber, 14% white on red/blue), radius 18. Type chip: `EVENT` solid, `TRAINING` outlined.

Variables per context:

|              | `{{GRADIENT}}`                                                   | `{{FG}}`  | `{{FG_SOFT}}`            | `{{RING}}`               | `{{ROW_BG}}`             | `{{ICON_BTN}}`           | `{{CHIP_BG}}` / `{{CHIP_FG}}` |
| ------------ | ---------------------------------------------------------------- | --------- | ------------------------ | ------------------------ | ------------------------ | ------------------------ | ----------------------------- |
| Organization | `linear-gradient(135deg, #FBBF24 0%, #F59E0B 45%, #D97706 100%)` | `#1B1203` | `#3D2A06`                | `rgba(27,18,3,0.16)`     | `rgba(27,18,3,0.12)`     | `rgba(27,18,3,0.14)`     | `#1B1203` / `#FBBF24`         |
| School       | `linear-gradient(135deg, #DC2626 0%, #9F1239 55%, #4C0519 100%)` | `#fff`    | `rgba(255,255,255,0.9)`  | `rgba(255,255,255,0.16)` | `rgba(255,255,255,0.14)` | `rgba(255,255,255,0.18)` | `#fff` / `#9F1239`            |
| Student      | `linear-gradient(135deg, #3F5AE0 0%, #2B3DB0 50%, #17205E 100%)` | `#fff`    | `rgba(255,255,255,0.88)` | `rgba(255,255,255,0.16)` | `rgba(255,255,255,0.14)` | `rgba(255,255,255,0.18)` | `#fff` / `#2B3DB0`            |

```html
<div
  style="position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 18px; padding: 22px; border-radius: 28px; background: {{GRADIENT}}; color: {{FG}}"
>
  <span
    style="position: absolute; right: -50px; top: -60px; width: 190px; height: 190px; border-radius: 95px; border: 1.5px solid {{RING}}"
  ></span>
  <span
    style="position: absolute; right: -10px; top: -20px; width: 110px; height: 110px; border-radius: 55px; border: 1.5px solid {{RING}}"
  ></span>

  <!-- A. title line with calendar shortcut (dashboards) -->
  <div
    style="position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px"
  >
    <div style="display: flex; flex-direction: column; gap: 3px">
      <span
        style="font-size: 11px; font-weight: 800; letter-spacing: 0.9px; color: {{FG_SOFT}}"
        >NEXT UP</span
      ><span style="font-size: 24px; font-weight: 800; letter-spacing: -0.4px"
        >{{TITLE}}</span
      >
    </div>
    <a
      href="{{HREF}}"
      aria-label="Open calendar"
      style="width: 46px; height: 46px; border-radius: 23px; background: {{ICON_BTN}}; color: {{FG}}; display: flex; align-items: center; justify-content: center; flex-shrink: 0"
      ><svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect width="18" height="18" x="3" y="4" rx="2"></rect>
        <path
          d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"
        ></path></svg
    ></a>
  </div>

  <!-- C. optional rows: events / trainings (repeat) -->
  <div
    style="position: relative; display: flex; flex-direction: column; gap: 10px"
  >
    <a
      href="{{HREF}}"
      style="display: flex; align-items: stretch; gap: 12px; padding: 12px 14px; border-radius: 18px; background: {{ROW_BG}}; text-decoration: none; color: {{FG}}"
    >
      <span
        style="display: flex; flex-direction: column; gap: 4px; min-width: 0; flex-grow: 1"
      >
        <!-- EVENT chip (solid) -->
        <span
          style="align-self: flex-start; padding: 2px 8px; border-radius: 8px; background: {{CHIP_BG}}; color: {{CHIP_FG}}; font-size: 10.5px; font-weight: 800; letter-spacing: 0.6px"
          >EVENT</span
        >
        <!-- TRAINING chip (outlined): padding 0 8px; border: 1.5px solid {{FG}}; color: {{FG}}; line-height: 17px; no background -->
        <span style="font-size: 17px; line-height: 1.2; font-weight: 800"
          >{{TITLE}}</span
        >
        <span
          style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: {{FG_SOFT}}"
          ><svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="flex-shrink: 0"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle></svg
          >{{TEXT}}</span
        >
      </span>
      <!-- training only: times column on the right -->
      <span
        style="display: flex; flex-direction: column; justify-content: center; gap: 2px; width: 60px; flex-shrink: 0"
        ><span style="font-size: 17px; font-weight: 800">16:00</span
        ><span style="font-size: 12px; font-weight: 700; color: {{FG_SOFT}}"
          >17:30</span
        ></span
      >
    </a>
  </div>
</div>
```

Page glow for the board root (replace `{{GLOW}}` with the context glow): `background: radial-gradient(120% 40% at 50% -6%, {{GLOW}}, rgba(0,0,0,0) 62%), #0B0E14`.

---

## 4. Radio choice list (`ChoiceList`)

Reference: 10A "Who can see it?", board S section 4. One answer from 2–4 options inside a form. The whole row is the tap target; exactly one row is selected and the form opens with a sensible default already picked. An option that needs more input (Specific school, Selected members) shows its field right below the list once picked (see 10B).

Placeholders: `{{TINT}}` and `{{TINT_RGB}}` = module tint (Events `#FBBF24` / `251,191,36`), `{{FROM}}` / `{{TO}}` / `{{BTN_TEXT}}` = the module's button gradient and text color from the accent table.

```html
<div
  role="radiogroup"
  aria-label="{{GROUP_TITLE}}"
  style="display: flex; flex-direction: column; gap: 10px"
>
  <span style="font-size: 18px; font-weight: 800">{{GROUP_TITLE}}</span>

  <!-- selected row -->
  <button
    role="radio"
    aria-checked="true"
    style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 14px; box-sizing: border-box; border-radius: 16px; border: 1.5px solid {{TINT}}; background: rgba({{TINT_RGB}},0.08); color: #F4F6FA; text-align: left"
  >
    <span
      style="width: 24px; height: 24px; border-radius: 12px; background: linear-gradient(135deg, {{FROM}} 0%, {{TO}} 100%); color: {{BTN_TEXT}}; display: flex; align-items: center; justify-content: center; flex-shrink: 0"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 6 9 17l-5-5"></path>
      </svg>
    </span>
    <span style="display: flex; flex-direction: column; gap: 2px">
      <span style="font-size: 15px; font-weight: 800">{{OPTION_TITLE}}</span>
      <span style="font-size: 12.5px; font-weight: 500; color: #A7B1C6"
        >{{OPTION_HINT}}</span
      >
    </span>
  </button>

  <!-- unselected row (repeat) -->
  <button
    role="radio"
    aria-checked="false"
    style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 14px; box-sizing: border-box; border-radius: 16px; border: 1px solid #2A3345; background: #131823; color: #F4F6FA; text-align: left"
  >
    <span
      style="width: 24px; height: 24px; box-sizing: border-box; border-radius: 12px; border: 1.5px solid #3A4458; flex-shrink: 0"
    ></span>
    <span style="display: flex; flex-direction: column; gap: 2px">
      <span style="font-size: 15px; font-weight: 800">{{OPTION_TITLE}}</span>
      <span style="font-size: 12.5px; font-weight: 500; color: #A7B1C6"
        >{{OPTION_HINT}}</span
      >
    </span>
  </button>
</div>
```

Rules:

- Selected: 1.5px `{{TINT}}` border, `rgba({{TINT_RGB}},0.08)` fill, filled radio from the button gradient with a check (stroke 3) in the button text color.
- Unselected: 1px `#2A3345` border, `#131823` fill, empty radio with a 1.5px `#3A4458` ring.
- Group title is 18/800 (a form section title, not a field label). Option title 15/800, hint 12.5/500 muted, one line.
- Only the accent changes between modules (Events amber, Trainings teal, …). Use it for 2–4 mutually exclusive options; for one on/off value use a switch, for more than 4 use a picker sheet.

---

## 5. Checkbox list (`CheckList`)

Reference: 10B "SELECT MEMBERS", board S section 5. Pick any number of rows (members, schools, groups). An uppercase field label with a "N selected" count chip, then one list card with dividers; each row toggles on tap. Often shown right below a `ChoiceList` once an option like "Selected members" is picked.

Placeholders as in section 4, plus `{{LABEL}}` (uppercase field label), `{{COUNT}}` (number of checked rows), `{{INITIALS}}`, `{{NAME}}`, `{{HINT}}` (school or other one-line context).

```html
<div style="display: flex; flex-direction: column; gap: 10px">
  <div
    style="display: flex; align-items: center; justify-content: space-between"
  >
    <span
      style="font-size: 12px; font-weight: 800; letter-spacing: 0.8px; color: #A7B1C6"
      >{{LABEL}}</span
    >
    <span
      style="padding: 3px 9px; border-radius: 9px; background: rgba({{TINT_RGB}},0.16); color: {{TINT}}; font-size: 12.5px; font-weight: 800; white-space: nowrap"
      >{{COUNT}} selected</span
    >
  </div>
  <div
    role="group"
    aria-label="{{LABEL}}"
    style="display: flex; flex-direction: column; border-radius: 22px; background: #131823; border: 1px solid #232B3B; overflow: hidden"
  >
    <!-- checked row -->
    <button
      role="checkbox"
      aria-checked="true"
      style="display: flex; align-items: center; gap: 12px; width: 100%; min-height: 64px; padding: 10px 16px; border: 0; background: transparent; color: #F4F6FA; text-align: left"
    >
      <span
        style="width: 44px; height: 44px; border-radius: 14px; background: rgba(148,163,184,0.16); color: #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0"
        >{{INITIALS}}</span
      >
      <span
        style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0"
      >
        <span style="font-size: 15px; font-weight: 800">{{NAME}}</span>
        <span style="font-size: 12.5px; font-weight: 500; color: #A7B1C6"
          >{{HINT}}</span
        >
      </span>
      <span
        style="width: 24px; height: 24px; border-radius: 8px; background: linear-gradient(135deg, {{FROM}} 0%, {{TO}} 100%); color: {{BTN_TEXT}}; display: flex; align-items: center; justify-content: center; flex-shrink: 0"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 6 9 17l-5-5"></path>
        </svg>
      </span>
    </button>

    <div style="height: 1px; background: #232B3B; margin: 0 16px"></div>

    <!-- unchecked row (same as above, only the box differs) -->
    <button role="checkbox" aria-checked="false" style="…same as checked row…">
      <!-- avatar + two lines as above -->
      <span
        style="width: 24px; height: 24px; box-sizing: border-box; border-radius: 8px; border: 1.5px solid #3A4458; flex-shrink: 0"
      ></span>
    </button>
  </div>
</div>
```

Rules:

- Checkbox is square (24px, radius 8) and sits on the **right**; the radio in `ChoiceList` is round and on the left. Never mix them up.
- Checked: button gradient fill + check (stroke 3) in the button text color. Unchecked: 1.5px `#3A4458` ring. The row background never changes.
- Count chip uses the module tint at 16% and updates on every toggle.
- Row avatar uses the neutral tint with initials (people belong to no module). Rows 64px high, 1px `#232B3B` dividers inset 16px.
- Only the accent changes between modules. For a long list (more than ~8 rows) add a search field above the card.

## 6. Status summary (`StatusSummary`)

Reference: 10C and 10D "Participants", board S section 6. Counts of people by status in one card, instead of a row of separate counters. Status order and colors are fixed: Paid `#4ADE9F`, Attending `#FBBF24`, Absent `#3A4458` (the same as the status buttons on the participants list).

Placeholders as in section 4, plus `{{TOTAL}}` (all people), `{{COMING}}` (Paid + Attending), `{{PAID}}`, `{{ATTENDING}}`, `{{ABSENT}}`, `{{HREF}}` (the list it opens).

```html
<!-- linked variant (details screen). Static variant: same markup with <div> instead of <a> and without the "Manage" span -->
<a
  href="{{HREF}}"
  aria-label="Manage participants"
  style="display: flex; flex-direction: column; gap: 14px; padding: 16px; border-radius: 22px; background: #131823; border: 1px solid #232B3B; color: #F4F6FA"
>
  <span style="display: flex; align-items: center; gap: 12px">
    <span
      style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0"
    >
      <span style="font-size: 16px; font-weight: 800">{{TOTAL}} members</span>
      <span style="font-size: 13px; font-weight: 500; color: #A7B1C6"
        >{{COMING}} coming</span
      >
    </span>
    <span
      style="display: flex; align-items: center; gap: 2px; color: {{TINT}}; font-size: 14px; font-weight: 800"
      >Manage<svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6"></path></svg
    ></span>
  </span>
  <span style="display: flex; gap: 3px; height: 10px">
    <span
      style="flex: {{PAID}}; border-radius: 5px 2px 2px 5px; background: #4ADE9F"
    ></span>
    <span
      style="flex: {{ATTENDING}}; border-radius: 2px; background: #FBBF24"
    ></span>
    <span
      style="flex: {{ABSENT}}; border-radius: 2px 5px 5px 2px; background: #3A4458"
    ></span>
  </span>
  <span style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap">
    <span style="display: flex; align-items: center; gap: 6px"
      ><span style="color: #4ADE9F; display: flex; flex-shrink: 0"
        ><svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"
          ></path>
          <path
            d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"
          ></path></svg></span
      ><span style="font-size: 13px; font-weight: 800; color: #F4F6FA"
        >{{PAID}}</span
      ><span style="font-size: 13px; font-weight: 600; color: #A7B1C6"
        >Paid</span
      ></span
    >
    <!-- same legend item for Attending: check <path d="M20 6 9 17l-5-5"></path> in #FBBF24, and Absent: x <path d="M18 6 6 18M6 6l12 12"></path> in #CBD5E1 -->
  </span>
</a>
```

Rules:

- Bar: 10px high, 3px gaps, outer ends radius 5, inner radius 2; each segment's `flex` is its count. Drop a segment whose count is 0 (and give the new end segment the outer radius).
- Linked on a details screen: the whole card is the link, "Manage ›" in the module tint, no separate Manage button. Static (`<div>`, no Manage) above the list it summarizes.
- Legend uses the same status icons as the status buttons on the participants list (15px, stroke 2.6): Paid wallet `#4ADE9F`, Attending check `#FBBF24`, Absent x `#CBD5E1` (lighter than the bar segment, for contrast). No dots, no avatars.
- Attendance variant (13B / 13C): same markup and colors in the same order, statuses Present (check, `#4ADE9F`), Excused (file-pen `<path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"></path>`, `#FBBF24`), Absent (x, bar `#3A4458`, icon `#CBD5E1`). Secondary line: `{{PRESENT}} present · {{RATE}}%`. Rows show the member's email as the hint line; no "All present" action.
- Payments variant (14B / 14B1): Paid (wallet, `#4ADE9F`), Pending (clock `<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`, `#FBBF24`), Cancelled (x, bar `#3A4458`, icon `#CBD5E1`). Money is hidden by default: below the legend a 1px divider and a 44px "Amounts" toggle row (32px card icon in the Payments tint, title 14/800, chevron down / up in `#A7B1C6`, `aria-expanded`). Expanded it shows COLLECTED / PENDING / CANCELLED lines: 12/800 uppercase label (78px wide) + one status-colored chip per currency. The billing periods list shows no amounts, only "N of M paid" and an `N/M` chip.

---

## 7. Select (`SelectField` + select sheet)

Reference: board S section 7, 12E (empty), 12E1 (sheet), 12E2 (chosen). One answer from 5+ options or a list that grows (students, schools, products). 2–4 fixed options use the Radio choice list instead; several answers use the Checkbox list.

Placeholders as in section 4, plus `{{LABEL}}` (uppercase field label), `{{PLACEHOLDER}}` ("Choose a student"), `{{VALUE}}`, `{{HINT}}`, `{{INITIALS}}`.

```html
<!-- field: empty -->
<div style="display: flex; flex-direction: column; gap: 8px">
  <span
    style="font-size: 12px; font-weight: 800; letter-spacing: 0.8px; color: #A7B1C6"
    >{{LABEL}}</span
  >
  <button
    aria-haspopup="dialog"
    aria-label="{{LABEL}}, not chosen"
    style="display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 8px 12px 8px 16px; box-sizing: border-box; border-radius: 16px; background: #131823; border: 1px solid #2A3345; color: #F4F6FA; text-align: left"
  >
    <span
      style="flex-grow: 1; font-size: 15px; font-weight: 600; color: #7D889F"
      >{{PLACEHOLDER}}</span
    >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A7B1C6"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m6 9 6 6 6-6"></path>
    </svg>
  </button>
  <!-- optional hint: 12.5/500 #7D889F -->
</div>

<!-- field: chosen (padding-left 10px, optional 36px avatar or module icon, radius 12) -->
<button
  aria-haspopup="dialog"
  aria-label="{{LABEL}}, {{VALUE}}"
  style="…same as empty…; padding-left: 10px"
>
  <span
    style="width: 36px; height: 36px; border-radius: 12px; background: rgba(148,163,184,0.16); color: #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0"
    >{{INITIALS}}</span
  >
  <span
    style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0"
    ><span style="font-size: 15px; font-weight: 800">{{VALUE}}</span
    ><span style="font-size: 12.5px; font-weight: 500; color: #A7B1C6"
      >{{HINT}}</span
    ></span
  >
  <!-- chevron-down as above -->
</button>

<!-- sheet row (in a list card inside the standard sheet). Selected row: -->
<button
  role="option"
  aria-selected="true"
  style="display: flex; align-items: center; gap: 12px; width: 100%; box-sizing: border-box; min-height: 64px; padding: 10px 16px; border: 0; background: rgba({{TINT_RGB}},0.08); color: #F4F6FA"
>
  <!-- 44px avatar + two lines -->
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="{{TINT}}"
    stroke-width="2.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M20 6 9 17l-5-5"></path>
  </svg>
</button>
<!-- unselected row: background transparent, no check -->
```

Rules:

- Field: label above, button 56px / radius 16 / `#131823` / 1px `#2A3345`, chevron-down 20px on the right (a control, not a row chevron). Open state: 1.5px border in the module tint, chevron up in the tint.
- Sheet: standard sheet (`#1A2130`, radius 28 on top, handle), title = field label in sentence case, 44px close button, 48px search when there are more than 8 options, rows 64px in one list card with 1px dividers.
- Selected row: 8% tint fill + plain check icon in the module tint on the right. No round radio, no square box.
- Tap a row = choose and close the sheet; no Save button, no separate "Change" button (tap the field again).
- Rows of people use the neutral avatar with initials; the hint line carries the context that tells two similar rows apart (school, email).

---

## Shared pieces

**Context pill / Home pill** (bottom nav, active item): `height: 50px; padding: 0 18px; border-radius: 25px; background: <context gradient (2 stops)>; color: <hero text>; font-size: 13px; font-weight: 800` with a 20px home icon.

**Bottom nav**: `position: absolute; left: 16px; right: 16px; bottom: 20px; height: 68px; border-radius: 34px; background: #1A2130; border: 1px solid #2A3345; box-shadow: 0 12px 32px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: space-around; padding: 0 8px`. Inactive items: 22px icon + 11/700 label in `#A7B1C6`; alert badge dot `#FF5A5A` with a 2px `#1A2130` ring.

**Synced pill**: `height: 30px; padding: 0 12px; border-radius: 15px; background: rgba(52,211,153,0.12); color: #4ADE9F; font-size: 12px; font-weight: 700` with a 7px dot.

**Primary button** (Create / Save): full width, `height: 52px; border-radius: 26px; border: 0; background: linear-gradient(135deg, {{FROM}}, {{TO}}); color: {{BTN_TEXT}}; font-size: 15px; font-weight: 800` using the module row of the accent table. One word label.

**Sub-screen header** (list / form screens opened from the main screen, e.g. 7A Tags, 8A Grading, 9A Products): a row `display: flex; align-items: center; gap: 12px; padding: 56px 20px 0` with, in order:

1. Back button: `44×44px; border-radius: 22px; border: 1px solid #2A3345; background: #131823; color: #F4F6FA`, always the chevron icon `<path d="m15 18-6-6 6-6"></path>` (22px). Never the module icon, so the user can tell it is "back".
2. Screen title: `22px / 800; letter-spacing: -0.3px`.
3. Synced pill, pushed right with `margin-left: auto` (same pill as 1A, markup above).

Usually this header is used when we enter from the main screen (1A / 2A / 4), so the first row of every such screen is the back button, the title and the Synced pill.
