# Plan implementacji widoku Rejestracji Instruktora

## 1. Przegląd

Widok ten umożliwia nowym instruktorom założenie konta w aplikacji Evolync. Jest to kluczowy punkt wejścia dla personelu zarządzającego szkołami sportowymi. Proces ten nie tylko tworzy konto użytkownika, ale zgodnie z wymaganiami biznesowymi (US-000) i definicją DTO, automatycznie inicjalizuje strukturę "Organizacji" oraz pierwszej "Szkoły", przypisując rejestrującego się użytkownika jako Właściciela.

## 2. Routing widoku

Widok powinien być dostępny pod ścieżką:
`app/auth/register/instructor.tsx`

(Uwaga: Wymaga refaktoryzacji obecnego pliku `app/auth/register.tsx` do `app/auth/register/index.tsx`, aby umożliwić zagnieżdżanie).

Jest to część stacku autoryzacyjnego, dostępna dla niezalogowanych użytkowników.

## 3. Struktura komponentów

Hierarchia komponentów dla tego widoku:

``` RegisterInstructorScreen
RegisterInstructorScreen (Screen Component)
├── SafeAreaView (Container)
├── KeyboardAvoidingView (UX Wrapper)
└── ScrollView
    └── YStack (Layout Container - Tamagui)
        ├── AppLogo (Branding)
        ├── HeaderText (Title & Subtitle)
        ├── RegisterInstructorForm (Smart Component)
        │   ├── Controller (React Hook Form) -> Input (Full Name)
        │   ├── Controller (React Hook Form) -> Input (Email)
        │   ├── Controller (React Hook Form) -> Input (Password)
        │   ├── Controller (React Hook Form) -> Input (Confirm Password)
        │   ├── Controller (React Hook Form) -> Input (Organization Name)
        │   ├── Controller (React Hook Form) -> Input (School Name)
        │   └── SubmitButton (Tamagui Button)
        ├── Divider (Visual separator)
        ├── GoogleAuthButton (Alternative Auth)
        └── LoginLink (Navigation to Login)
```

## 4. Szczegóły komponentów

### RegisterInstructorScreen (`app/auth/register/instructor.tsx`)

- **Opis:** Główny ekran widoku. Odpowiada za układ (layout) i obsługę bezpiecznych obszarów ekranu.
- **Główne elementy:** `SafeAreaView`, `KeyboardAvoidingView`, `ScrollView`, `YStack`.
- **Obsługiwane interakcje:** Przewijanie formularza, nawigacja do ekranu logowania.
- **Typy:** Brak specyficznych propsów (ekran Expo Router).

### RegisterInstructorForm (`src/modules/register/components/RegisterInstructorForm.tsx`)

- **Opis:** Komponent zawierający logikę formularza, walidację i wywołanie akcji rejestracji.
- **Główne elementy:** `YStack` (kontener), pola tekstowe (`Input` z Tamagui lub dedykowane wrappery jak `EmailInput`, `PasswordInput`), `Button`.
- **Obsługiwane interakcje:**
  - Wprowadzanie danych w pola.
  - Walidacja `onBlur` i `onSubmit`.
  - Kliknięcie przycisku "Zarejestruj".
- **Obsługiwana walidacja:** Schemat Zod (`registerInstructorSchema`).
- **Typy:** Używa `RegisterInstructorFormValues`.
- **Propsy:**
  - `onSubmit`: `(data: RegisterInstructorFormValues) => Promise<void>` (opcjonalnie, jeśli logika jest wewnątrz, ale lepiej wydzielić hooka).
  - `isLoading`: `boolean`.

### Pola Formularza (Inputy)

- Wykorzystanie istniejących komponentów z `src/modules/core/components/` (np. `EmailInput`, `PasswordInput`) oraz standardowych `Input` z Tamagui dla nazw (Imię, Organizacja, Szkoła).

## 5. Typy

### DTO (Data Transfer Object)

Zdefiniowane w `src/modules/register/types/registerDto.ts`:

```typescript
export interface RegisterInstructorRequest {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
  school_name: string;
}
```

### ViewModel (Form Values)

Typ używany przez React Hook Form. Rozszerza DTO o pole potwierdzenia hasła (tylko dla UI).

```typescript
import { z } from 'zod';

export const registerInstructorSchema = z.object({
  full_name: z.string().min(2, "Imię i nazwisko jest wymagane"),
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
  confirmPassword: z.string().min(8, "Potwierdzenie hasła jest wymagane"),
  organization_name: z.string().min(3, "Nazwa organizacji jest wymagana"),
  school_name: z.string().min(3, "Nazwa szkoły jest wymagana"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"],
});

export type RegisterInstructorFormValues = z.infer<typeof registerInstructorSchema>;
```

## 6. Zarządzanie stanem

### Form State

Zarządzany przez `react-hook-form` z `zodResolver`.

- Przechowuje wartości wszystkich pól.
- Przechowuje stan błędów walidacji.
- Przechowuje stan "isSubmitting".

### Request State

Zarządzany przez custom hook `useRegisterInstructor` (do utworzenia w `src/modules/register/hooks/useRegisterInstructor.ts`).

- `isLoading`: boolean - steruje spinnerem na przycisku.
- `error`: string | null - przechowuje błąd z API (np. "Email zajęty").
- `register`: funkcja wywołująca API.

## 7. Integracja API

Integracja odbywa się poprzez wywołanie funkcji RPC w Supabase.

- **Endpoint:** Supabase RPC `register_instructor`.
- **Metoda:** `supabase.rpc('register_instructor', params)`
- **Typ żądania:** `RegisterInstructorRequest`
- **Typ odpowiedzi:** `RegisterInstructorResponse` (zawiera `user_id`, `organization_id`, `school_id`).

Należy utworzyć funkcję serwisową w `src/modules/register/services/registerInstructor.ts`:

```typescript
export const registerInstructor = async (data: RegisterInstructorRequest) => {
  const { data: response, error } = await supabase.rpc('register_instructor', data);
  if (error) throw error;
  return response;
};
```

## 8. Interakcje użytkownika

1. **Wypełnianie formularza:** Użytkownik wprowadza dane. Pola walidują się w czasie rzeczywistym lub po opuszczeniu pola (mode: 'onBlur').
2. **Próba wysłania (Błąd walidacji):** Jeśli formularz zawiera błędy, focus jest ustawiany na pierwsze błędne pole, a komunikaty błędów są wyświetlane pod polami.
3. **Wysłanie formularza (Sukces):**
   - Kliknięcie "Zarejestruj".
   - Przycisk zmienia stan na `loading` (spinner).
   - Wywołanie API.
   - Po sukcesie: Automatyczne logowanie (jeśli RPC tego nie robi, trzeba wywołać `signInWithPassword` lub obsłużyć sesję) i przekierowanie do `/school/:id/dashboard` (Dashboard).
4. **Wysłanie formularza (Błąd API):**
   - Wyświetlenie komunikatu błędu (np. Toast lub `ErrorBanner` nad formularzem).
   - Przycisk wraca do stanu aktywnego.
5. **Nawigacja do logowania:** Kliknięcie w link "Zaloguj się" przenosi do `app/auth/login.tsx`.

## 9. Warunki i walidacja

Walidacja realizowana przez schemat Zod (`registerInstructorSchema`):

- **Full Name:** Wymagane, min 2 znaki.
- **Email:** Poprawny format email.
- **Password:** Min 8 znaków.
- **Confirm Password:** Musi być identyczne jak hasło.
- **Organization Name:** Wymagane, min 3 znaki.
- **School Name:** Wymagane, min 3 znaki.

Dodatkowo:

- Przycisk "Zarejestruj" jest zablokowany (disabled) lub nieaktywny wizualnie, gdy trwa wysyłanie (`isLoading`).

## 10. Obsługa błędów

- **Błędy walidacji:** Wyświetlane inline pod odpowiednimi polami input (Text w kolorze czerwonym/error).
- **Błędy API (np. duplikat emaila):** Przechwytywane w bloku `try/catch` w hooku lub komponencie. Wyświetlane za pomocą komponentu `ErrorBanner` (jeśli istnieje) lub systemowego alertu/toasta.
- **Brak połączenia:** Supabase rzuci błąd sieci. Należy poinformować użytkownika o konieczności bycia online podczas rejestracji (rejestracja to jedna z niewielu akcji wymagających internetu w aplikacji offline-first).

## 11. Kroki implementacji

1. **Przygotowanie Serwisu:**
   - Utworzyć plik `src/modules/register/services/registerInstructor.ts`.
   - Zaimplementować funkcję wywołującą `supabase.rpc`.

2. **Przygotowanie Walidacji:**
   - Utworzyć plik `src/modules/register/validation/registerSchema.ts`.
   - Zdefiniować schemat Zod zgodny z DTO.

3. **Stworzenie Hooka:**
   - Utworzyć `src/modules/register/hooks/useRegisterInstructor.ts`.
   - Zaimplementować logikę stanu ładowania i obsługi błędów.

4. **Implementacja Formularza:**
   - Utworzyć komponent `src/modules/register/components/RegisterInstructorForm.tsx`.
   - Skonfigurować `useForm`.
   - Dodać pola UI używając Tamagui i podpiąć je pod `Controller`.

5. **Refaktoryzacja i Implementacja Ekranu:**
   - Zmienić nazwę `app/auth/register.tsx` na `app/auth/register/index.tsx`.
   - Utworzyć nowy plik `app/auth/register/instructor.tsx`.
   - Dodać layout, nagłówki i osadzić `RegisterInstructorForm` w nowym pliku.
   - Dodać obsługę nawigacji po udanej rejestracji (np. `router.replace('/(tabs)/')`).

6. **Testy manualne:**
   - Sprawdzić walidację pól.
   - Sprawdzić obsługę błędów API.
   - Zweryfikować poprawność utworzonych danych w Supabase (czy powstała organizacja i szkoła).
