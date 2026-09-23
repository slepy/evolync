---
name: new-model
description: Guide for adding a new WatermelonDB model with schema, migrations, repository, and Supabase migration. Use when creating database tables or models.
---

# Adding a New Database Model - Step by Step

Follow ALL steps in order. Do not skip any step.

## Checklist

1. **Module Schema** → `src/modules/{module}/database/schema.ts`
2. **Model Class** → `src/database/models/{ModelName}.ts`
3. **Register in models/index.ts** → `src/database/models/index.ts`
4. **Register in database/index.ts** → `src/database/index.ts`
5. **Register in schema.ts** → `src/database/schema.ts` (increment version!)
6. **Add Migration** → `src/database/migrations.ts` (increment `toVersion`!)
7. **Create Repository** → `src/modules/{module}/repositories/{Model}Repository.ts`
8. **Export Repository** → `src/modules/{module}/repositories/index.ts`
9. **Create Supabase Migration** → `supabase/migrations/{TIMESTAMP}_{description}.sql`
10. **Update Sync Function** → `supabase/functions/sync/` (if needed)

## Step 1: Module Schema

File: `src/modules/{module}/database/schema.ts`

```typescript
import { tableSchema } from "@nozbe/watermelondb";

export const {module}Schema = [
  tableSchema({
    name: "table_name",  // Use snake_case, plural
    columns: [
      { name: "school_id", type: "string", isIndexed: true },  // FK = isIndexed
      { name: "name", type: "string" },
      { name: "amount", type: "number" },
      { name: "notes", type: "string", isOptional: true },
      { name: "status", type: "string" },
      { name: "is_active", type: "boolean" },
      { name: "date", type: "number" },  // Dates stored as timestamps
      { name: "created_at", type: "number" },     // REQUIRED
      { name: "updated_at", type: "number" },     // REQUIRED
      { name: "deleted_at", type: "number", isOptional: true },  // REQUIRED for soft delete
    ],
  }),
];
```

**Rules:**
- Column types: `"string"`, `"number"`, `"boolean"` only
- Foreign keys: always `isIndexed: true`
- Dates: stored as `"number"` (timestamp)
- Optional fields: `isOptional: true`
- Always include `created_at`, `updated_at`, `deleted_at` — **including child/row tables**

## Step 2: Model Class

File: `src/database/models/{ModelName}.ts`

```typescript
import { Model } from "@nozbe/watermelondb";
import {
  children,
  date,
  field,
  readonly,
  relation,
} from "@nozbe/watermelondb/decorators";

export default class ModelName extends Model {
  static table = "table_name";  // Must match schema
  static associations = {
    parent_table: { type: "belongs_to" as const, key: "parent_id" },
    child_table: { type: "has_many" as const, foreignKey: "model_id" },
  };

  @field("parent_id") parentId!: string;
  @field("name") name!: string;
  @field("amount") amount!: number;
  @field("notes") notes?: string;
  @field("status") status!: string;
  @field("is_active") isActive!: boolean;
  @date("date") date!: Date;

  @relation("parent_table", "parent_id") parent!: ParentModel;
  @children("child_table") children!: ChildModel[];

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
```

**Decorators:**
- `@field` → string, number, boolean
- `@date` → Date fields (auto converts timestamp ↔ Date)
- `@readonly @date` → for created_at, updated_at (auto-managed by WatermelonDB)
- `@relation("table", "fk_column")` → belongs_to
- `@children("table")` → has_many

**Typing enum/union fields:** import the type from the module's `types/` folder rather than repeating it in the model:

```typescript
import type { AttackDirection } from "@/modules/techniques/notes/types";

@field("direction") direction!: AttackDirection;
```

## Step 3-5: Register Model

**`src/database/models/index.ts`** - add export:
```typescript
export { default as ModelName } from './ModelName'
```

**`src/database/index.ts`** - add import and modelClasses entry:
```typescript
import ModelName from "./models/ModelName";
// ... in modelClasses array:
ModelName,
```

**`src/database/schema.ts`** - import schema and increment version:
```typescript
import { moduleSchema } from "@/modules/{module}/database/schema";

export default appSchema({
  version: CURRENT_VERSION + 1,  // INCREMENT! Currently at 14.
  tables: [
    // ... existing schemas
    ...moduleSchema,
  ],
});
```

**Current DB version: 14** (as of 2026-04-17). Always read the actual value before incrementing.

## Step 6: Local Migration

File: `src/database/migrations.ts`

Add a new entry at the **TOP** of the migrations array (highest `toVersion` first):

```typescript
{
  toVersion: CURRENT_VERSION + 1,  // Must match schema version!
  steps: [
    createTable({
      name: "table_name",
      columns: [
        // Same columns as in schema.ts
        { name: "field", type: "string" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "deleted_at", type: "number", isOptional: true },
      ],
    }),
  ],
},
```

For adding columns to existing table:
```typescript
{
  toVersion: CURRENT_VERSION + 1,
  steps: [
    addColumns({
      table: "existing_table",
      columns: [
        { name: "new_field", type: "string", isOptional: true },
      ],
    }),
  ],
},
```

**CRITICAL:** The `toVersion` in migrations.ts MUST match the `version` in schema.ts!

## Step 7-8: Repository

File: `src/modules/{module}/repositories/{Model}Repository.ts`

```typescript
import { database } from "@/database";
import ModelName from "@/database/models/ModelName";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const ModelNameRepository = {
  async create(data: {
    parentId: string;
    name: string;
    // explicit fields — avoid Partial<Model> to prevent accidentally writing computed/decorator fields
  }): Promise<ModelName> {
    const collection = database.get<ModelName>("table_name");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        record.parentId = data.parentId;
        record.name = data.name;
      });
    });
  },

  async findById(id: string): Promise<ModelName | null> {
    const collection = database.get<ModelName>("table_name");
    try {
      return await collection.find(id);
    } catch {
      return null;
    }
  },

  async findByParentId(parentId: string): Promise<ModelName[]> {
    const collection = database.get<ModelName>("table_name");
    return await collection
      .query(
        Q.where("parent_id", parentId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .fetch();
  },

  async update(id: string, data: { name?: string }): Promise<ModelName> {
    const collection = database.get<ModelName>("table_name");
    const item = await collection.find(id);
    return await database.write(async () => {
      return await item.update((record) => {
        if (data.name !== undefined) record.name = data.name;
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<ModelName>("table_name");
    const item = await collection.find(id);
    await database.write(async () => {
      await item.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  async fetchCount(parentId: string): Promise<number> {
    const collection = database.get<ModelName>("table_name");
    return await collection
      .query(Q.where("parent_id", parentId), Q.where("deleted_at", null))
      .fetchCount();
  },

  // Observable methods for reactive UI
  observeByParentId(parentId: string) {
    const collection = database.get<ModelName>("table_name");
    return collection
      .query(
        Q.where("parent_id", parentId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observe();
  },

  observeById(id: string) {
    const collection = database.get<ModelName>("table_name");
    return collection.findAndObserve(id);
  },
};
```

Export in `src/modules/{module}/repositories/index.ts`:
```typescript
export { ModelNameRepository } from "./ModelNameRepository";
```

**Repository Rules:**
1. One repository per model
2. Data access ONLY — no business logic
3. Always `database.write()` for mutations
4. Always `uuidv4()` for new record IDs
5. Always `Q.where("deleted_at", null)` in queries
6. Always include `observe*` methods for reactive UI
7. Use explicit typed input objects in `create()`/`update()` — not `Partial<Model>`

## Step 9: Supabase Migration

File: `supabase/migrations/{YYYYMMDD}000000_{description}.sql`

Use current date for timestamp prefix. Latest migration: `20260417000000_technique_notes.sql`.

```sql
-- Create table
create table if not exists public.table_name (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parent_table(id),
  name text not null,
  amount numeric not null default 0,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Indexes
create index if not exists idx_table_name_parent_id on public.table_name(parent_id);

-- RLS
alter table public.table_name enable row level security;

-- For organization-scoped data:
create policy "Org owners can manage table_name"
  on public.table_name for all
  using (
    exists (
      select 1 from public.organizations o
      where o.id = table_name.organization_id
      and o.owner_id = auth.uid()
    )
  );

-- For user-owned data (simple):
create policy "Users can manage own table_name"
  on public.table_name for all
  using (auth.uid() = user_id);

-- For child tables where user_id is on the parent:
create policy "Users can read own table_name"
  on public.table_name for select
  using (
    exists (
      select 1 from public.parent_table p
      where p.id = table_name.parent_id and p.user_id = auth.uid()
    )
  );
-- repeat for insert / update / delete with appropriate with check()
```

**RLS pattern for child tables:** join to parent and check `parent.user_id = auth.uid()`.
See `20260417000000_technique_notes.sql` (`technique_note_rows`) for a full example.

## Step 10: Update Sync (if needed)

If the new table needs to sync, there are two patterns:

**Pattern A — add directly to existing sync file** (1-2 simple tables scoped to an existing entity):
- `sync-organization.ts` — for organization-scoped data
- `sync-user.ts` — for user-owned data

**Pattern B — create a dedicated `sync-{module}.ts` file** (2+ tables, child relationships, or a new domain):
1. Create `supabase/functions/sync/sync-{module}.ts` with `push{Module}Changes` and `pull{Module}Changes` functions — see `sync-threed.ts` and `sync-notes.ts` for the exact pattern.
2. Import and call both functions in `sync-user.ts` (after the threed block).
3. Import and call both functions in `sync-organization.ts` (after the threed block) — instructors need their private data too.

**Child table pull pattern** (when parent holds `user_id`, child does not):
```typescript
// fetch parent IDs first
const { data: parents } = await supabaseClient
  .from("parent_table")
  .select("id")
  .eq("user_id", userId)
  .is("deleted_at", null);
const parentIds = (parents || []).map((p: any) => p.id);

if (parentIds.length > 0) {
  pullChanges.child_table = await fetchTableChanges("child_table", (q) =>
    q.in("parent_id", parentIds),
  );
} else {
  pullChanges.child_table = { created: [], updated: [], deleted: [] };
}
```

**Push security filter** — always filter root (user_id) records before upsert; child records are protected by Supabase RLS:
```typescript
if (tableName === "root_table") {
  created = created.filter((r) => r.user_id === userId);
  updated = updated.filter((r) => r.user_id === userId);
}
```

**CRITICAL — Adding columns to existing synced tables:**

When adding a column to an **existing** table that already syncs (e.g. `school_members`), check:

1. **`convertToWatermelonRecord` / `convertToSupabaseRecord`** in `supabase/functions/sync/utils.ts`
   — both functions use spread (`...record`) so new plain text/number columns pass through automatically.
   — Only add explicit handling if the new column is a **timestamp** that needs ms ↔ ISO conversion.

2. **`SELECT *` queries** in the sync function — new columns are included automatically.

3. **Supabase trigger propagation** — if the new column is derived from another table (e.g. user profile → `school_members`), add or extend the trigger in the Supabase migration (see `20260302000000_add_phone_number_to_school_members.sql` for the pattern).

4. **After saving profile/user data that triggers such a propagation**, call `sync().catch(console.error)` in the screen (fire-and-forget) so the local WatermelonDB picks up the updated row immediately.

## Existing Models Reference

| Module              | Repository                   | Table                        |
| ------------------- | ---------------------------- | ---------------------------- |
| attendance          | TrainingSessionRepository    | training_sessions            |
| attendance          | AttendanceRecordRepository   | attendance_records           |
| events              | EventRepository              | events                       |
| events              | EventParticipantRepository   | event_participants           |
| grading             | GradingRankRepository        | organization_gradings        |
| inventory           | ProductRepository            | products                     |
| inventory           | ProductVariantRepository     | product_variants             |
| orders              | OrderRepository              | orders                       |
| orders              | OrderItemRepository          | order_items                  |
| payments            | PaymentCycleRepository       | payment_cycles               |
| payments            | PaymentRecordRepository      | payment_records              |
| school              | SchoolRepository             | schools                      |
| school              | SchoolSettingsRepository     | school_settings              |
| school              | SchoolInviteRepository       | school_invites               |
| students            | StudentRepository            | school_members               |
| threed              | TechniqueRepository          | techniques                   |
| threed              | SequenceRepository           | sequences                    |
| threed              | BodyPosePresetRepository     | body_pose_presets            |
| techniques/notes    | NoteDocumentRepository       | technique_note_documents     |
| techniques/notes    | NoteRowRepository            | technique_note_rows          |
