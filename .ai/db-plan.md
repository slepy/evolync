# Schemat Bazy Danych Evolync (PostgreSQL + WatermelonDB)

Ten dokument definiuje schemat bazy danych dla aplikacji Evolync, zaprojektowany z myślą o architekturze offline-first (WatermelonDB), synchronizacji z Supabase oraz wymaganiach funkcjonalnych zdefiniowanych w PRD.

## 1. Typy Danych (ENUMs)

```sql
CREATE TYPE member_status AS ENUM ('pending', 'active', 'archived', 'rejected');
CREATE TYPE priority_level AS ENUM ('normal', 'high');
CREATE TYPE order_status AS ENUM ('placed', 'processing', 'ready_for_pickup', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'other');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused');
```

## 2. Tabele

Wszystkie tabele zawierają kolumny wymagane przez WatermelonDB: `id` (UUID), `created_at`, `updated_at`, `deleted_at`.

### 2.1. Użytkownicy i Organizacje

#### `organizations`

Główna jednostka grupująca zasoby. Tworzona automatycznie dla Instruktora (Ownera).

| Kolumna      | Typ         | Ograniczenia                  | Opis                   |
| ------------ | ----------- | ----------------------------- | ---------------------- |
| `id`         | UUID        | PK, DEFAULT gen_random_uuid() |                        |
| `owner_id`   | UUID        | FK -> auth.users.id, NOT NULL | Właściciel organizacji |
| `name`       | TEXT        | NOT NULL                      | Nazwa organizacji      |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW()                 |                        |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW()                 |                        |
| `deleted_at` | TIMESTAMPTZ |                               |                        |

#### `organization_roles`

Role definiowane w ramach organizacji (np. Instruktor, Student).

| Kolumna             | Typ         | Ograniczenia                     | Opis               |
| ------------------- | ----------- | -------------------------------- | ------------------ |
| `id`                | UUID        | PK, DEFAULT gen_random_uuid()    |                    |
| `organization_id`   | UUID        | FK -> organizations.id, NOT NULL |                    |
| `name`              | TEXT        | NOT NULL                         | Nazwa roli         |
| `is_system_default` | BOOLEAN     | DEFAULT false                    | Czy rola systemowa |
| `created_at`        | TIMESTAMPTZ | DEFAULT NOW()                    |                    |
| `updated_at`        | TIMESTAMPTZ | DEFAULT NOW()                    |                    |
| `deleted_at`        | TIMESTAMPTZ |                                  |                    |

#### `schools`

Szkoły należące do organizacji.

| Kolumna           | Typ         | Ograniczenia                     | Opis           |
| ----------------- | ----------- | -------------------------------- | -------------- |
| `id`              | UUID        | PK, DEFAULT gen_random_uuid()    |                |
| `organization_id` | UUID        | FK -> organizations.id, NOT NULL |                |
| `name`            | TEXT        | NOT NULL                         | Nazwa szkoły   |
| `address`         | TEXT        |                                  | Adres fizyczny |
| `created_at`      | TIMESTAMPTZ | DEFAULT NOW()                    |                |
| `updated_at`      | TIMESTAMPTZ | DEFAULT NOW()                    |                |
| `deleted_at`      | TIMESTAMPTZ |                                  |                |

#### `school_invites`

Kody zaproszeń do szkół.

| Kolumna      | Typ         | Ograniczenia                  | Opis                    |
| ------------ | ----------- | ----------------------------- | ----------------------- |
| `id`         | UUID        | PK, DEFAULT gen_random_uuid() |                         |
| `school_id`  | UUID        | FK -> schools.id, NOT NULL    |                         |
| `role_id`    | UUID        | FK -> organization_roles.id   | Rola przypisywana kodem |
| `code`       | TEXT        | UNIQUE, NOT NULL              | Kod dla studentów       |
| `expires_at` | TIMESTAMPTZ | NOT NULL                      | Data ważności kodu      |
| `created_by` | UUID        | FK -> auth.users.id           | Kto wygenerował kod     |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW()                 |                         |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW()                 |                         |
| `deleted_at` | TIMESTAMPTZ |                               |                         |

#### `school_members`

Łączy studentów ze szkołami. Obsługuje użytkowników aplikacji oraz "Shadow Users" (bez konta).

| Kolumna        | Typ           | Ograniczenia                  | Opis                      |
| -------------- | ------------- | ----------------------------- | ------------------------- |
| `id`           | UUID          | PK, DEFAULT gen_random_uuid() |                           |
| `school_id`    | UUID          | FK -> schools.id, NOT NULL    |                           |
| `user_id`      | UUID          | FK -> auth.users.id, NULLABLE | Student (jeśli ma konto)  |
| `role_id`      | UUID          | FK -> organization_roles.id   | Rola w szkole             |
| `display_name` | TEXT          |                               | Nazwa (Shadow lub Cache)  |
| `email`        | TEXT          |                               | Email do powiązania konta |
| `status`       | member_status | DEFAULT 'pending'             | Status członkostwa        |
| `joined_at`    | TIMESTAMPTZ   | DEFAULT NOW()                 | Data dołączenia           |
| `created_at`   | TIMESTAMPTZ   | DEFAULT NOW()                 |                           |
| `updated_at`   | TIMESTAMPTZ   | DEFAULT NOW()                 |                           |
| `deleted_at`   | TIMESTAMPTZ   |                               |                           |

### 2.2. Silnik 3D (Core)

Zasoby 3D są prywatne dla twórcy (User).

#### `body_pose_presets` (Biblioteka póz)

Zbiór predefiniowanych ustawień dla dłoni i stóp (np. "Pięść", "Otwarta dłoń"). Służy jako źródło danych do kopiowania przy tworzeniu technik.

| Kolumna          | Typ         | Ograniczenia                  | Opis                       |
| ---------------- | ----------- | ----------------------------- | -------------------------- |
| `id`             | UUID        | PK, DEFAULT gen_random_uuid() |                            |
| `name`           | TEXT        | NOT NULL                      | Nazwa presetu              |
| `body_part_type` | TEXT        | NOT NULL                      | 'hand' lub 'foot'          |
| `data`           | JSONB       | NOT NULL                      | Konfiguracja (kąty palców) |
| `is_system`      | BOOLEAN     | DEFAULT false                 | Czy preset systemowy       |
| `created_at`     | TIMESTAMPTZ | DEFAULT NOW()                 |                            |
| `updated_at`     | TIMESTAMPTZ | DEFAULT NOW()                 |                            |
| `deleted_at`     | TIMESTAMPTZ |                               |                            |

#### `techniques` (Atom)

Pojedyncze ustawienie dla konkretnej części ciała. Zawiera skopiowane dane z presetu (jeśli użyto) lub własne ustawienia.

| Kolumna       | Typ         | Ograniczenia                  | Opis                                                  |
| ------------- | ----------- | ----------------------------- | ----------------------------------------------------- |
| `id`          | UUID        | PK, DEFAULT gen_random_uuid() |                                                       |
| `user_id`     | UUID        | FK -> auth.users.id, NOT NULL | Twórca                                                |
| `title`       | TEXT        | NOT NULL                      | Nazwa techniki                                        |
| `description` | TEXT        |                               | Opcjonalny opis                                       |
| `body_part`   | TEXT        | NOT NULL                      | Np. 'left_arm', 'right_hand'                          |
| `data`        | JSONB       | NOT NULL                      | Kompletny snapshot elementu (pozycja, rotacja, palce) |
| `created_at`  | TIMESTAMPTZ | DEFAULT NOW()                 |                                                       |
| `updated_at`  | TIMESTAMPTZ | DEFAULT NOW()                 |                                                       |
| `deleted_at`  | TIMESTAMPTZ |                               |                                                       |

#### `sequences`

Sekwencja ruchów.

| Kolumna           | Typ         | Ograniczenia                  | Opis                                          |
| ----------------- | ----------- | ----------------------------- | --------------------------------------------- |
| `id`              | UUID        | PK, DEFAULT gen_random_uuid() |                                               |
| `user_id`         | UUID        | FK -> auth.users.id, NOT NULL | Twórca                                        |
| `title`           | TEXT        | NOT NULL                      | Tytuł sekwencji                               |
| `description`     | TEXT        |                               | Opis publiczny                                |
| `cover_image_url` | TEXT        |                               | URL do wygenerowanego zrzutu ekranu (okładki) |
| `created_at`      | TIMESTAMPTZ | DEFAULT NOW()                 |                                               |
| `updated_at`      | TIMESTAMPTZ | DEFAULT NOW()                 |                                               |
| `deleted_at`      | TIMESTAMPTZ |                               |                                               |

#### `sequence_steps` (Krok - Snapshot)

Pojedynczy krok w sekwencji (klatka kluczowa). Przechowuje pełny stan sceny (snapshot) oraz odniesienia do technik.

| Kolumna       | Typ         | Ograniczenia                          | Opis                                      |
| ------------- | ----------- | ------------------------------------- | ----------------------------------------- |
| `id`          | UUID        | PK, DEFAULT gen_random_uuid()         |                                           |
| `sequence_id` | UUID        | FK -> sequences.id, ON DELETE CASCADE |                                           |
| `order_index` | INTEGER     | NOT NULL                              | Kolejność w sekwencji                     |
| `duration_ms` | INTEGER     | DEFAULT 0                             | Czas trwania kroku                        |
| `data`        | JSONB       |                                       | Pełny stan modelu/sceny (wszystkie kości) |
| `created_at`  | TIMESTAMPTZ | DEFAULT NOW()                         |                                           |
| `updated_at`  | TIMESTAMPTZ | DEFAULT NOW()                         |                                           |
| `deleted_at`  | TIMESTAMPTZ |                                       |                                           |

#### `step_techniques`

Tabela łącząca Krok z Technikami (składanie pozy z atomów). Służy do edycji i śledzenia użytych technik.

| Kolumna         | Typ         | Ograniczenia                               | Opis                            |
| --------------- | ----------- | ------------------------------------------ | ------------------------------- |
| `id`            | UUID        | PK, DEFAULT gen_random_uuid()              |                                 |
| `step_id`       | UUID        | FK -> sequence_steps.id, ON DELETE CASCADE |                                 |
| `technique_id`  | UUID        | FK -> techniques.id                        |                                 |
| `model_slot`    | INTEGER     | DEFAULT 0                                  | Slot modelu (0=Main, 1=Partner) |
| `root_position` | JSONB       | DEFAULT '{"x":0,"y":0,"z":0}'              | Pozycja modelu w scenie         |
| `root_rotation` | JSONB       | DEFAULT '{"x":0,"y":0,"z":0,"w":1}'        | Rotacja modelu w scenie         |
| `created_at`    | TIMESTAMPTZ | DEFAULT NOW()                              |                                 |
| `updated_at`    | TIMESTAMPTZ | DEFAULT NOW()                              |                                 |
| `deleted_at`    | TIMESTAMPTZ |                                            |                                 |

#### `training_plans`

Plan treningowy składający się z sekwencji.

| Kolumna       | Typ         | Ograniczenia                  | Opis        |
| ------------- | ----------- | ----------------------------- | ----------- |
| `id`          | UUID        | PK, DEFAULT gen_random_uuid() |             |
| `user_id`     | UUID        | FK -> auth.users.id, NOT NULL | Twórca      |
| `title`       | TEXT        | NOT NULL                      | Tytuł planu |
| `description` | TEXT        |                               |             |
| `created_at`  | TIMESTAMPTZ | DEFAULT NOW()                 |             |
| `updated_at`  | TIMESTAMPTZ | DEFAULT NOW()                 |             |
| `deleted_at`  | TIMESTAMPTZ |                               |             |

#### `plan_sequences`

Tabela łącząca Plan z Sekwencjami.

| Kolumna            | Typ         | Ograniczenia                               | Opis               |
| ------------------ | ----------- | ------------------------------------------ | ------------------ |
| `id`               | UUID        | PK, DEFAULT gen_random_uuid()              |                    |
| `training_plan_id` | UUID        | FK -> training_plans.id, ON DELETE CASCADE |                    |
| `sequence_id`      | UUID        | FK -> sequences.id                         |                    |
| `order_index`      | INTEGER     | NOT NULL                                   | Kolejność w planie |
| `created_at`       | TIMESTAMPTZ | DEFAULT NOW()                              |                    |
| `updated_at`       | TIMESTAMPTZ | DEFAULT NOW()                              |                    |
| `deleted_at`       | TIMESTAMPTZ |                                            |                    |

### 2.3. Polimorfizm (Tagi i Komentarze)

#### `tags`

| Kolumna      | Typ         | Ograniczenia                  | Opis            |
| ------------ | ----------- | ----------------------------- | --------------- |
| `id`         | UUID        | PK, DEFAULT gen_random_uuid() |                 |
| `user_id`    | UUID        | FK -> auth.users.id, NOT NULL | Właściciel tagu |
| `name`       | TEXT        | NOT NULL                      | Nazwa tagu      |
| `color`      | TEXT        |                               | Kolor HEX       |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW()                 |                 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW()                 |                 |
| `deleted_at` | TIMESTAMPTZ |                               |                 |

#### `taggables`

| Kolumna         | Typ         | Ograniczenia                                       | Opis                   |
| --------------- | ----------- | -------------------------------------------------- | ---------------------- |
| `id`            | UUID        | PK, DEFAULT gen_random_uuid()                      |                        |
| `tag_id`        | UUID        | FK -> tags.id, ON DELETE CASCADE                   |                        |
| `taggable_id`   | UUID        | NOT NULL                                           | ID otagowanego obiektu |
| `taggable_type` | TEXT        | CHECK IN ('technique', 'sequence', 'step', 'plan') | Typ obiektu            |
| `created_at`    | TIMESTAMPTZ | DEFAULT NOW()                                      |                        |
| `updated_at`    | TIMESTAMPTZ | DEFAULT NOW()                                      |                        |
| `deleted_at`    | TIMESTAMPTZ |                                                    |                        |

#### `comments`

| Kolumna            | Typ         | Ograniczenia                                       | Opis                     |
| ------------------ | ----------- | -------------------------------------------------- | ------------------------ |
| `id`               | UUID        | PK, DEFAULT gen_random_uuid()                      |                          |
| `user_id`          | UUID        | FK -> auth.users.id, NOT NULL                      | Autor                    |
| `content`          | TEXT        | NOT NULL                                           | Treść komentarza         |
| `commentable_id`   | UUID        | NOT NULL                                           | ID komentowanego obiektu |
| `commentable_type` | TEXT        | CHECK IN ('technique', 'sequence', 'step', 'plan') | Typ obiektu              |
| `created_at`       | TIMESTAMPTZ | DEFAULT NOW()                                      |                          |
| `updated_at`       | TIMESTAMPTZ | DEFAULT NOW()                                      |                          |
| `deleted_at`       | TIMESTAMPTZ |                                                    |                          |

### 2.4. E-commerce i Magazyn

#### `products`

Produkty są globalne dla organizacji. Każdy produkt posiada co najmniej jeden wariant (np. "Standard").

| Kolumna           | Typ         | Ograniczenia                     | Opis           |
| ----------------- | ----------- | -------------------------------- | -------------- |
| `id`              | UUID        | PK, DEFAULT gen_random_uuid()    |                |
| `organization_id` | UUID        | FK -> organizations.id, NOT NULL |                |
| `name`            | TEXT        | NOT NULL                         | Nazwa produktu |
| `description`     | TEXT        |                                  |                |
| `image_url`       | TEXT        |                                  |                |
| `created_at`      | TIMESTAMPTZ | DEFAULT NOW()                    |                |
| `updated_at`      | TIMESTAMPTZ | DEFAULT NOW()                    |                |
| `deleted_at`      | TIMESTAMPTZ |                                  |                |

#### `product_variants`

Warianty produktu (np. rozmiary, kolory). Jeśli produkt nie ma wariantów, tworzony jest jeden domyślny.

| Kolumna          | Typ           | Ograniczenia                                   | Opis                                  |
| ---------------- | ------------- | ---------------------------------------------- | ------------------------------------- |
| `id`             | UUID          | PK, DEFAULT gen_random_uuid()                  |                                       |
| `product_id`     | UUID          | FK -> products.id, ON DELETE CASCADE, NOT NULL |                                       |
| `name`           | TEXT          | NOT NULL                                       | Nazwa wariantu (np. "XL", "Standard") |
| `price`          | NUMERIC(10,2) | NOT NULL, DEFAULT 0                            | Cena                                  |
| `currency`       | TEXT          | DEFAULT 'PLN'                                  | Waluta (ISO 4217)                     |
| `stock_quantity` | INTEGER       | NOT NULL, DEFAULT 0                            | Stan magazynowy                       |
| `created_at`     | TIMESTAMPTZ   | DEFAULT NOW()                                  |                                       |
| `updated_at`     | TIMESTAMPTZ   | DEFAULT NOW()                                  |                                       |
| `deleted_at`     | TIMESTAMPTZ   |                                                |                                       |

#### `orders`

Zamówienia składane przez studentów w ramach szkoły.

| Kolumna            | Typ          | Ograniczenia                      | Opis                  |
| ------------------ | ------------ | --------------------------------- | --------------------- |
| `id`               | UUID         | PK, DEFAULT gen_random_uuid()     |                       |
| `school_id`        | UUID         | FK -> schools.id, NOT NULL        |                       |
| `school_member_id` | UUID         | FK -> school_members.id, NOT NULL | Zamawiający (Członek) |
| `status`           | order_status | DEFAULT 'placed'                  |                       |
| `created_at`       | TIMESTAMPTZ  | DEFAULT NOW()                     |                       |
| `updated_at`       | TIMESTAMPTZ  | DEFAULT NOW()                     |                       |
| `deleted_at`       | TIMESTAMPTZ  |                                   |                       |

#### `order_items`

| Kolumna              | Typ           | Ograniczenia                       | Opis                   |
| -------------------- | ------------- | ---------------------------------- | ---------------------- |
| `id`                 | UUID          | PK, DEFAULT gen_random_uuid()      |                        |
| `order_id`           | UUID          | FK -> orders.id, ON DELETE CASCADE |                        |
| `product_variant_id` | UUID          | FK -> product_variants.id          | Zakupiony wariant      |
| `quantity`           | INTEGER       | NOT NULL, DEFAULT 1                | Ilość                  |
| `unit_price`         | NUMERIC(10,2) | NOT NULL                           | Cena w momencie zakupu |
| `currency`           | TEXT          | DEFAULT 'PLN'                      | Waluta ceny (ISO 4217) |
| `created_at`         | TIMESTAMPTZ   | DEFAULT NOW()                      |                        |
| `updated_at`         | TIMESTAMPTZ   | DEFAULT NOW()                      |                        |
| `deleted_at`         | TIMESTAMPTZ   |                                    |                        |

### 2.5. Finanse i Obecność

#### `payments`

Rejestr wpłat (brak procesowania online).

| Kolumna            | Typ            | Ograniczenia                      | Opis                       |
| ------------------ | -------------- | --------------------------------- | -------------------------- |
| `id`               | UUID           | PK, DEFAULT gen_random_uuid()     |                            |
| `school_id`        | UUID           | FK -> schools.id, NOT NULL        |                            |
| `school_member_id` | UUID           | FK -> school_members.id, NOT NULL | Płacący (Członek)          |
| `amount`           | NUMERIC(10,2)  | NOT NULL                          | Kwota                      |
| `currency`         | TEXT           | DEFAULT 'PLN'                     |                            |
| `period_start`     | DATE           |                                   | Początek okresu opłaconego |
| `period_end`       | DATE           |                                   | Koniec okresu opłaconego   |
| `status`           | payment_status | DEFAULT 'pending'                 |                            |
| `payment_date`     | TIMESTAMPTZ    |                                   | Data faktycznej wpłaty     |
| `method`           | payment_method | DEFAULT 'cash'                    | Sposób płatności           |
| `created_at`       | TIMESTAMPTZ    | DEFAULT NOW()                     |                            |
| `updated_at`       | TIMESTAMPTZ    | DEFAULT NOW()                     |                            |
| `deleted_at`       | TIMESTAMPTZ    |                                   |                            |

#### `attendance`

| Kolumna            | Typ               | Ograniczenia                      | Opis              |
| ------------------ | ----------------- | --------------------------------- | ----------------- |
| `id`               | UUID              | PK, DEFAULT gen_random_uuid()     |                   |
| `school_id`        | UUID              | FK -> schools.id, NOT NULL        |                   |
| `school_member_id` | UUID              | FK -> school_members.id, NOT NULL | Student (Członek) |
| `date`             | DATE              | NOT NULL                          | Data treningu     |
| `status`           | attendance_status | DEFAULT 'absent'                  |                   |
| `created_at`       | TIMESTAMPTZ       | DEFAULT NOW()                     |                   |
| `updated_at`       | TIMESTAMPTZ       | DEFAULT NOW()                     |                   |
| `deleted_at`       | TIMESTAMPTZ       |                                   |                   |

### 2.6. Komunikacja

#### `announcements`

| Kolumna      | Typ            | Ograniczenia                  | Opis       |
| ------------ | -------------- | ----------------------------- | ---------- |
| `id`         | UUID           | PK, DEFAULT gen_random_uuid() |            |
| `school_id`  | UUID           | FK -> schools.id, NOT NULL    |            |
| `author_id`  | UUID           | FK -> profiles.id, NOT NULL   | Instruktor |
| `title`      | TEXT           | NOT NULL                      |            |
| `content`    | TEXT           | NOT NULL                      |            |
| `priority`   | priority_level | DEFAULT 'normal'              |            |
| `created_at` | TIMESTAMPTZ    | DEFAULT NOW()                 |            |
| `updated_at` | TIMESTAMPTZ    | DEFAULT NOW()                 |            |
| `deleted_at` | TIMESTAMPTZ    |                               |            |

#### `announcement_reads`

Śledzenie przeczytania ogłoszeń.

| Kolumna           | Typ         | Ograniczenia                              | Opis      |
| ----------------- | ----------- | ----------------------------------------- | --------- |
| `id`              | UUID        | PK, DEFAULT gen_random_uuid()             |           |
| `announcement_id` | UUID        | FK -> announcements.id, ON DELETE CASCADE |           |
| `user_id`         | UUID        | FK -> profiles.id, NOT NULL               | Czytelnik |
| `read_at`         | TIMESTAMPTZ | DEFAULT NOW()                             |           |
| `created_at`      | TIMESTAMPTZ | DEFAULT NOW()                             |           |
| `updated_at`      | TIMESTAMPTZ | DEFAULT NOW()                             |           |
| `deleted_at`      | TIMESTAMPTZ |                                           |           |

## 3. Indeksy

Dla zapewnienia wydajności synchronizacji i zapytań, należy utworzyć następujące indeksy:

1. **Klucze Obce:** Indeksy na wszystkich kolumnach `*_id` (np. `organization_id`, `school_id`, `user_id`).
2. **WatermelonDB Sync:** Indeksy na kolumnie `updated_at` dla każdej tabeli (krytyczne dla synchronizacji "pull changes").
3. **Polimorfizm:** Indeksy złożone `(taggable_type, taggable_id)` oraz `(commentable_type, commentable_id)`.
4. **Logika Biznesowa:**
   - `school_invites(code)`
   - `attendance(school_id, date)`
   - `payments(user_id, period_end)`

## 4. Row Level Security (RLS)

Polityki bezpieczeństwa muszą uwzględniać hierarchię Organizacji i prywatność zasobów.

1. **Profiles:**
   - `SELECT`: Publiczne (lub ograniczone do członków tej samej organizacji/szkoły).
   - `UPDATE`: Tylko właściciel rekordu (`auth.uid() = id`).

2. **Organizations:**
   - `ALL`: Tylko dla `owner_id`.
   - `SELECT`: Dla członków szkół należących do organizacji.

3. **Schools:**
   - `ALL`: Dla właściciela organizacji.
   - `SELECT`: Dla członków szkoły (`school_members`).

4. **Zasoby 3D (Techniques, Sequences, Plans) oraz Tagi i Komentarze:**
   - `ALL`: Tylko dla twórcy (`user_id = auth.uid()`).
   - Zasoby są prywatne i przypisane do użytkownika.

5. **Products:**
   - `ALL`: Właściciel organizacji.
   - `SELECT`: Wszyscy członkowie szkół w organizacji.

6. **Orders, Payments, Attendance:**
   - `SELECT`: Właściciel organizacji (wszystkie) ORAZ Student (tylko swoje).
   - `INSERT/UPDATE`: Odpowiednio do uprawnień (Student może złożyć zamówienie, Instruktor edytuje status).

## 5. Dodatkowe Uwagi

1. **Triggery Automatyzacji:**
   - `after_signup`: Trigger na `auth.users`, który tworzy rekord w `profiles`.
   - `create_organization`: Trigger, który po utworzeniu profilu z rolą 'instructor'/'owner' tworzy domyślną `organization`.

2. **Synchronizacja:**
   - Wszystkie zapytania synchronizacyjne muszą filtrować po `deleted_at IS NULL` (chyba że pobieramy usunięte do synchronizacji).
   - Konflikty rozwiązywane strategią "Last Write Wins" po stronie klienta lub serwera (zależnie od implementacji WatermelonDB Sync Adapter).

3. **Walidacja:**
   - Wartości `NUMERIC` dla cen i kwot powinny być dodatnie (`CHECK (amount >= 0)`).
   - `stock_quantity` nie może być ujemne (`CHECK (stock_quantity >= 0)`).
