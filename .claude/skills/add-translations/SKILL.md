---
name: add-translations
description: Add translation keys to en.json, pl.json and hu.json with mandatory duplicate checking
disable-model-invocation: true
argument-hint: "[key descriptions or feature name]"
---

# Add Translations Workflow

Add translations for: **$ARGUMENTS**

## MANDATORY Step 1: Search for Existing Keys

Before adding ANY new key, search the translation files for existing keys that could be reused.

Use Grep to search `src/core/i18n/locales/en.json` for:
- The English text you want to add (case-insensitive)
- Related words (synonyms, partial matches)
- Common prefixes: `status`, `error`, `validation`, `btn`, `label`

**Common keys that already exist:**
- Actions: `save`, `cancel`, `delete`, `edit`, `create`, `add`, `addNew`, `close`, `back`, `confirm`, `continue`, `restore`, `archive`, `manage`, `copy`, `search`, `change`
- Shared labels: `all`, `start`, `end`, `from`, `student`, `organization`, `orders`, `products`, `settings`, `profile`, `actions`, `status`, `yesterday`, `language`, `locationOptional`, `phoneOptional`
- Status labels: `statusPaid`, `statusAttending`, `statusAbsent`, `statusActive`, `statusPending`, `statusCancelled`, `statusChangeNow`
- Error messages: `errorLoadingFailed`, `errorCreateFailed`, `errorUpdateFailed`
- Validation: `required`, `nameRequired`, `titleRequired`, `chooseType`, `currencyRequired`, `notesTooLong`, `invalidDate`

**If an existing key matches your need, REUSE IT. Do not create a duplicate.** One key per shared word: never a module copy like `ordersSave` or `trainingsActions`. A module prefix only when the text belongs to that screen, or when another language needs a different word (`trainingsCancel`: "Odwołaj", not "Anuluj").

## Step 2: Prepare New Keys

For keys that truly don't exist:

**Naming conventions:**
- Use `camelCase`: `paymentStatusPaid`, not `payment_status_paid`
- Prefix with feature area: `attendance.recordPresent`, `threedSaveTechnique`
- Use flat structure (no nesting): `eventCreateTitle`, not `event.create.title`
- Be descriptive: `studentApproveSuccess`, not `approved`

## Step 3: Add to ALL Locale Files

Add keys to every locale file simultaneously:
- `src/core/i18n/locales/en.json` (English)
- `src/core/i18n/locales/pl.json` (Polish: `_one` / `_few` / `_many` / `_other` plurals)
- `src/core/i18n/locales/hu.json` (Hungarian: `_one` / `_other` plurals, same order as en.json — `usedKeys.test.ts` checks it has exactly the en keys)

**Rules:**
- ALWAYS add to all three files at the same time
- Keep alphabetical order within the file
- Polish and Hungarian translations must be actual translations, not placeholders (JSON has no comments)

## Step 4: Summary

Present:
- Keys reused (existing ones found)
- Keys added (new ones created)
- en.json, pl.json and hu.json updated

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
// hu.json: "welcomeMessage": "Üdv, {{name}}!"
```
