---
name: new-module
description: Guide for creating a new feature module from scratch with full directory structure, barrel exports, types, and integration. Use when building entirely new features.
---

# Creating a New Module - Step by Step

## Full Directory Structure

Create ALL these files for a complete module:

```
src/modules/{module}/
├── components/
│   ├── index.ts              # Barrel exports for components
│   └── FeatureComponent.tsx  # UI components
├── hooks/
│   ├── index.ts              # Barrel exports for hooks
│   └── useFeature.ts         # Data hooks with .observe()
├── repositories/
│   ├── index.ts              # Barrel exports for repositories
│   └── ModelRepository.ts    # Data access (CRUD + observe)
├── services/
│   ├── index.ts              # Barrel exports for services
│   └── featureService.ts     # Business logic
├── types/
│   ├── index.ts              # Barrel exports for types
│   └── dto.ts                # Data transfer objects
├── validation/
│   ├── index.ts              # Barrel exports for schemas
│   └── featureSchema.ts      # Zod validation schemas
├── database/
│   └── schema.ts             # WatermelonDB table schema
├── constants.ts              # Module constants (optional)
└── index.ts                  # Module public API
```

## Step-by-Step Checklist

### 1. Database Schema
See `new-model` skill for complete database setup instructions.

### 2. Types (`types/dto.ts`)

```typescript
export interface CreateFeatureDto {
  parentId: string;
  name: string;
  description?: string;
}

export interface UpdateFeatureDto {
  name?: string;
  description?: string;
}
```

```typescript
// types/index.ts
export type { CreateFeatureDto, UpdateFeatureDto } from "./dto";
```

### 3. Validation (`validation/featureSchema.ts`)

```typescript
import { z } from "zod";

export const createFeatureSchema = z.object({
  name: z.string().min(1, t("validationRequired")).max(100),
  description: z.string().optional(),
});

export type CreateFeatureFormValues = z.infer<typeof createFeatureSchema>;
```

```typescript
// validation/index.ts
export { createFeatureSchema, type CreateFeatureFormValues } from "./featureSchema";
```

### 4. Repository
See `new-model` skill for complete repository template.

### 5. Service (`services/featureService.ts`)

```typescript
import { sync } from "@/database/sync";
import { FeatureRepository } from "../repositories";
import type { CreateFeatureDto } from "../types";

export const createFeature = async (data: CreateFeatureDto) => {
  if (!data.name?.trim()) {
    throw new Error("validationRequired");
  }

  const feature = await FeatureRepository.create({
    parentId: data.parentId,
    name: data.name.trim(),
    description: data.description?.trim(),
  });

  // Fire-and-forget sync
  sync().catch((err) => console.error("[createFeature] Sync:", err));

  return feature;
};

export const updateFeature = async (id: string, data: UpdateFeatureDto) => {
  const feature = await FeatureRepository.update(id, data);
  sync().catch((err) => console.error("[updateFeature] Sync:", err));
  return feature;
};

export const deleteFeature = async (id: string) => {
  await FeatureRepository.softDelete(id);
  sync().catch((err) => console.error("[deleteFeature] Sync:", err));
};
```

```typescript
// services/index.ts
export { createFeature, updateFeature, deleteFeature } from "./featureService";
```

### 6. Hook
See `new-screen` skill for complete hook template.

### 7. Components
See `new-screen` skill for component templates.

### 8. Module Public API (`index.ts`)

Only export what other modules need:

```typescript
// src/modules/{module}/index.ts
export { FeatureScreen } from "./components";
export { useFeature } from "./hooks";
export type { CreateFeatureDto } from "./types";
```

## Integration Points

After creating the module, register it in:

1. **Database schema** → `src/database/schema.ts` (add `...moduleSchema`)
2. **Database models** → `src/database/index.ts` (add to `modelClasses`)
3. **Model exports** → `src/database/models/index.ts`
4. **Migrations** → `src/database/migrations.ts`
5. **Supabase migration** → `supabase/migrations/`

## Key Rules

1. **No circular dependencies** - modules can import from `core` but not from each other
2. **Barrel exports everywhere** - every subfolder has `index.ts`
3. **Import from barrels** - use `import { X } from "../repositories"` not `"../repositories/XRepository"`
4. **`core` is shared** - generic components, hooks, utils go in `src/modules/core/`
5. **Translations** - always add to both `en.json` and `pl.json`, search for duplicates first
6. **Offline-first** - all reads from WatermelonDB, never from Supabase directly
7. **Sync after mutations** - services call `sync().catch(console.error)` after create/update/delete
