---
name: new-screen
description: Guide for adding a new screen/route with Expo Router, hooks with reactive data, and UI components. Use when creating new pages or views.
---

# Adding a New Screen - Step by Step

## Checklist

1. **Create Hook** → `src/modules/{module}/hooks/use{Feature}.ts`
2. **Create Component** → `src/modules/{module}/components/{Feature}.tsx`
3. **Create Route** → `app/{route}/{screen}.tsx`
4. **Export from Module** → `src/modules/{module}/index.ts`
5. **Add Translations** → Use `/add-translations` skill

## Step 1: Hook with Reactive Data

File: `src/modules/{module}/hooks/use{Feature}.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { ModelRepository } from "../repositories";
import { createModel } from "../services";
import type { CreateModelDto } from "../types";
import { useStore } from "@/store";

export const useFeature = (parentId: string | undefined) => {
  const [items, setItems] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { performSync } = useStore();

  // Subscribe to local database (reactive)
  useEffect(() => {
    if (!parentId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const subscription = ModelRepository
      .observeByParentId(parentId)
      .subscribe({
        next: (result) => {
          setItems(result);
          setIsLoading(false);
        },
        error: (err) => {
          console.error("[useFeature] Error:", err);
          setError(t("errorLoadingFailed"));
          setIsLoading(false);
        },
      });

    return () => subscription.unsubscribe();
  }, [parentId]);

  // Create handler
  const handleCreate = useCallback(
    async (data: Omit<CreateModelDto, "parentId">) => {
      if (!parentId) throw new Error("missingParentId");
      try {
        setError(null);
        return await createModel({ ...data, parentId });
      } catch (err) {
        const message = err instanceof Error ? err.message : t("errorCreateFailed");
        setError(message);
        throw err;
      }
    },
    [parentId]
  );

  // Refresh (trigger sync)
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await performSync(true);
    } catch (err) {
      setError(t("errorLoadingFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [performSync]);

  return { items, isLoading, error, handleCreate, refresh };
};
```

Export in `src/modules/{module}/hooks/index.ts`:
```typescript
export { useFeature } from "./useFeature";
```

**Hook Rules:**
- Always subscribe to `.observe()` for reactive data
- Always unsubscribe in cleanup (`return () => subscription.unsubscribe()`)
- Use `useCallback` for handlers
- Services handle mutations, hooks catch errors and set state
- Use `t()` for error messages (globally available, no import)
- Return `{ data, isLoading, error, ...handlers }`

## Step 2: Component

File: `src/modules/{module}/components/{Feature}.tsx`

```typescript
import React from "react";
import { router } from "expo-router";
import {
  ListCard,
  ListEmpty,
  ListRow,
  ListSection,
  LoadingScreen,
  SubScreenPage,
} from "@/core/components";
import { useFeature } from "../hooks";

interface FeatureScreenProps {
  parentId: string;
}

export const FeatureScreen: React.FC<FeatureScreenProps> = ({ parentId }) => {
  const { items, isLoading } = useFeature(parentId);

  if (isLoading) return <LoadingScreen />;

  return (
    <SubScreenPage title={t("featureTitle")} context="school">
      <ListSection title={t("featureTitle")} accent="school">
        {items.length === 0 ? (
          <ListEmpty text={t("noItemsYet")} />
        ) : (
          <ListCard>
            {items.map((item) => (
              <ListRow
                key={item.id}
                title={item.name}
                onPress={() => router.push(`/route/${item.id}`)}
              />
            ))}
          </ListCard>
        )}
      </ListSection>
    </SubScreenPage>
  );
};
```

Export in `src/modules/{module}/components/index.ts`:
```typescript
export { FeatureScreen } from "./FeatureScreen";
```

**Component Rules:**
- Use `ListSection` + `ListCard` + `ListRow` for lists of interactive rows (from `@/core/components`)
- Use `t()` for ALL user-facing text (globally available, no import)
- Use `LoadingScreen` for loading states
- Use `router.push()` / `router.back()` for navigation
- Import from module barrel exports, not direct file paths
- **ALWAYS** use `PrimaryButton` for submit/save buttons — never a raw `Button` or a module-local button. On a form screen pass it as the `footer` of `SubScreenPage` (pinned above the keyboard):
  ```typescript
  import { PrimaryButton, SubScreenPage } from "@/core/components";
  <SubScreenPage title={t("featureTitle")} footer={<PrimaryButton label={t("save")} accent="school" onPress={handleSubmit} loading={isLoading} />}>
  ```
- **Edit screens**: render the footer only when `isDirty` — use `useDirtyFlag` from `@/core/hooks`. See `dirty-flag` skill for full pattern.
- **Create screens**: the button is always visible (or gated on required fields being filled).

## Step 3: Route (Screen File)

File: `app/{route}/{screen}.tsx`

Screens are **thin wrappers** that pass route params to module components:

```typescript
import { FeatureScreen } from "@/modules/{module}";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function FeaturePage() {
  const { parentId } = useLocalSearchParams<{ parentId: string }>();

  return <FeatureScreen parentId={parentId!} />;
}
```

**Routing Conventions:**
- `app/school/[schoolId]/feature/index.tsx` → `/school/:schoolId/feature`
- `app/school/[schoolId]/feature/create.tsx` → `/school/:schoolId/feature/create`
- `app/school/[schoolId]/feature/[featureId].tsx` → `/school/:schoolId/feature/:featureId`
- `app/organization/feature/index.tsx` → `/organization/feature`
- `app/user/feature.tsx` → `/user/feature`

## Step 4: Module Exports

File: `src/modules/{module}/index.ts`

```typescript
export { FeatureScreen } from "./components";
export { useFeature } from "./hooks";
export type { CreateModelDto } from "./types";
```

## Step 5: Translations

Use the `/add-translations` skill or manually:
1. Search existing keys in `src/core/i18n/locales/en.json` for duplicates
2. Add new keys to BOTH `en.json` AND `pl.json`
3. Use `t("keyName")` in components (no import needed)

## Common UI Patterns

**List with FAB:**
```typescript
<YStack flex={1}>
  <ScrollView>
    {/* List content */}
  </ScrollView>
  <Button
    position="absolute" bottom="$4" right="$4"
    circular size="$5"
    backgroundColor="$blue10"
    onPress={() => router.push("/route/create")}
    icon={<Plus color="white" />}
  />
</YStack>
```

**Form Screen (React Hook Form + Zod):**
```typescript
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSchema, type FormValues } from "../validation";

const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(createSchema),
  defaultValues: { name: "" },
});
```

**Header with back button:**
```typescript
import { Stack } from "expo-router";

<Stack.Screen options={{ title: t("featureTitle") }} />
```
