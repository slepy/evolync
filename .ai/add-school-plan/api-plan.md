# API Endpoint Implementation Plan: School Creation (Offline-First)

## 1. Przegląd punktu końcowego

Punkt końcowy (w rozumieniu architektury offline-first) obsługuje tworzenie nowej szkoły przez Właściciela (Owner). Proces rozpoczyna się od lokalnego utworzenia rekordu w WatermelonDB, a następnie zostaje zsynchronizowany z serwerem Supabase poprzez mechanizm synchronizacji w tle.

Celem jest umożliwienie instruktorom dodawania nowych lokalizacji/szkół do swojej organizacji, nawet bez dostępu do Internetu. Z perspektywy backendu Supabase, operacja ta jest standardowym żądaniem `POST` (lub batchowym insertem) do zasobu `schools`, zabezpieczonym politykami RLS.

## 2. Szczegóły żądania

Ponieważ komunikacja odbywa się głównie przez WatermelonDB Sync Adapter, "żądanie" jest reprezentowane przez strukturę danych wysyłaną w procesie PUSH.

- **Metoda HTTP:** `POST` (realizowane automatycznie przez Supabase Client/Sync)
- **Struktura URL:** `/rest/v1/schools` (REST API Supabase)
- **Parametry (pola rekordu):**
  - **Wymagane:**
    - `id` (UUID v4) - generowane przez klienta przed zapisem.
    - `organization_id` (UUID) - ID organizacji, do której należy szkoła.
    - `name` (TEXT) - nazwa szkoły.
  - **Opcjonalne:**
    - `address` (TEXT) - adres fizyczny szkoły (może być null).
    - `created_at` (TIMESTAMPTZ) - czas utworzenia lokalnego.
    - `updated_at` (TIMESTAMPTZ) - czas ostatniej modyfikacji.

## 3. Wykorzystywane typy

### DTO (Data Transfer Object)

Obiekt używany w warstwie aplikacji (np. `SchoolFormValues`):

```typescript
export interface CreateSchoolDto {
  name: string;
  address?: string | null;
  // organization_id jest pobierane z kontekstu sesji/użytkownika
}
```

### Typy Bazy Danych (Supabase & WatermelonDB)

```typescript
// src/database/models/School.ts (WatermelonDB Model)
export interface SchoolModel {
  id: string;
  organization_id: string;
  name: string;
  address?: string;
  created_at: number; // WatermelonDB używa timestampów jako number
  updated_at: number;
}
```

### Command Model

Argumenty dla serwisu tworzącego szkołę:

```typescript
interface CreateSchoolCommand {
  organizationId: string;
  data: CreateSchoolDto;
}
```

## 4. Szczegóły odpowiedzi

W modelu Offline-First odpowiedź natychmiastowa dla UI pochodzi z lokalnej bazy danych. Odpowiedź serwera (podczas synchronizacji) jest asynchroniczna.

### Synchronizacja Sukces

- **Kod statusu:** `201 Created`
- **Body:** Zwraca utworzony rekord (potwierdzenie zapisu).

### Synchronizacja Błąd

Jeśli wystąpi błąd podczas push (np. naruszenie RLS), rekord lokalny może zostać oznaczony jako wymagający korekty (status `sync_status: error` - zależnie od implementacji adaptera).

## 5. Przepływ danych

1. **UI Formularz:** Użytkownik wypełnia formularz (np. w `src/modules/organization/screens/CreateSchool.tsx`).
2. **Walidacja Lokalna:** Zod sprawdza poprawność danych (długość nazwy, itp.).
3. **Generowanie ID:** Klient generuje UUID v4.
4. **Zapis Lokalny:** Serwis `SchoolService` zapisuje nowy model `School` w WatermelonDB używając `database.write()`.
   - **Stan:** UI aktualizuje się natychmiast (Optimistic UI) dzięki obserwatorom WatermelonDB.
5. **Synchronizacja (Tło):**
   - WatermelonDB Sync Adapter wykrywa nowy rekord.
   - Wysyła żądanie `POST /schools` do Supabase.
6. **Backend (Supabase):**
   - Postgres sprawdza constrainty (typy, not null).
   - **RLS Policy** weryfikuje, czy użytkownik próbuje dodać szkołę do swojej organizacji.
   - Rekord zostaje zapisany.

## 6. Względy bezpieczeństwa

### Authentication

- Użytkownik musi być zalogowany (Supabase Auth). Token JWT jest dołączany do żądania synchronizacji.

### Authorization (Row Level Security - RLS)

Kluczowy element bezpieczeństwa w Supabase.

**Polityka INSERT dla `schools`:**

Istniejąca polityka (zdefiniowana w `20260105000000_init_schema.sql`):

```sql
create policy "Schools are manageable by organization owner"
  on public.schools for all
  to authenticated
  using (public.is_org_owner(organization_id));
```

*Opis: Ta polityka (dzięki klauzuli `FOR ALL`) pokrywa również operacje `INSERT`. Funkcja `is_org_owner` sprawdza, czy `organization_id` wstawianego rekordu należy do użytkownika (owner_id).*

NB: URL API to standardowy endpoint REST Supabase: `/rest/v1/schools`

### Walidacja Danych

- **Sanityzacja:** Supabase automatycznie sanityzuje input SQL.
- **Typy:** TypeScript gwarantuje zgodność typów po stronie klienta, Postgres po stronie serwera.

## 7. Obsługa błędów

| Scenariusz | Kod (Sync/HTTP) | Działanie Aplikacji |
|---|---|---|
| Nieprawidłowe dane (Walidacja) | N/A (Client-side) | Blokada formularza, wyświetlenie błędu Zod. |
| Brak uprawnień (BOLA) | 403 Forbidden | Sync Adapter loguje błąd. W przyszłości implementacja "Dead Letter Queue" dla rekordów, których nie da się zsynchronizować. |
| Konflikt UUID | 409 Conflict | Ekstremalnie mało prawdopodobne dla UUID v4. Sync adapter może spróbować ponowić (choć przy create jest to trudne). |
| Brak Internetu | Network Error | Sync Adapter wstrzymuje kolejkę i ponawia próbę po odzyskaniu połączenia. Użytkownik nie widzi błędu. |

## 8. Rozważania dotyczące wydajności

- **Batching:** Jeśli tworzone jest wiele szkół naraz (np. import), Sync Adapter powinien wysyłać je w jednej transakcji.
- **Indeksy:** Upewnić się, że kolumna `organization_id` w tabeli `schools` jest zindeksowana (FK zazwyczaj są, ale warto sprawdzić) dla szybkiego sprawdzania RLS.

## 9. Etapy wdrożenia

### Krok 1: Weryfikacja Bazy Danych (Supabase)

1. Sprawdzenie istnienia tabeli `schools` w migracji `20260105000000_init_schema.sql`.
2. Potwierdzenie obecności polityki RLS `"Schools are manageable by organization owner"`.
3. Jeśli tabela/polityka już istnieje (co potwierdzono w analizie), ten krok ogranicza się do weryfikacji manualnej.

### Krok 2: Definicja Modelu WatermelonDB

1. Utworzenie/Aktualizacja `src/database/schema.ts` - dodanie tabeli `schools`.
2. Utworzenie modelu `src/database/models/School.ts`.
3. Rejestracja modelu w `src/database/index.ts`.

### Krok 3: Logika Biznesowa (Moduł Organization)

1. Utworzenie schematu walidacji Zod: `src/modules/organization/validation/schoolSchema.ts`.
2. Utworzenie serwisu: `src/modules/organization/services/schoolService.ts` z metodą `createSchool`.
   - Pobranie `organizationId` dla aktualnego użytkownika.
   - Wywołanie `database.write`.

### Krok 4: Interfejs Użytkownika

1. Stworzenie formularza dodawania szkoły.
2. Podpięcie `react-hook-form` z resolverem Zod.
3. Obsługa przycisku "Zapisz" wywołującego serwis.

### Krok 5: Weryfikacja Synchronizacji

1. Uruchomienie aplikacji.
2. Utworzenie szkoły przy wyłączonym Internecie (sprawdzenie UI).
3. Włączenie Internetu.
4. Sprawdzenie w dashboardzie Supabase, czy rekord się pojawił.
