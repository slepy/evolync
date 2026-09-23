# API Endpoint Implementation Plan: Get Organization Details

## 1. Przegląd punktu końcowego

Punkt końcowy `GET /rpc/get_organization` służy do pobierania szczegółowych informacji o organizacji. Jest to kluczowy endpoint dla panelu instruktora oraz widoku dashboardu, pozwalający na załadowanie kontekstu organizacji (nazwa, właściciel) po zalogowaniu. Implementacja opiera się na **PostgreSQL Function** (RPC) w Supabase.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET` (W kontekście wywołania Supabase JS Client może to być `rpc('get_organization',Params)` co pod spodem może używać POST, ale logicznie jest to odczyt). Funkcja SQL zostanie oznaczona jako `STABLE`, aby umożliwić wywołania HTTP GET.
- **Struktura URL:** `/rest/v1/rpc/get_organization?organization_id=WARTOŚĆ`
- **Parametry:**
  - **Wymagane:**
    - `organization_id` (UUID): Unikalny identyfikator organizacji.
  - **Opcjonalne:** Brak.
- **Request Body:** Brak (parametry przekazywane w Query String dla GET lub Body dla POST w SDK).

## 3. Wykorzystywane typy

### DTO (Data Transfer Objects)

**TypeScript Interface (Client-side):**

```typescript
interface GetOrganizationParams {
  organization_id: string; // UUID
}

interface OrganizationDetailsDto {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  // Opcjonalnie: czy bieżący użytkownik jest właścicielem
  is_owner: boolean; 
}
```

**Database Return Type:**
Funkcja zwróci format JSON lub tabelaryczny odpowiadający strukturze `OrganizationDetailsDto`.

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

Zwraca obiekt JSON z danymi organizacji.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Cobra Kai Dojo",
  "owner_id": "user-uuid-123",
  "created_at": "2026-01-01T12:00:00Z",
  " ": true
}
```

### Kody statusu

- **200 OK:** Pomyślnie pobrano dane.
- **400 Bad Request:** Nieprawidłowy format `organization_id` (nie jest UUID).
- **401 Unauthorized:** Użytkownik nie jest zalogowany (`auth.uid()` jest null).
- **403 Forbidden:** Użytkownik jest zalogowany, ale nie ma dostępu do tej organizacji (nie jest właścicielem ani członkiem żadnej szkoły w tej organizacji).
- **404 Not Found:** Organizacja o podanym ID nie istnieje.

## 5. Przepływ danych

1. **Klient (App)** -> Wywołuje `supabase.rpc('get_organization', { organization_id: '...' })`.
2. **Supabase Auth** -> Weryfikuje token JWT, ustawia `auth.uid()`.
3. **PostgreSQL (RPC Function)**:
    - Pobiera parametr `organization_id`.
    - Sprawdza istnienie organizacji.
    - **Autoryzacja:** Sprawdza, czy `auth.uid()` == `owner_id` tabeli `organizations` LUB czy użytkownik istnieje w tabeli `school_members` dla jakiejkolwiek szkoły powiązanej z `organization_id`.
    - Jeśli autoryzacja pomyślna: zwraca rekord.
    - Jeśli brak autoryzacji: rzuca błąd (Exception).
4. **Klient (App)** -> Otrzymuje dane i aktualizuje stan (np. Zustand store).

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Funkcja SQL dostępna tylko dla roli `authenticated`.
- **Autoryzacja (RLS/Security Definer):**
  - Funkcja zdefiniowana z `SECURITY DEFINER`, aby mieć dostęp do tabel `school_members` niezależnie od RLS, ale **z jawnym warunkiem sprawdzającym uprawnienia** wewnątrz ciała funkcji.
  - Zapobiega to wyciekowi danych organizacji do osób nieuprawnionych poprzez enumerację ID.
- **Minimalizacja danych:** Zwracamy tylko niezbędne pola (`id`, `name`, `owner_id`), bez danych wrażliwych.

## 7. Obsługa błędów

Błędy będą zgłaszane mechanizmem `RAISE EXCEPTION` w PL/pgSQL, co zostanie przetłumaczone przez PostgREST na odpowiednie kody HTTP.

| Sytuacja | Kod SQL (SQLSTATE/Message) | Kod HTTP | Komunikat dla klienta |
|---|---|---|---|
| Org nie znaleziona | P0002 (no_data_found) | 404 | Organization not found |
| Brak dostępu | 42501 (insufficient_privilege) | 403 | Access denied to this organization |

## 8. Wynik i Etapy wdrożenia

### Krok 1: Utworzenie Migracji SQL

Stworzenie pliku migracji w `supabase/migrations/`, np. `20260107100000_create_get_organization_rpc.sql`.

**Zawartość SQL (szkic):**

```sql
CREATE OR REPLACE FUNCTION get_organization(organization_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ,
  is_owner BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Uruchamiana z uprawnieniami twórcy, ale z jawnym sprawdzaniem auth.uid()
AS $$
DECLARE
  current_user_id UUID;
  target_org organizations%ROWTYPE;
BEGIN
  current_user_id := auth.uid();
  
  -- 1. Sprawdzenie czy organizacja istnieje
  SELECT * INTO target_org FROM organizations WHERE organizations.id = organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Sprawdzenie uprawnień
  -- Dostęp ma: Właściciel LUB członek szkoły w tej organizacji
  IF target_org.owner_id != current_user_id AND NOT EXISTS (
      SELECT 1 
      FROM school_members sm
      JOIN schools s ON s.id = sm.school_id
      WHERE s.organization_id = organization_id 
      AND sm.user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  -- 3. Zwrócenie danych
  RETURN QUERY SELECT 
    target_org.id,
    target_org.name,
    target_org.owner_id,
    target_org.created_at,
    (target_org.owner_id = current_user_id) as is_owner;
END;
$$;
```

### Krok 2: Definicja Typów w TypeScript

W pliku `src/modules/dashboard/types/index.ts` (lub globalnym `types/db.ts` jeśli reużywalne):

```typescript
export interface OrganizationResult {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  is_owner: boolean;
}
```

### Krok 3: Implementacja Serwisu

W pliku `src/modules/dashboard/services/organizationService.ts` (lub `src/modules/core/services/`):

```typescript
import { supabase } from '@/src/config/supabase';
import { OrganizationResult } from '../types';

export const getOrganization = async (organizationId: string): Promise<OrganizationResult> => {
  const { data, error } = await supabase
    .rpc('get_organization', { organization_id: organizationId })
    .single(); // single() bo funkcja zwraca TABLE ale spodziewamy się 1 rekordu

  if (error) throw error;
  return data;
};
```

### Krok 4: Weryfikacja

1. Uruchomienie migracji lokalnie (`supabase db reset` lub `migration up`).
2. Test manualny w Supabase Studio (SQL Editor) wywołując funkcję dla różnych `auth.uid()`.
3. Test integracyjny z poziomu aplikacji (pobranie danych po zalogowaniu).
