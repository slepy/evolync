---
name: fix-bug
description: Structured workflow for investigating and fixing bugs systematically
disable-model-invocation: true
argument-hint: "<bug description>"
---

# Fix Bug Workflow

Fix the bug: **$ARGUMENTS**

Follow this workflow strictly. Do NOT jump to a fix without understanding the root cause.

## Step 1: Understand the Bug

- What is the expected behavior?
- What is the actual behavior?
- Which screen/feature is affected?
- Ask the user for clarification if the description is unclear

## Step 2: Locate the Code

1. Identify which module the bug belongs to (`src/modules/{module}/`)
2. Read the relevant files:
   - Screen/route (`app/`)
   - Component (`src/modules/{module}/components/`)
   - Hook (`src/modules/{module}/hooks/`)
   - Service (`src/modules/{module}/services/`)
   - Repository (`src/modules/{module}/repositories/`)
3. Trace the data flow from UI → hook → service → repository → database

## Step 3: Identify Root Cause

- Is it a data flow issue? (wrong query, missing filter, stale data)
- Is it a UI issue? (wrong props, missing state update, layout)
- Is it a sync issue? (data not syncing, wrong sync trigger)
- Is it a type issue? (wrong data format, missing field)
- Is it a translation issue? (missing key, wrong key)

State the root cause clearly before proceeding.

## Step 4: Plan the Fix

- What is the minimal change needed?
- Which files need to be modified?
- Could this fix break anything else?
- Do NOT refactor surrounding code - fix only the bug

## Step 5: Implement

- Make the minimal fix
- Ensure you follow project conventions:
  - `t()` for user-facing text
  - `Q.where("deleted_at", null)` in queries
  - `database.write()` for mutations
  - `sync().catch(console.error)` after mutations

## Step 6: Verify

- Read the modified code to confirm correctness
- Run `npm run typecheck` — fix any errors introduced by this fix (pre-existing errors in unrelated files, and Deno edge function `.ts` extension/`Deno` errors under `supabase/functions/`, are expected and can be ignored)
- Check if the fix could affect related features
- Check translations if UI text was changed (both `en.json` and `pl.json`)

## Step 7: Summary

Present:
- Root cause explanation
- Files modified
- What the fix does
- Any related areas to watch for regressions
