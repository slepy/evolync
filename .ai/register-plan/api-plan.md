# API Endpoint Implementation Plan: Register Instructor

## 1. Przegląd punktu końcowego

Punkt końcowy `POST /rpc/register_instructor` służy do kompleksowej rejestracji nowego instruktora. Jest to operacja atomowa, która nie tylko tworzy konto użytkownika, ale także inicjalizuje strukturę jego organizacji, tworzy domyślne role oraz pierwszą szkołę. Dzięki temu instruktor po rejestracji trafia do w pełni skonfigurowanego środowiska ("Onboarding w jednym kroku").

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/rest/v1/rpc/register_instructor` (Standard Supabase RPC)
- **Parametry (JSON Body):**
  - **Wymagane:**
    - `email` (string): Adres email instruktora (login).
    - `password` (string): Hasło w postaci jawnej (zostanie zahashowane przez funkcję).
    - `full_name` (string): Imię i nazwisko instruktora.
    - `organization_name` (string): Nazwa nowej organizacji (np. "Cobra Kai Dojo").
    - `school_name` (string): Nazwa pierwszej szkoły (np. "Cobra Kai Dojo NY").
  - **Opcjonalne:** Brak.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Objects):**
  - `RegisterInstructorRequest` (zdefiniowane w `src/modules/auth/types/registerDto.ts`)
  - `RegisterInstructorResponse` (zdefiniowane w `src/modules/auth/types/registerDto.ts`)
- **Modele Bazodanowe:**
  - `auth.users` (Supabase Auth)
  - `public.organizations`
  - `public.organization_roles`
  - `public.schools`
  - `public.school_members`

## 4. Szczegóły odpowiedzi

- **Sukces (200 OK):**
  Zwraca identyfikatory utworzonych zasobów.

  ```json
  {
    "user_id": "uuid",
    "organization_id": "uuid",
    "school_id": "uuid"
  }
  ```

- **Błąd (4xx/5xx):**
  Standardowy format błędu PostgREST/Supabase.

  ```json
  {
    "code": "P0001",
    "message": "Email already exists",
    "details": null,
    "hint": null
  }
  ```

## 5. Przepływ danych

1. **Klient (App):** Wysyła żądanie `POST` z danymi rejestracyjnymi.
2. **Supabase API (PostgREST):** Odbiera żądanie i kieruje je do funkcji SQL `register_instructor`.
3. **Funkcja SQL (`register_instructor`):**
    - **Walidacja:** Sprawdza poprawność danych wejściowych (format emaila, długość hasła).
    - **Auth:** Tworzy rekord w `auth.users` z zahashowanym hasłem (używając `pgcrypto`). Ustawia `email_confirmed_at` na `NOW()`, aby użytkownik mógł się od razu zalogować (zgodnie z podejściem offline-first/MVP).
    - **Organizacja:** Tworzy rekord w `public.organizations`.
    - **Role:** Tworzy domyślne role w `public.organization_roles`: 'Owner', 'Instructor', 'Student'.
    - **Szkoła:** Tworzy rekord w `public.schools`.
4. **Baza Danych:** Zatwierdza transakcję.
5. **Odpowiedź:** Zwraca wygenerowane UUID do klienta.

## 6. Względy bezpieczeństwa

- **SECURITY DEFINER:** Funkcja będzie uruchamiana z uprawnieniami twórcy (administratora), co jest niezbędne do zapisu w tabeli systemowej `auth.users`.
- **Hashing Haseł:** Wykorzystanie rozszerzenia `pgcrypto` i funkcji `crypt()` z solą (`gen_salt('bf')`) do bezpiecznego przechowywania haseł.
- **Uprawnienia Wykonania:** Funkcja zostanie udostępniona roli `anon` (niezalogowani użytkownicy) oraz `authenticated`.
- **Search Path:** Ustawienie `SET search_path = public, auth` w definicji funkcji, aby uniknąć ataków polegających na nadpisywaniu obiektów w `search_path`.

## 7. Obsługa błędów

- **Duplikat Emaila:** Przechwycenie błędu naruszenia unikalności w `auth.users` i zwrócenie czytelnego komunikatu (kod 400/409).
- **Słabe Hasło:** Walidacja długości hasła (min. 6 znaków) wewnątrz funkcji SQL -> błąd 400.
- **Puste Pola:** Walidacja `CHECK` na poziomie bazy danych lub w funkcji.

## 8. Rozważania dotyczące wydajności

- **Transakcyjność:** Cała logika jest jedną transakcją bazodanową, co gwarantuje spójność danych i minimalizuje narzut sieciowy (jeden round-trip).
- **Indeksy:** Tabele `organizations`, `schools`, `school_members` mają już odpowiednie klucze obce, które są zazwyczaj indeksowane (lub powinny być).

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie Migracji

Utworzenie nowego pliku migracji w `supabase/migrations`, np. `20251218100000_register_instructor_rpc.sql`.

### Krok 2: Włączenie Rozszerzeń

Upewnienie się, że rozszerzenie `pgcrypto` jest włączone (wymagane do hashowania haseł).

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Krok 3: Implementacja Funkcji SQL

Napisanie funkcji PL/pgSQL `register_instructor`.

- Argumenty: `email`, `password`, `full_name`, `organization_name`, `school_name`.
- Logika: `INSERT` do kolejnych tabel i pobieranie ID za pomocą klauzuli `RETURNING`.

### Krok 4: Nadanie Uprawnień

Nadanie uprawnień do wykonywania funkcji dla ról `anon` i `authenticated`.

```sql
GRANT EXECUTE ON FUNCTION public.register_instructor TO anon, authenticated;
```

### Krok 5: Generowanie Typów

Uruchomienie komendy `npx supabase gen types typescript` w celu zaktualizowania pliku `src/database/supabase.ts` o nową definicję funkcji RPC.

### Krok 6: Integracja z Frontendem

Stworzenie funkcji w warstwie serwisowej aplikacji (np. w `src/database/index.ts` lub dedykowanym serwisie auth), która wywoła:

```typescript
supabase.rpc('register_instructor', { ... })
```
