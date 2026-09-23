---
name: add-translations
description: Add translation keys to en.json and pl.json with mandatory duplicate checking
disable-model-invocation: true
argument-hint: "[key descriptions or feature name]"
---

# Add Translations Workflow

Add translations for: **$ARGUMENTS**

## MANDATORY Step 1: Search for Existing Keys

Before adding ANY new key, search both translation files for existing keys that could be reused.

Use Grep to search `src/core/i18n/locales/en.json` for:
- The English text you want to add (case-insensitive)
- Related words (synonyms, partial matches)
- Common prefixes: `status`, `error`, `validation`, `btn`, `label`

**Common keys that already exist:**
- Save/Cancel/Delete/Edit/Close/Back/Confirm/Submit
- Status labels: `statusPaid`, `statusAttending`, `statusAbsent`, `statusActive`, `statusPending`
- Error messages: `errorLoadingFailed`, `errorCreateFailed`, `errorUpdateFailed`
- Validation: `validationRequired`, `validationMinLength`
- Actions: `save`, `cancel`, `delete`, `edit`, `close`, `back`, `confirm`

**If an existing key matches your need, REUSE IT. Do not create a duplicate.**

## Step 2: Prepare New Keys

For keys that truly don't exist:

**Naming conventions:**
- Use `camelCase`: `paymentStatusPaid`, not `payment_status_paid`
- Prefix with feature area: `attendance.recordPresent`, `threedSaveTechnique`
- Use flat structure (no nesting): `eventCreateTitle`, not `event.create.title`
- Be descriptive: `studentApproveSuccess`, not `approved`

## Step 3: Add to BOTH Files

Add keys to both files simultaneously:
- `src/core/i18n/locales/en.json` (English)
- `src/core/i18n/locales/pl.json` (Polish)

**Rules:**
- ALWAYS add to both files at the same time
- Keep alphabetical order within the file
- Polish translations must be actual Polish, not placeholders
- If unsure about Polish translation, add the English text with a `// TODO: translate` comment

## Step 4: Summary

Present:
- Keys reused (existing ones found)
- Keys added (new ones created)
- Both en.json and pl.json updated

## Usage Reminder

In code, use `t()` globally - NO IMPORTS needed:
```typescript
<Text>{t("newKeyName")}</Text>
```

For interpolation:
```typescript
t("welcomeMessage", { name: userName })
// en.json: "welcomeMessage": "Welcome, {{name}}!"
// pl.json: "welcomeMessage": "Witaj, {{name}}!"
```
