---
name: add-types
description: Guide for organizing types/ folder in a module. Use when adding DTOs, enums, database interfaces, or helpers to a module's types/ directory.
---

# Types Folder Conventions

Every module's `types/` folder follows this structure:

```
types/
├── enums.ts     # const objects + their derived TypeScript types
├── db.ts        # raw interfaces mirroring database records (snake_case fields)
├── dto.ts       # Create/Update/Response DTOs and complex view-model interfaces
└── index.ts     # barrel re-export of everything
```

Not all files are required — only create files that have content.

---

## `enums.ts` — Constants and their types

Use for: status values, filter options, tab selectors, named constant groups.

```typescript
// Pattern: const object + derived type
export const ORDER_STATUS = {
  PLACED: "placed",
  PAID: "paid",
  COMPLETED: "completed",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Pattern: dual declaration (type alias + const object with same name)
// Used when you need both the type and the enum-like object
export type MemberStatus = "pending" | "active" | "archived";

export const MemberStatus = {
  PENDING: "pending" as const,
  ACTIVE: "active" as const,
  ARCHIVED: "archived" as const,
};
```

**Rules:**
- No logic, no functions — only data shapes and constants
- No imports from `dto.ts` or `db.ts`
- String literal unions preferred over TypeScript `enum` keyword

---

## `db.ts` — Database record interfaces

Use for: raw Supabase row shapes with snake_case field names.

```typescript
import type { MemberStatus } from './enums';

export interface SchoolMemberRecord {
  id: string;
  school_id: string;
  user_id?: string | null;
  display_name?: string | null;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
```

**Rules:**
- Fields use `snake_case` (mirrors Supabase columns)
- Only plain interfaces — no logic, no functions
- May import types from `enums.ts`, never from `dto.ts`
- Timestamps are `string` (ISO from Supabase), not `Date`

---

## `dto.ts` — Data Transfer Objects and view-model interfaces

Use for: Create/Update DTOs passed to services, Response DTOs returned from services, complex interfaces combining multiple models for UI.

```typescript
import { SchoolMember } from "@/database/models";
import type Order from "@/database/models/Order";
import type { OrderStatus } from "./enums";

// Input DTOs (camelCase, passed to service functions)
export interface CreateOrderDto {
  schoolId: string;
  schoolMemberId: string;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderDto {
  status?: OrderStatus;
}

// Response DTOs (what services/hooks return)
export interface OrderResponseDto {
  id: string;
  schoolId: string;
  status: OrderStatus;
  createdAt: Date;    // Date, not string (already parsed)
}

// View-model interfaces (assembled for UI rendering)
export interface OrderWithDetails {
  orderId: string;
  status: Order["status"];
  member: SchoolMember | null;
  itemCount: number;
  totalsByCurrency: Record<string, number>;
}
```

**Rules:**
- Fields use `camelCase`
- Timestamps are `Date` in response DTOs (already parsed from string)
- Create DTOs are named `Create{Feature}Dto`
- Update DTOs are named `Update{Feature}Dto`
- Response DTOs are named `{Feature}ResponseDto`
- View-model interfaces: descriptive name (e.g. `OrderWithDetails`, `AggregatedProduct`)
- May import from `enums.ts` and from `@/database/models/*`

---

## `index.ts` — Barrel export

Re-export everything so callers import from `"../types"` or `"@/modules/orders/types"`:

```typescript
export * from './enums';
export * from './db';
export * from './dto';
```

Use named re-exports only when there are conflicts:

```typescript
export type { CreateRankDto, UpdateRankDto } from './dto';
```

---

## Where helper functions go

**Never put functions in `types/`.**

| Situation | Where to put it |
|---|---|
| Used in exactly one component | Define it locally inside that component file |
| Used in 2+ places within the same module | Create `{module}/utils/helpers.ts` |
| Used across multiple modules | Add to `src/core/utils/` |

### Example: status label function

Used only in `OrderStatusFilter.tsx` → define it there:

```typescript
// src/modules/orders/components/OrderStatusFilter.tsx
const getOrderStatusLabel = (status: OrderStatusFilter): string => {
  const labels: Record<OrderStatusFilter, string> = {
    all: t("ordersFilterAll"),
    placed: t("statusPlaced"),
    paid: t("statusPaid"),
  };
  return labels[status] ?? status;
};
```

Use a `Record` map instead of `switch` — exhaustive, no default branch needed.

---

## Checklist when adding new types

1. **Enums/constants** → `enums.ts`
2. **Database record shape** (snake_case, mirrors Supabase) → `db.ts`
3. **Create/Update/Response DTO** → `dto.ts`
4. **View-model interface** (assembled for UI) → `dto.ts`
5. **Helper function** → in the component/hook that uses it (or `utils/` if shared)
6. **Update `index.ts`** to re-export from the new file
7. **Check for duplicates** — search existing types before adding new ones
