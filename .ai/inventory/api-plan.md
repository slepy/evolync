# API Endpoint Implementation Plan: Create Product

## 1. Przegląd punktu końcowego

**Cel**: Umożliwić instruktorom dodawanie nowych produktów do magazynu organizacji w architekturze offline-first.

**Opis**: Endpoint pozwala na utworzenie nowego produktu w lokalnej bazie danych (WatermelonDB) z automatyczną synchronizacją do Supabase w tle. Produkt jest powiązany z organizacją i dostępny dla wszystkich członków szkoły w ramach tej organizacji.

**Operacja**: Tworzenie (Create)
**Przychodzi z**: `src/modules/inventory/services/` (nowy service)

---

## 2. Szczegóły żądania

### Metoda HTTP

- **POST** `/organizations/{organizationId}/products`

### Parametry URL

- `organizationId` (UUID, wymagane) - ID organizacji, do której ma być dodany produkt

### Nagłówki

- `Authorization: Bearer <token>` - JWT token z Supabase Auth
- `Content-Type: application/json`

### Request Body

```json
{
  "name": "Hakama - Rozmiar M",
  "price": 299.99,
  "description": "Tradycyjne spodnie treningowe, rozmiar M",
  "currency": "PLN",
  "stock_quantity": 50,
  "image_url": "https://storage.example.com/products/hakama-m.jpg"
}
```

### Parametry wejściowe

- **Wymagane**:
  - `name` (string, 1-255 znaków) - Nazwa produktu
  - `price` (number, > 0) - Cena produktu z max. 2 miejscami dziesiętnymi

- **Opcjonalne**:
  - `description` (string, max. 1000 znaków) - Opis produktu
  - `currency` (string, domyślnie "PLN") - Waluta ceny (format ISO 4217)
  - `stock_quantity` (number, domyślnie 0) - Ilość jednostek na magazynie (>= 0)
  - `image_url` (string) - URL do obrazu produktu

---

## 3. Wykorzystywane typy

### DTO Request

```typescript
// src/modules/inventory/types/dto.ts

export interface ProductDto {
  name: string;
  price: number;
  description?: string;
  currency?: string;
  stock_quantity?: number;
  image_url?: string;
}
```

### DTO Response

```typescript
// src/modules/inventory/types/dto.ts

export interface ProductResponseDto {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  image_url: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Database Model

```typescript
// src/database/models/Product.ts

import { Model } from "@nozbe/watermelondb";
import { field, text, readonly } from "@nozbe/watermelondb/decorators";

export default class Product extends Model {
  static table = "products";

  @field("organization_id") organizationId!: string;
  @text("name") name!: string;
  @text("description") description!: string | null;
  @field("price") price!: number;
  @text("currency") currency!: string;
  @field("stock_quantity") stockQuantity!: number;
  @text("image_url") imageUrl!: string | null;

  @readonly @field("created_at") createdAt!: number;
  @readonly @field("updated_at") updatedAt!: number;
  @field("deleted_at") deletedAt!: number | null;
}
```

### Validation Schema (Zod)

```typescript
// src/modules/inventory/validation/productValidation.ts

import { z } from "zod";

export const CreateProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name must be less than 255 characters"),
  price: z
    .number()
    .positive("Price must be greater than 0")
    .multipleOf(0.01, "Price must have at most 2 decimal places"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  currency: z
    .string()
    .length(3, "Currency must be ISO 4217 code (e.g., PLN, USD)")
    .default("PLN")
    .optional(),
  stock_quantity: z
    .number()
    .int("Stock quantity must be an integer")
    .nonnegative("Stock quantity cannot be negative")
    .default(0)
    .optional(),
  image_url: z.string().url("Image URL must be a valid URL").optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
```

---

## 4. Szczegóły odpowiedzi

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "organizationId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Hakama - Rozmiar M",
    "description": "Tradycyjne spodnie treningowe, rozmiar M",
    "price": 299.99,
    "currency": "PLN",
    "stock_quantity": 50,
    "image_url": "https://storage.example.com/products/hakama-m.jpg",
    "createdAt": "2026-01-13T10:30:00Z",
    "updatedAt": "2026-01-13T10:30:00Z"
  },
  "message": "Product created successfully"
}
```

### Error Responses

#### 400 - Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "price",
        "message": "Price must be greater than 0"
      }
    ]
  }
}
```

#### 401 - Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

#### 403 - Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to create products for this organization"
  }
}
```

#### 404 - Not Found

```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_NOT_FOUND",
    "message": "Organization with ID does not exist"
  }
}
```

#### 500 - Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "An error occurred while creating the product"
  }
}
```

---

## 5. Przepływ danych

### Architektura Offline-First

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. User submits form (name, price, description...)  │  │
│  │     Validation at component level                    │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  2. Call productService.createProduct(dto)           │  │
│  │     - Validate DTO against Zod schema                │  │
│  │     - Check organization exists in global state      │  │
│  │     - Generate UUID v4 for product ID                │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  3. Write to WatermelonDB (LOCAL DATABASE)           │  │
│  │     - database.write() transaction                   │  │
│  │     - Create product record with all fields          │  │
│  │     - Set timestamps (created_at, updated_at)        │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  4. Return created product model                     │  │
│  │     Update UI reactively (observers subscribed)      │  │
│  └────────────────┬─────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                     │
        ┌────────────▼──────────────┐
        │   WatermelonDB Sync       │
        │   Adapter (Background)    │
        │                           │
        │  - Detects new product    │
        │  - Batches changes        │
        │  - When online:           │
        │    Push to Supabase       │
        └────────────┬───────────────┘
                     │
        ┌────────────▼──────────────┐
        │   Supabase PostgreSQL     │
        │   products table          │
        │                           │
        │  - Record synced          │
        │  - RLS policy check:      │
        │    (owner_id = auth.uid)  │
        └───────────────────────────┘
```

### Szczegółowy przepływ

1. **Walidacja na kliencie** - Formularz sprawdza dane przed wysłaniem
2. **Wołanie Service** - `createProduct(ProductDto)` w `src/modules/inventory/services/productService.ts`
3. **Sprawdzenie autoryzacji** - Pobranie organizacji z `useStore()` - jeśli organizacja nie istnieje, błąd
4. **Generowanie ID** - `uuidv4()` dla nowego produktu
5. **Transakcja WatermelonDB** - `database.write()` atomicznie tworzy rekord
6. **Return model** - UI aktualizuje się reaktywnie poprzez obserwatorów WatermelonDB
7. **Background sync** - WatermelonDB Sync Adapter automatycznie:
   - Wykrywa zmianę (nowy rekord)
   - Gdy połączenie dostępne, wysyła do Supabase
   - Supabase RLS sprawdza uprawnienia właściciela organizacji
   - Rekord synchronizowany w Supabase PostgreSQL

---

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymóg**: JWT token z Supabase Auth w nagłówku `Authorization`
- **Walidacja**: Middleware sprawdza token przed dostępem do endpointa
- **Storage**: Token przechowywany w Expo SecureStore

### Autoryzacja

- **Sprawdzenie właściciela**: Użytkownik musi być właścicielem organizacji
  - Pobranie z `useStore.getState().organization` w aplikacji klienta
  - Po stronie API: Query na `organizations` gdzie `owner_id = auth.uid()` i `id = organizationId`
- **RLS Policy** (Supabase):

  ```sql
  CREATE POLICY "owner_can_manage_products" ON products
    FOR ALL
    USING (
      SELECT organizations.owner_id = auth.uid()
      FROM organizations
      WHERE organizations.id = products.organization_id
    );
  ```

### Walidacja danych

- **Zod schema** waliduje:
  - Typ danych (string, number, etc.)
  - Minimalny/maksymalny rozmiar stringów
  - Zakres liczb (price > 0, stock_quantity >= 0)
  - Format URL (image_url)
  - Format ISO 4217 (currency)
- **Sanitacja**: Stringi trimowane, niebezpieczne znaki filtrowane
- **Rate limiting**: Rekomendacja - max 100 produktów na godzinę per organizacja (do implementacji w API gateway)

### Przechowywanie wrażliwych danych

- Brak przechowywania PWD, tokenów, czy PII w produktach
- Obrazy przechowywane w Supabase Storage z kontrolą dostępu

### Conflict Resolution

- **Last Write Wins** - Strategia konfliktu w WatermelonDB Sync Adapter
- Jeśli produkt zmieniony na innym urządzeniu, ostatnia zmiana wygrywa
- Timestamp `updated_at` decyduje o kolejności

---

## 7. Obsługa błędów

### Potencjalne błędy i strategie

| Scenariusz                      | Kod | Przyczyna                               | Strategia                                  |
| ------------------------------- | --- | --------------------------------------- | ------------------------------------------ |
| Brak tokenu JWT                 | 401 | Użytkownik nie zalogowany               | Redirect do login                          |
| Nieprawidłowy token             | 401 | Wygasły/sfałszowany token               | Refresh token, ponów żądanie               |
| Brakuje organizacji             | 403 | Użytkownik nie jest właścicielem        | Pokaż komunikat błędu                      |
| Organizacja nie istnieje        | 404 | organizationId nie znaleziony           | Sprawdź ID, pokaż błąd                     |
| Nieprawidłowe dane (name)       | 400 | Name pusty lub > 255 znaków             | Pokaż validation error w UI                |
| Nieprawidłowa cena              | 400 | Price <= 0 lub więcej niż 2 miejsca     | Pokaż validation error                     |
| Nieprawidłowy currency          | 400 | Nie ISO 4217 format                     | Pokaż listę dostępnych walut               |
| Błąd zapisu do WatermelonDB     | 500 | Błąd lokalnej bazy danych               | Retry, zapisz do error log                 |
| Błąd synchronizacji do Supabase | 500 | Timeout/connection error                | Retry w tle, użytkownik kontynuuje offline |
| Duplicate product (rare)        | 400 | UUID collision (praktycznie niemożliwy) | Log error, pokaż użytkownikowi             |

### Logging błędów

- **Klient**: Błędy logowane do AsyncStorage + error tracking service (np. Sentry)
- **Serwer**: Błędy logowane do Supabase Logs, a critical errors do error table w DB
- **Offline**: Błędy zapisywane lokalnie, wysyłane gdy online

### Error table (opcjonalnie)

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation TEXT NOT NULL, -- 'create_product', etc.
  error_code TEXT NOT NULL,
  error_message TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Rozważania dotyczące wydajności

### Optymalizacje

1. **Batch Operations**: Jeśli dodawanie wielu produktów, użyć `database.batch()`
2. **Indeksy w WatermelonDB**:
   - Index na `organization_id` (przyśpiesza queries)
   - Index na `updated_at` (krytyczne dla sync)
3. **Caching**:
   - Zod schema skompilowana raz (reuse instance)
   - Zustand store dla organizacji (nie queryować za każdym razem)

### Potencjalne wąskie gardła

| Wąskie gardło        | Przyczyna                 | Rozwiązanie                       |
| -------------------- | ------------------------- | --------------------------------- |
| Duża ilość produktów | O(n) query przy fetchingu | Pagination, limit 50 per page     |
| Sync lag             | Brak internetu            | Offline mode, queue local changes |
| Storage limit        | SQLite max 5GB            | Archive stare produkty            |
| Image URLs           | Duże obrazy spowalniają   | Optimize images, thumbnails       |

### Metryki do monitorowania

- Czas tworzenia produktu (target < 500ms)
- Czas synchronizacji (target < 2s)
- Storage usage WatermelonDB
- Sync success rate (target 99.9%)

---

## 9. Kroki implementacji

### Faza 1: Setup - Typy i Walidacja (1-2 godziny)

1. **Utwórz model WatermelonDB**
   - Plik: `src/database/models/Product.ts`
   - Zdefiniuj pola: `organizationId`, `name`, `description`, `price`, `currency`, `stockQuantity`, `imageUrl`

2. **Zdefiniuj DTO i typy**
   - Plik: `src/modules/inventory/types/dto.ts`
   - Eksportuj `ProductDto`, `ProductResponseDto`, `CreateProductInput`

3. **Utwórz Zod schema**
   - Plik: `src/modules/inventory/validation/productValidation.ts`
   - Waliduj name, price, currency, stock_quantity, image_url

4. **Zregistruj model w database config**
   - Plik: `src/database/index.ts`
   - Dodaj Product do `schema.associations`

### Faza 2: Service Layer (1-2 godziny)

1. **Utwórz product service**
   - Plik: `src/modules/inventory/services/productService.ts`
   - Zaimplementuj `createProduct(organizationId, dto): Promise<Product>`
   - Logika:
     - Sprawdź organizację z `useStore.getState().organization`
     - Waliduj DTO z Zod
     - Generuj UUID v4
     - `database.write()` transakcja
     - Zwróć created model

2. **Unit tests dla service**
   - Test: organizacja exists
   - Test: DTO validation
   - Test: database write
   - Test: error handling

### Faza 3: API Endpoint (1-2 godziny)

1. **Utwórz API route (Expo Router / API route)**
   - Plik: `app/api/organizations/[organizationId]/products.ts` LUB jako Edge Function
   - HTTP: `POST`
   - Sprawdzenie autoryzacji (JWT)
   - Sprawdzenie organizacji
   - Walidacja danych
   - Zapis do WatermelonDB
   - Zwróć 201 response

2. **Middleware autentykacji**
   - Weryfikacja JWT tokenu
   - Pobranie user ID z token claims
   - Inject do request context

### Faza 4: UI Integration (1-2 godziny)

1. **Formularz dodawania produktu**
   - Plik: `src/modules/inventory/components/CreateProductForm.tsx`
   - Pola: name, price, description, currency, stock_quantity, image_url
   - Zod validation na submit
   - Łączy się z `productService.createProduct()`

2. **Produkt lista**
   - Obserwatory WatermelonDB
   - Reaktywna aktualizacja na nowy produkt
   - Pokazanie loading stanu

### Faza 5: Sync & Offline Support (1-2 godziny)

1. **Konfiguracja WatermelonDB Sync**
   - Sync adapter pusza nowy produkt do Supabase
   - Obsługuje offline (queues changes)

2. **RLS Policy w Supabase**
   - Tylko właściciel organizacji może tworzyć produkty
   - Policy na tabeli `products`

3. **Testing offline**
   - Wyłączy internet
   - Tworzy produkt offline
   - Włączy internet
   - Sprawdza sync

### Faza 6: Testing & Dokumentacja (1-2 godziny)

1. **Integration tests**
   - Test full flow: formularz → service → WatermelonDB → Sync
   - Test error scenarios (400, 401, 403, 404, 500)

2. **E2E tests** (opcjonalne)
   - Selenium/Detox dla mobile
   - Tworzenie produktu na UI → sprawdzenie w bazie

3. **API dokumentacja**
   - OpenAPI/Swagger spec
   - Curl examples
   - Postman collection

4. **Code documentation**
   - JSDoc comments w service
   - README w `src/modules/inventory/`

### Faza 7: Performance & Security Review (1 godzina)

1. **Security audit**
   - Sprawdzenie RLS policy
   - Sprawdzenie rate limiting
   - Code review na validation

2. **Performance testing**
   - Benchmark: czas tworzenia produktu
   - Load test: 100 produktów/s
   - Memory profiling

3. **Monitoring setup**
   - Error logging do Sentry/LogRocket
   - Performance metrics do analytics
   - Sync success tracking

---

## Podsumowanie ścieżki implementacji

```
┌─────────────────────────────────────────────────────────────┐
│  Faza 1: Types & Validation (Model, DTO, Zod)              │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 2: Service Layer (createProduct business logic)       │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 3: API Endpoint (HTTP POST handler)                   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 4: UI Integration (Form + Component)                  │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 5: Sync & Offline Support (WatermelonDB + Supabase)   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 6: Testing & Documentation (Unit, E2E, Docs)          │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 7: Performance & Security Review (Audit, Profile)     │
└─────────────────────────────────────────────────────────────┘
```

**Całkowity czas**: 7-14 godzin (w zależności od złożoności UI i testów)

---

---

# API Endpoint Implementation Plan: Global Upload Image/File

## 1. Przegląd punktu końcowego

**Cel**: Umożliwić użytkownikom (instruktorom i studentom) przesyłanie zdjęć produktów, avatarów i innych zasobów do Supabase Storage.

**Opis**: Globalny endpoint akceptujący pliki binarne (obrazy) od zalogowanych użytkowników. Pliki są widoczne publicznie (lub dla wszystkich zalogowanych) niezależnie od przynależności do organizacji, co umożliwia obsługę avatarów i zdjęć technik dla studentów bez przypisanej szkoły. Endpoint waliduje typ i rozmiar, kompresuje, przechowuje w Supabase Storage i zwraca signed URL do pobrania. Obsługuje offline.

**Operacja**: Przesyłanie pliku (Upload)
**Przychodzi z**: `src/modules/core/services/` (nowy service)

---

## 2. Szczegóły żądania

### Metoda HTTP

- **POST** `/uploads`

### Parametry URL

- Brak

### Nagłówki

- `Authorization: Bearer <token>` - JWT token z Supabase Auth
- `Content-Type: multipart/form-data`

### Request Body (Multipart/Form-Data)

```
Content-Disposition: form-data; name="file"; filename="avatar.jpg"
Content-Type: image/jpeg

[BINARY_IMAGE_DATA]

Content-Disposition: form-data; name="type"

avatar

Content-Disposition: form-data; name="metadata"

{"userId": "550e8400-e29b-41d4-a716-446655440000"}
```

### Parametry wejściowe

- **Wymagane**:
  - `file` (multipart file) - Plik do przesłania (JPG, PNG, WebP, max 5MB)
  - `type` (string) - Typ zasobu: `product`, `avatar`, `technique`, `training-plan`, `thumbnail`

- **Opcjonalne**:
  - `metadata` (JSON string) - Dodatkowe metadane (np. productId, organizationId - jeśli dotyczy)

---

## 3. Wykorzystywane typy

### DTO Request

```typescript
// src/modules/core/types/uploadDto.ts

export interface UploadFileDto {
  file: File | Blob;
  type: "product" | "avatar" | "technique" | "training-plan" | "thumbnail";
  metadata?: Record<string, any>;
}

export interface UploadRequest {
  userId: string;
  file: File;
  type: string;
  metadata?: Record<string, any>;
}
```

### DTO Response

```typescript
// src/modules/core/types/uploadDto.ts

export interface UploadResponseDto {
  id: string;
  userId: string;
  organizationId?: string | null;
  type: string;
  filename: string;
  mimeType: string;
  size: number;
  bucket: string;
  path: string;
  publicUrl: string;
  signedUrl: string;
  expiresIn: number; // w sekundach
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface UploadErrorDto {
  code: string;
  message: string;
  details?: string;
}
```

### Database Model

```typescript
// src/database/models/Upload.ts

import { Model } from "@nozbe/watermelondb";
import { field, text, readonly } from "@nozbe/watermelondb/decorators";

export default class Upload extends Model {
  static table = "uploads";

  @field("user_id") userId!: string;
  @field("organization_id") organizationId!: string | null; // Opcjonalne
  @text("type") type!: string; // 'product', 'avatar', etc.
  @text("filename") filename!: string;
  @text("mime_type") mimeType!: string;
  @field("size") size!: number; // w bajtach
  @text("bucket") bucket!: string;
  @text("path") path!: string; // ścieżka w Storage
  @text("public_url") publicUrl!: string;
  @text("signed_url") signedUrl!: string;
  @field("signed_url_expires_at") signedUrlExpiresAt!: number;
  @text("metadata") metadata!: string; // JSON stringified
  @field("sync_status") syncStatus!: string; // 'pending', 'synced', 'failed'

  @readonly @field("created_at") createdAt!: number;
  @readonly @field("updated_at") updatedAt!: number;
  @field("deleted_at") deletedAt!: number | null;
}
```

### Validation Schema (Zod)

```typescript
// src/modules/core/validation/uploadValidation.ts

import { z } from "zod";

const ALLOWED_TYPES = [
  "product",
  "avatar",
  "technique",
  "training-plan",
  "thumbnail",
] as const;
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const UploadFileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine(
      (file) => ALLOWED_MIMETYPES.includes(file.type),
      `File type must be one of: ${ALLOWED_MIMETYPES.join(", ")}`,
    )
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    )
    .refine((file) => file.size > 0, "File cannot be empty"),

  type: z.enum(ALLOWED_TYPES, {
    errorMap: () => ({
      message: `Type must be one of: ${ALLOWED_TYPES.join(", ")}`,
    }),
  }),

  metadata: z.record(z.any()).optional(),
});

export type UploadFileInput = z.infer<typeof UploadFileSchema>;
```

---

## 4. Szczegóły odpowiedzi

### Success Response (200 OK lub 201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440002",
    "type": "avatar",
    "filename": "avatar-thumb.webp",
    "mimeType": "image/webp",
    "size": 245123,
    "bucket": "uploads",
    "path": "avatar/550e8400-e29b-41d4-a716-446655440002/avatar-thumb.webp",
    "publicUrl": "https://storage.supabase.co/object/public/uploads/avatar/550e8400-e29b-41d4-a716-446655440002/avatar-thumb.webp",
    "signedUrl": "https://storage.supabase.co/object/authenticated/uploads/avatar/550e8400-e29b-41d4-a716-446655440002/avatar-thumb.webp?token=...",
    "expiresIn": 3600,
    "metadata": {
      "userId": "550e8400-e29b-41d4-a716-446655440002"
    },
    "createdAt": "2026-01-13T10:30:00Z"
  },
  "message": "File uploaded successfully"
}
```

### Error Responses

#### 400 - Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "File validation failed",
    "details": "File size exceeds maximum of 5MB"
  }
}
```

#### 401 - Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

#### 403 - Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to upload files for this organization"
  }
}
```

#### 413 - Payload Too Large

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum limit of 5MB"
  }
}
```

#### 415 - Unsupported Media Type

```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_TYPE",
    "message": "File type not supported",
    "details": "Allowed types: image/jpeg, image/png, image/webp"
  }
}
```

#### 500 - Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "UPLOAD_ERROR",
    "message": "An error occurred while uploading the file",
    "details": "Failed to write to Supabase Storage"
  }
}
```

---

## 5. Przepływ danych

### Architektura Offline-First z Storage

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. User picks file from device storage              │  │
│  │     via ImagePicker / DocumentPicker                 │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  2. Validate file (type, size)                       │  │
│  │     - Zod schema validation                          │  │
│  │     - Show preview/confirmation                      │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  3. Compress image on device (optional)              │  │
│  │     - expo-image-manipulator                         │  │
│  │     - Reduce size by 40-60%                          │  │
│  │     - Convert to WebP if supported                   │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  4. Call uploadService.uploadFile(dto)               │  │
│  │     - Validate again with Zod                        │  │
│  │     - Check organization exists                      │  │
│  │     - Generate file path + UUID                      │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  5a. ONLINE: Push to Supabase Storage directly       │  │
│  │     - Multipart upload                               │  │
│  │     - RLS policy check                               │  │
│  │     - Create signed URL (1h)                         │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  5b. OFFLINE: Store locally in WatermelonDB          │  │
│  │     - Upload model with sync_status='pending'        │  │
│  │     - Cache file bytes locally                       │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  6. Return upload response with signed URL           │  │
│  │     Update UI (show image preview)                   │  │
│  └────────────────┬─────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                     │
        ┌────────────▼──────────────────────┐
        │   Background Sync (Online Check)  │
        │                                   │
        │  1. Detect pending uploads        │
        │  2. Retry failed uploads          │
        │  3. Push to Supabase Storage      │
        │  4. Update local records (URLs)   │
        │  5. Clean up local cache          │
        └────────────┬──────────────────────┘
                     │
        ┌────────────▼─────────────────────┐
        │   Supabase Storage (Bucket)      │
        │                                  │
        │  bucket: uploads/                │
        │   ├─ product/                    │
        │   ├─ avatar/                     │
        │   └─ technique/                  │
        │                                  │
        │  RLS: public read, auth write    │
        └────────────┬─────────────────────┘
                     │
        ┌────────────▼─────────────────────┐
        │   WatermelonDB (Metadata)        │
        │   uploads table                  │
        │                                  │
        │  - File paths                    │
        │  - URLs (signed)                 │
        │  - Sync status                   │
        │  - Metadata links                │
        └──────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Wybór i walidacja pliku** - ImagePicker/camera, Zod validation
2. **Kompresja** (opcjonalna) - expo-image-manipulator zmniejsza rozmiar 40-60%
3. **Service call** - `uploadService.uploadFile(UploadFileDto)`
4. **Online path**:
   - Bezpośrednia wysyłka do Supabase Storage
   - Tworzenie signed URL (1 godzina)
   - Zwrócenie danych do UI
5. **Offline path**:
   - Zapis pliku lokalnie (WatermelonDB + file system)
   - Zapis metadanych w tabeli `uploads`
   - Marker `sync_status = 'pending'`
6. **Background sync**:
   - Detekcja pending uploads
   - Retry mechanism dla failedów
   - Push do Storage gdy online
   - Update URLs w DB
   - Cleanup local files

---

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymóg**: JWT token z Supabase Auth
- **Walidacja**: Middleware sprawdza token
- **Storage**: Token w Expo SecureStore

### Autoryzacja

- **Sprawdzenie uprawnień**: Dowolny zalogowany użytkownik może przesyłać pliki.
- **RLS Policy** (Supabase Storage):

  ```sql
  -- Zezwól każdemu zalogowanemu użytkownikowi na upload do bucketa `uploads`
  CREATE POLICY "authenticated_users_can_upload" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'uploads');

  -- Publiczny odczyt (lub dla zalogowanych) dla zasobów globalnych
  CREATE POLICY "files_are_globally_visible" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'uploads');
  ```

### Walidacja plików

- **Typ MIME**: Whitelist (image/jpeg, image/png, image/webp)
- **Magic bytes check**: Weryfikacja rzeczywistego typu pliku (nie tylko rozszerzenia)
- **Rozmiar**: Max 5MB (dla obrazów) - configurable per type
- **Wymiary obrazu**: (opcjonalnie) min 100x100px dla thumbnails
- **Skanowanie wirusa**: (opcjonalnie) integracja z ClamAV

### Przechowywanie

- **Ścieżka**: `{type}/{timestamp}-{uuid}.{ext}` lub `{type}/{userId}/{timestamp}-{uuid}.{ext}`
- **Bucket**: Jeden główny bucket `uploads` z folderami per typ (uproszczona struktura)
- **Umowy**: Usuń pliki po X dni jeśli nie powiązane z żadnym rekordem
- **Encrypcja**: Supabase Storage domyślnie szyfruje at-rest

### Signed URLs

- **TTL**: 1 godzina dla publicznych, 24h dla prywatnych
- **Refresh mechanism**: Service generuje nowe URLs co 30 minut przed wygaśnięciem
- **Revocation**: Możliwość anuluji tokena jeśli user usunięty

---

## 7. Obsługa błędów

### Potencjalne błędy i strategie

| Scenariusz                 | Kod | Przyczyna                      | Strategia                             |
| -------------------------- | --- | ------------------------------ | ------------------------------------- |
| Brak tokenu JWT            | 401 | Użytkownik nie zalogowany      | Redirect do login                     |
| Plik za duży               | 413 | File > 5MB                     | Pokaż komunikat, zaproponuj kompresję |
| Nieobsługiwany typ MIME    | 415 | PNG, JPEG, WebP expected       | Pokaż listę obsługiwanych typów       |
| Plik pusty                 | 400 | Rozmiar = 0                    | Odrzuć, pokaż błąd                    |
| Błąd magicznych bajtów     | 400 | Rzeczywisty typ != deklarowany | Odrzuć, możliwy atak                  |
| Upload timeout (offline)   | 500 | Network timeout                | Queue locally, retry w tle            |
| Storage quota exceeded     | 429 | User/Org przekroczył limit     | Pokaż komunikat, zaproponuj cleanup   |
| Błąd kompresji             | 500 | Image manipulator crash        | Fallback do original, retry           |
| Corrupt file saved locally | 400 | Uszkodzony plik offline        | Usunąć, poprosić retry                |

### Logging błędów

- **Klient**: Error tracking do Sentry (upload failures, size exceeded)
- **Server**: Supabase Logs (quota exceeded, RLS denials)
- **Database**: `error_logs` table dla critical errors

---

## 8. Rozważania dotyczące wydajności

### Optymalizacje

1. **Compression on device**:
   - Use `expo-image-manipulator` lub `react-native-image-crop-picker`
   - Target 40-60% size reduction
   - Convert to WebP if supported (30% smaller than JPEG)

2. **Chunked upload** (dla dużych plików):
   - Podzielić na 1MB chunks
   - Parallelize 3 chunks jednocześnie
   - Resume capability w razie przerwania

3. **Caching signed URLs**:
   - Cache URLs w memory (1h TTL)
   - Reuse URLs dla tego samego pliku
   - Refresh mechanism co 30 minut

4. **Lazy loading images**:
   - Thumbnails zamiast full res w listach
   - Progressive loading (low res → high res)
   - Placeholder shimmer podczas ładowania

### Potencjalne wąskie gardła

| Wąskie gardło     | Przyczyna               | Rozwiązanie               |
| ----------------- | ----------------------- | ------------------------- |
| Duże obrazy       | Niekompresowane zdjęcia | Compression library       |
| Network timeout   | Słabe połączenie        | Chunked upload + retry    |
| Storage quota     | Zbyt dużo plików        | Archiving stare pliki     |
| Signed URL expiry | URLs zbyt krótko żyją   | Cache + refresh mechanism |
| Memory spike      | Pełny plik w RAM        | Streaming upload          |

### Metryki do monitorowania

- Upload success rate (target 99.5%)
- Average upload time (target < 5s)
- Compression ratio achieved (target 40-60%)
- Storage usage per user/type
- Signed URL cache hit rate

---

## 9. Kroki implementacji

### Faza 1: Setup - Typy, Walidacja, Model (1-2 godziny)

1. **Utwórz Upload model WatermelonDB**
   - Plik: `src/database/models/Upload.ts`
   - Pola: userId, organizationId (nullable), type, filename, mimeType, size, bucket, path, publicUrl, signedUrl, metadata, syncStatus

2. **Zdefiniuj DTO i typy**
   - Plik: `src/modules/core/types/uploadDto.ts`
   - Eksportuj: UploadFileDto, UploadResponseDto, UploadErrorDto

3. **Utwórz Zod schema**
   - Plik: `src/modules/core/validation/uploadValidation.ts`
   - Waliduj: file type, size, mime type

4. **Zregistruj model w database config**
   - Plik: `src/database/index.ts`
   - Dodaj Upload do schema

### Faza 2: Image Compression & Utilities (1 godzina)

1. **Zainstaluj dependencies**
   - `expo-image-manipulator` dla kompresji
   - `react-native-image-crop-picker` dla selectora

2. **Utwórz compression utility**
   - Plik: `src/modules/core/utils/imageCompression.ts`
   - Funkcja: `compressImage(file, targetSize): Promise<File>`
   - Obsłuż różne formaty i orientacje

3. **Utwórz file validation utility**
   - Plik: `src/modules/core/utils/fileValidation.ts`
   - Magic bytes check, MIME validation

### Faza 3: Service Layer (1-2 godziny)

1. **Utwórz upload service**
   - Plik: `src/modules/core/services/uploadService.ts`
   - Funkcje:
     - `uploadFile(dto)` - Main upload handler (global)
     - `uploadOffline(file)` - Queue to WatermelonDB
     - `uploadToSupabase(file, path)` - Direct to Storage
     - `generateSignedUrl(path)` - Create signed URL
     - `retryPendingUploads()` - Background sync

2. **Supabase Storage setup**
   - Utwórz bucket: `uploads`
   - Ustaw RLS policies (public read, auth write)

3. **Unit tests dla service**
   - File validation
   - Compression
   - Online/offline paths
   - Signed URL generation

### Faza 4: UI Components (1-2 godziny)

1. **Image picker component**
   - Plik: `src/modules/core/components/ImagePicker.tsx`
   - Camera + gallery support
   - Preview z progressem
   - Cancel/retry logic

2. **Upload progress component**
   - Plik: `src/modules/core/components/UploadProgress.tsx`
   - Progress bar
   - Offline indicator
   - Error display

3. **Image display component**
   - Plik: `src/modules/core/components/CachedImage.tsx`
   - Signed URL handling
   - URL refresh before expiry
   - Error fallback

### Faza 5: Background Sync & Offline (1 godzina)

1. **Implement offline upload queue**
   - WatermelonDB queuing
   - Local file caching
   - Retry with exponential backoff

2. **Background sync worker**
   - Monitor online status
   - Trigger on connectivity change
   - Handle failed uploads

3. **Cleanup strategy**
   - Remove local cached files after sync
   - Archive old uploads (>30 days)

### Faza 6: Integration (1 godzina)

1. **Integracja z CreateProduct**
   - Product form + image upload
   - Link Upload record to Product

2. **Integracja z avatar upload**
   - Profile settings
   - User avatar management

3. **Integracja z technique images**
   - Upload zdjęć technik przez studentów

### Faza 7: Testing & Documentation (1-2 godziny)

1. **Unit tests**
   - File validation
   - Compression
   - Service logic

2. **Integration tests**
   - Online upload flow
   - Offline queue flow
   - Sync mechanism

3. **E2E tests**
   - Pick image → Upload → Show in list
   - Offline → Add to queue → Sync when online

4. **API documentation**
   - Swagger/OpenAPI spec
   - Curl examples
   - Error codes reference

### Faza 8: Performance & Security Review (1 godzina)

1. **Security audit**
   - RLS policies check
   - Magic bytes validation
   - XSS prevention (URLs)

2. **Performance testing**
   - Benchmark compression
   - Upload speed (various file sizes)
   - Memory profiling

3. **Monitoring setup**
   - Upload success tracking
   - Performance metrics
   - Error logging

---

## Podsumowanie ścieżki implementacji

```
┌─────────────────────────────────────────────────────────────┐
│  Faza 1: Types, Validation, Model (DTO, Zod, WatermelonDB) │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 2: Image Compression & File Utilities                 │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 3: Service Layer (Upload, Sync, Supabase Storage)     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 4: UI Components (ImagePicker, Progress, Cached)      │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 5: Background Sync & Offline Queue (WatermelonDB)     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 6: Integration (Products, Avatars, Training Plans)    │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 7: Testing & Documentation (Unit, E2E, Docs)          │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Faza 8: Performance & Security Review (Audit, Profile)     │
└─────────────────────────────────────────────────────────────┘
```

**Całkowity czas**: 8-16 godzin (w zależności od testów i integracji)

---

## Dodatkowe rekomendacje

### Dependencies do zainstalowania

```json
{
  "dependencies": {
    "expo-image-manipulator": "^11.3.0",
    "react-native-image-crop-picker": "^0.40.0",
    "@react-native-async-storage/async-storage": "^1.21.0"
  }
}
```

### Environment Variables

```bash
SUPABASE_STORAGE_BUCKET=uploads
UPLOAD_MAX_FILE_SIZE=5242880 # 5MB in bytes
UPLOAD_SIGNED_URL_TTL=3600 # 1 hour in seconds
```

### Monitoring & Analytics

- Track: upload success rate, average upload time, compression ratio
- Alert on: quota exceeded, RLS denials, corruption errors
- Dashboard: Upload trends per organization, popular file types
