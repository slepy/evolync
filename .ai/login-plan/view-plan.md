# Plan implementacji widoku Logowania

## 1. Przegląd

Ekran logowania stanowi punkt wejścia do aplikacji Evolync dla użytkowników, którzy uruchamiają aplikację po raz pierwszy lub zostali wylogowani. Widok umożliwia uwierzytelnienie za pomocą adresu email i hasła lub przez Google OAuth. Kluczową cechą jest wsparcie dla trwałych sesji (persistent login), co pozwala użytkownikom na automatyczne logowanie przy kolejnych uruchomieniach aplikacji, zgodnie z wymaganiami architektury offline-first.

## 2. Routing widoku

Widok powinien być dostępny pod ścieżką:

- **`/auth/login`** (w kontekście Expo Router: `app/auth/login.tsx`)

Nawigacja:

- Root Navigator → AuthStack → LoginScreen
- Przekierowanie z głównego ekranu aplikacji (`/`), jeśli brak aktywnej sesji
- Możliwość nawigacji do `/auth/register` poprzez przycisk "Załóż konto"

## 3. Struktura komponentów

``` LoginScreen (Screen Container)
LoginScreen (Screen Container)
├── SafeAreaView
│   ├── KeyboardAvoidingView
│   │   ├── ScrollView
│   │   │   ├── AppLogo
│   │   │   ├── LoginForm
│   │   │   │   ├── EmailInput (Tamagui Input + Label)
│   │   │   │   ├── PasswordInput (Tamagui Input + Label + Toggle)
│   │   │   │   ├── ForgotPasswordLink
│   │   │   │   └── SubmitButton (Tamagui Button)
│   │   │   ├── Divider (z tekstem "lub")
│   │   │   ├── GoogleAuthButton
│   │   │   └── RegisterPrompt
│   │   │       └── RegisterLink
│   │   └── ErrorBanner (conditional)
```

## 4. Szczegóły komponentów

### LoginScreen

- **Opis komponentu**: Główny kontener ekranu logowania. Zarządza logiką uwierzytelniania, automatycznym logowaniem przy starcie oraz stanem formularza.
- **Główne elementy**: SafeAreaView, KeyboardAvoidingView (dla obsługi klawiatury), ScrollView (dla małych ekranów), Loading Spinner (podczas sprawdzania sesji)
- **Obsługiwane zdarzenia**:
  - `onMount`: sprawdzenie istniejącej sesji (auto-login)
  - `onEmailLogin`: obsługa logowania email/hasło
  - `onGoogleLogin`: obsługa logowania przez Google OAuth
  - `onNavigateToRegister`: nawigacja do ekranu rejestracji
- **Warunki walidacji**:
  - Sprawdzenie połączenia internetowego przed wywołaniem API
  - Weryfikacja czy sesja nie wygasła przy auto-login
- **Typy**: `AuthState`, `LoginFormData`, `AuthError`
- **Propsy**: brak (screen component)

### AppLogo

- **Opis komponentu**: Komponent prezentujący logo aplikacji Evolync na górze ekranu logowania.
- **Główne elementy**: Tamagui Image lub SVG, opcjonalnie YStack dla centrowania
- **Obsługiwane zdarzenia**: brak
- **Warunki walidacji**: brak
- **Typy**: brak
- **Propsy**: `size?: number` (opcjonalny rozmiar logo)

### LoginForm

- **Opis komponentu**: Formularz zawierający pola email i hasło wraz z przyciskiem wysłania. Zarządza stanem formularza i walidacją inline.
- **Główne elementy**:
  - EmailInput (Tamagui Input z typem email)
  - PasswordInput (Tamagui Input z typem password)
  - PasswordToggle (ikona oka do pokazania/ukrycia hasła)
  - ForgotPasswordLink (Tamagui Button jako link)
  - SubmitButton (Tamagui Button)
- **Obsługiwane zdarzenia**:
  - `onChange`: aktualizacja wartości pól formularza
  - `onBlur`: walidacja pola po opuszczeniu
  - `onSubmit`: wysłanie formularza
  - `onTogglePassword`: pokazanie/ukrycie hasła
- **Warunki walidacji**:
  - Email: wymagane, format email (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), max 255 znaków
  - Password: wymagane, min 6 znaków, max 72 znaki
  - Walidacja inline (onBlur) oraz przy submit
- **Typy**: `LoginFormData`, `FormErrors`, `ValidationSchema`
- **Propsy**:
  - `onSubmit: (data: LoginFormData) => Promise<void>`
  - `isLoading: boolean`
  - `errors?: FormErrors`

### EmailInput

- **Opis komponentu**: Pole tekstowe dla adresu email z etykietą i komunikatem błędu.
- **Główne elementy**: Tamagui Label, Tamagui Input, ErrorText (conditional)
- **Obsługiwane zdarzenia**: `onChange`, `onBlur`
- **Warunki walidacji**: format email, wymagane, max 255 znaków
- **Typy**: `string`, `FieldError`
- **Propsy**:
  - `value: string`
  - `onChange: (value: string) => void`
  - `onBlur: () => void`
  - `error?: string`
  - `disabled?: boolean`

### PasswordInput

- **Opis komponentu**: Pole hasła z możliwością pokazania/ukrycia oraz komunikatem błędu.
- **Główne elementy**: Tamagui Label, Tamagui Input, Toggle Icon (Eye/EyeOff z Lucide), ErrorText
- **Obsługiwane zdarzenia**: `onChange`, `onBlur`, `onToggleVisibility`
- **Warunki walidacji**: wymagane, min 6 znaków, max 72 znaki
- **Typy**: `string`, `boolean` (showPassword), `FieldError`
- **Propsy**:
  - `value: string`
  - `onChange: (value: string) => void`
  - `onBlur: () => void`
  - `error?: string`
  - `disabled?: boolean`

### SubmitButton

- **Opis komponentu**: Przycisk wysyłający formularz logowania.
- **Główne elementy**: Tamagui Button z loading spinner
- **Obsługiwane zdarzenia**: `onPress`
- **Warunki walidacji**: disabled gdy formularz jest invalid lub isLoading
- **Typy**: brak
- **Propsy**:
  - `onPress: () => void`
  - `isLoading: boolean`
  - `disabled: boolean`
  - `title?: string` (domyślnie "Zaloguj się")

### Divider

- **Opis komponentu**: Separator wizualny z tekstem "lub" między formularzem a przyciskiem Google.
- **Główne elementy**: Tamagui Separator, Text
- **Obsługiwane zdarzenia**: brak
- **Warunki walidacji**: brak
- **Typy**: brak
- **Propsy**: `text?: string` (domyślnie "lub")

### GoogleAuthButton

- **Opis komponentu**: Przycisk do logowania przez Google OAuth.
- **Główne elementy**: Tamagui Button z ikoną Google (SVG lub asset)
- **Obsługiwane zdarzenia**: `onPress` (inicjalizacja OAuth flow)
- **Warunki walidacji**:
  - Wymaga połączenia internetowego (disabled w trybie offline)
  - Sprawdzenie dostępności Google Play Services (Android)
- **Typy**: `AuthProvider = 'google'`
- **Propsy**:
  - `onPress: () => void`
  - `isLoading: boolean`
  - `disabled: boolean`

### RegisterPrompt

- **Opis komponentu**: Sekcja z tekstem zachęcającym do rejestracji i linkiem do ekranu rejestracji.
- **Główne elementy**: Tamagui Text, Tamagui Button (styled as link)
- **Obsługiwane zdarzenia**: `onPress` (nawigacja do /auth/register)
- **Warunki walidacji**: brak
- **Typy**: brak
- **Propsy**: `onNavigate: () => void`

### ErrorBanner

- **Opis komponentu**: Banner wyświetlany na górze ekranu przy błędach autentykacji (np. nieprawidłowe dane, brak sieci).
- **Główne elementy**: Tamagui Card/Alert, Icon (AlertCircle), Text, Close Button
- **Obsługiwane zdarzenia**: `onDismiss`
- **Warunki walidacji**: brak
- **Typy**: `AuthError`
- **Propsy**:
  - `error: AuthError | null`
  - `onDismiss: () => void`

## 5. Typy

### LoginFormData

```typescript
interface LoginFormData {
  email: string;
  password: string;
}
```

### LoginCredentials (Supabase Auth)

```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

### AuthState

```typescript
interface AuthState {
  isLoading: boolean;
  isCheckingSession: boolean; // sprawdzanie auto-login
  error: AuthError | null;
  user: User | null;
  session: Session | null;
}
```

### FormErrors

```typescript
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}
```

### AuthError

```typescript
interface AuthError {
  code: 'invalid_credentials' | 'network_error' | 'session_expired' | 'too_many_requests' | 'unknown';
  message: string;
  recoverable: boolean; // czy użytkownik może spróbować ponownie
}
```

### User (Supabase)

```typescript
interface User {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  created_at: string;
}
```

### Session (Supabase)

```typescript
interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}
```

### ValidationSchema (Zod)

```typescript
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format adresu email')
    .max(255, 'Email może mieć maksymalnie 255 znaków'),
  password: z
    .string()
    .min(6, 'Hasło musi mieć co najmniej 6 znaków')
    .max(72, 'Hasło może mieć maksymalnie 72 znaki'),
});

type ValidationSchema = z.infer<typeof loginSchema>;
```

## 6. Zarządzanie stanem

### Global State (Zustand)

Utworzenie store `useAuthStore` do zarządzania globalnym stanem autentykacji:

```typescript
interface AuthStore {
  // Stan
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;

  // Akcje
  signInWithEmail: (credentials: LoginCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;

  // Helpers
  isAuthenticated: () => boolean;
}
```

### Local State (React Hook Form)

Formularz LoginForm wykorzystuje React Hook Form z resolverem Zod:

```typescript
const {
  control,
  handleSubmit,
  formState: { errors, isValid, isDirty, isSubmitting },
  setError,
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  mode: 'onBlur', // walidacja przy opuszczeniu pola
  defaultValues: {
    email: '',
    password: '',
  },
});
```

### Component State (useState)

Stan lokalny komponentu LoginScreen:

```typescript
const [showPassword, setShowPassword] = useState(false);
const [isCheckingSession, setIsCheckingSession] = useState(true);
const [networkAvailable, setNetworkAvailable] = useState(true);
```

### Custom Hook: useAuth

Hook `useAuth` enkapsuluje logikę autentykacji i integrację z Supabase:

```typescript
const useAuth = () => {
  const store = useAuthStore();

  const signInWithEmail = async (credentials: LoginCredentials) => {
    // Implementacja logowania email/hasło
  };

  const signInWithGoogle = async () => {
    // Implementacja logowania Google OAuth
  };

  const checkSession = async () => {
    // Sprawdzenie istniejącej sesji z SecureStore
  };

  return {
    ...store,
    signInWithEmail,
    signInWithGoogle,
    checkSession,
  };
};
```

## 7. Integracja API

### Endpoint 1: Logowanie Email/Hasło

**Metoda**: `supabase.auth.signInWithPassword()`

**Request Type**:

```typescript
interface SignInWithPasswordCredentials {
  email: string;
  password: string;
}
```

**Response Type**:

```typescript
interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: AuthError | null;
}
```

**Implementacja**:

```typescript
const signInWithEmail = async (credentials: LoginCredentials) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;

    // Zapisz session w SecureStore
    await SecureStore.setItemAsync('session', JSON.stringify(data.session));

    // Aktualizuj globalny stan
    useAuthStore.setState({
      user: data.user,
      session: data.session,
      error: null
    });

    // Nawigacja do głównego ekranu
    router.replace('/');
  } catch (error) {
    // Obsługa błędów
  }
};
```

### Endpoint 2: Logowanie Google OAuth

**Metoda**: `supabase.auth.signInWithOAuth()`

**Request Type**:

```typescript
interface SignInWithOAuthCredentials {
  provider: 'google';
  options?: {
    redirectTo?: string;
    scopes?: string;
  };
}
```

**Response Type**:

```typescript
interface OAuthResponse {
  data: {
    provider: 'google';
    url: string; // URL do przekierowania
  };
  error: AuthError | null;
}
```

**Implementacja**:

```typescript
const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'evolync://auth/callback',
      },
    });

    if (error) throw error;

    // Otwórz WebBrowser z URL OAuth
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      'evolync://auth/callback'
    );

    if (result.type === 'success') {
      // Pobierz token z URL callback
      // Zapisz session w SecureStore
      // Aktualizuj globalny stan
    }
  } catch (error) {
    // Obsługa błędów
  }
};
```

### Endpoint 3: Sprawdzenie sesji (Auto-login)

**Metoda**: `supabase.auth.getSession()`

**Request Type**: brak (sprawdza zapisaną sesję)

**Response Type**:

```typescript
interface GetSessionResponse {
  data: {
    session: Session | null;
  };
  error: AuthError | null;
}
```

**Implementacja**:

```typescript
const checkSession = async () => {
  try {
    // Pobierz sesję z SecureStore
    const sessionString = await SecureStore.getItemAsync('session');

    if (!sessionString) {
      setIsCheckingSession(false);
      return;
    }

    // Zweryfikuj sesję z Supabase
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      await SecureStore.deleteItemAsync('session');
      setIsCheckingSession(false);
      return;
    }

    // Sesja ważna - automatyczne logowanie
    useAuthStore.setState({
      user: data.session.user,
      session: data.session,
    });

    router.replace('/');
  } catch (error) {
    setIsCheckingSession(false);
  }
};
```

## 8. Interakcje użytkownika

### 1. Wpisanie adresu email

- **Akcja**: Użytkownik wpisuje tekst w pole EmailInput
- **Reakcja**:
  - Wartość jest aktualizowana w stanie formularza
  - Przy `onBlur` (opuszczeniu pola) uruchamia się walidacja formatu email
  - W przypadku błędu wyświetlany jest komunikat pod polem (np. "Nieprawidłowy format adresu email")

### 2. Wpisanie hasła

- **Akcja**: Użytkownik wpisuje tekst w pole PasswordInput
- **Reakcja**:
  - Wartość jest aktualizowana w stanie formularza
  - Domyślnie hasło jest maskowane (type="password")
  - Przy `onBlur` uruchamia się walidacja minimalnej długości

### 3. Toggle pokazywania hasła

- **Akcja**: Użytkownik klika ikonę oka w polu hasła
- **Reakcja**:
  - Stan `showPassword` zmienia się na przeciwny
  - Pole zmienia type z "password" na "text" lub odwrotnie
  - Ikona zmienia się z Eye na EyeOff

### 4. Kliknięcie "Zaloguj się"

- **Akcja**: Użytkownik klika przycisk SubmitButton
- **Reakcja**:
  - Uruchamia się pełna walidacja formularza
  - Jeśli formularz nieprawidłowy: wyświetlane są błędy walidacji
  - Jeśli formularz prawidłowy:
    - Przycisk przechodzi w stan loading (spinner)
    - Wywoływane jest `signInWithEmail()`
    - W przypadku sukcesu: nawigacja do głównego ekranu (`/`)
    - W przypadku błędu: wyświetlenie ErrorBanner z komunikatem

### 5. Kliknięcie "Zaloguj przez Google"

- **Akcja**: Użytkownik klika GoogleAuthButton
- **Reakcja**:
  - Sprawdzenie dostępności połączenia internetowego
  - Jeśli offline: wyświetlenie komunikatu "Logowanie przez Google wymaga połączenia z internetem"
  - Jeśli online:
    - Przycisk przechodzi w stan loading
    - Otwiera się WebBrowser z formularzem logowania Google
    - Po zalogowaniu w Google: przekierowanie z tokenem do aplikacji
    - Aplikacja przetwarza token i zapisuje sesję
    - Nawigacja do głównego ekranu

### 6. Kliknięcie "Zapomniałeś hasła?"

- **Akcja**: Użytkownik klika link ForgotPasswordLink
- **Reakcja**: Nawigacja do `/auth/forgot-password`

### 7. Kliknięcie "Załóż konto"

- **Akcja**: Użytkownik klika przycisk/link w RegisterPrompt
- **Reakcja**: Nawigacja do `/auth/register`

### 8. Automatyczne logowanie przy starcie

- **Akcja**: Aplikacja uruchamia się
- **Reakcja**:
  - Wyświetlenie Loading Screen/Spinner
  - Wywołanie `checkSession()`
  - Jeśli sesja istnieje i jest ważna: nawigacja do `/`
  - Jeśli brak sesji lub wygasła: wyświetlenie ekranu logowania

### 9. Zamknięcie ErrorBanner

- **Akcja**: Użytkownik klika przycisk X w ErrorBanner
- **Reakcja**: ErrorBanner znika (error w stanie ustawiany na null)

## 9. Warunki i walidacja

### Walidacja pola Email (EmailInput)

**Warunki weryfikowane przez interfejs**:

1. **Wymagane**: Pole nie może być puste
   - Komunikat: "Email jest wymagany"
   - Moment sprawdzenia: onBlur, onSubmit

2. **Format email**: Musi zawierać @ i domenę
   - Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Komunikat: "Nieprawidłowy format adresu email"
   - Moment sprawdzenia: onBlur, onSubmit

3. **Maksymalna długość**: Max 255 znaków
   - Komunikat: "Email może mieć maksymalnie 255 znaków"
   - Moment sprawdzenia: onChange (blokada wpisywania), onSubmit

**Wpływ na stan UI**:

- Błąd walidacji: czerwona ramka wokół inputu, komunikat błędu pod polem
- Pole prawidłowe: zielona ramka (opcjonalnie), brak komunikatu
- SubmitButton disabled gdy pole nieprawidłowe

### Walidacja pola Password (PasswordInput)

**Warunki weryfikowane przez interfejs**:

1. **Wymagane**: Pole nie może być puste
   - Komunikat: "Hasło jest wymagane"
   - Moment sprawdzenia: onBlur, onSubmit

2. **Minimalna długość**: Min 6 znaków
   - Komunikat: "Hasło musi mieć co najmniej 6 znaków"
   - Moment sprawdzenia: onBlur, onSubmit

3. **Maksymalna długość**: Max 72 znaki (limit Supabase)
   - Komunikat: "Hasło może mieć maksymalnie 72 znaki"
   - Moment sprawdzenia: onChange (blokada wpisywania), onSubmit

**Wpływ na stan UI**:

- Błąd walidacji: czerwona ramka, komunikat błędu pod polem
- Pole prawidłowe: zielona ramka (opcjonalnie), brak komunikatu
- SubmitButton disabled gdy pole nieprawidłowe

### Walidacja całego formularza (LoginForm)

**Warunki weryfikowane**:

1. **Wszystkie pola wypełnione**: Email i Password mają wartości
2. **Wszystkie pola prawidłowe**: Brak błędów walidacji w żadnym polu
3. **Formularz nie jest w trakcie wysyłania**: `isSubmitting === false`

**Wpływ na stan UI**:

- SubmitButton disabled gdy `!isValid || isSubmitting`
- SubmitButton pokazuje spinner gdy `isSubmitting === true`

### Walidacja połączenia internetowego (LoginScreen)

**Warunki weryfikowane**:

- Dostępność sieci przed wywołaniem API (NetInfo)
- Szczególnie ważne dla Google OAuth (wymaga online)

**Wpływ na stan UI**:

- GoogleAuthButton disabled gdy `!networkAvailable`
- Tooltip/komunikat "Wymaga połączenia z internetem"
- ErrorBanner z komunikatem "Brak połączenia z internetem" przy próbie logowania offline

### Walidacja sesji (Auto-login)

**Warunki weryfikowane**:

1. Istnienie sesji w SecureStore
2. Ważność tokenu (expires_at > Date.now())
3. Możliwość odświeżenia sesji (refresh_token)

**Wpływ na stan UI**:

- Loading Screen podczas sprawdzania sesji
- Automatyczne przekierowanie do `/` jeśli sesja ważna
- Wyświetlenie ekranu logowania jeśli sesja nieważna/brak

### Walidacja odpowiedzi API

**Warunki weryfikowane**:

1. **Invalid credentials**: Email lub hasło nieprawidłowe
   - ErrorBanner: "Nieprawidłowy email lub hasło"

2. **Email not confirmed**: Email wymaga potwierdzenia
   - ErrorBanner: "Potwierdź swój adres email. Sprawdź swoją skrzynkę."

3. **Too many requests**: Za dużo prób logowania
   - ErrorBanner: "Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut."

4. **Network error**: Błąd połączenia
   - ErrorBanner: "Błąd połączenia. Sprawdź swoje połączenie internetowe."

**Wpływ na stan UI**:

- Wyświetlenie odpowiedniego ErrorBanner
- Odblokowanie formularza (isSubmitting = false)
- Możliwość ponownej próby

## 10. Obsługa błędów

### 1. Nieprawidłowe dane logowania (Invalid Credentials)

**Scenariusz**: Użytkownik wprowadza nieprawidłowy email lub hasło

**Obsługa**:

```typescript
if (error.message === 'Invalid login credentials') {
  setError('general', {
    message: 'Nieprawidłowy email lub hasło. Sprawdź dane i spróbuj ponownie.',
  });

  // Wyświetl ErrorBanner
  useAuthStore.setState({
    error: {
      code: 'invalid_credentials',
      message: 'Nieprawidłowy email lub hasło',
      recoverable: true,
    },
  });
}
```

**Reakcja UI**:

- ErrorBanner na górze ekranu z komunikatem
- Focus powraca do pola email
- Możliwość ponownej próby

### 2. Brak połączenia internetowego (Network Error)

**Scenariusz**: Użytkownik próbuje się zalogować bez dostępu do internetu

**Obsługa**:

```typescript
// Sprawdzenie przed wywołaniem API
const networkState = await NetInfo.fetch();

if (!networkState.isConnected) {
  useAuthStore.setState({
    error: {
      code: 'network_error',
      message: 'Brak połączenia z internetem. Połącz się z siecią i spróbuj ponownie.',
      recoverable: true,
    },
  });
  return;
}

// Obsługa błędu timeout
try {
  await Promise.race([
    signInWithPassword(credentials),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    ),
  ]);
} catch (error) {
  if (error.message === 'timeout') {
    // Obsłuż timeout
  }
}
```

**Reakcja UI**:

- ErrorBanner: "Brak połączenia z internetem"
- GoogleAuthButton disabled
- Ikona offline w górnym rogu ekranu

### 3. Email niepotwierdzony (Email Not Confirmed)

**Scenariusz**: Użytkownik zarejestrował się, ale nie potwierdził emaila

**Obsługa**:

```typescript
if (error.message.includes('Email not confirmed')) {
  useAuthStore.setState({
    error: {
      code: 'email_not_confirmed',
      message: 'Potwierdź swój adres email. Sprawdź swoją skrzynkę pocztową.',
      recoverable: true,
    },
  });

  // Opcjonalnie: przycisk do ponownego wysłania emaila
}
```

**Reakcja UI**:

- ErrorBanner z przyciskiem "Wyślij ponownie email potwierdzający"
- Link do support jeśli problem persystuje

### 4. Zbyt wiele prób logowania (Rate Limit)

**Scenariusz**: Użytkownik wykonał zbyt wiele nieudanych prób logowania

**Obsługa**:

```typescript
if (error.message.includes('Too many requests')) {
  const retryAfter = error.retryAfter || 300; // sekundy

  useAuthStore.setState({
    error: {
      code: 'too_many_requests',
      message: `Zbyt wiele prób logowania. Spróbuj ponownie za ${Math.ceil(retryAfter / 60)} minut.`,
      recoverable: false, // tymczasowo
    },
  });

  // Disable przycisku logowania na określony czas
  setButtonDisabledUntil(Date.now() + retryAfter * 1000);
}
```

**Reakcja UI**:

- ErrorBanner z informacją o czasie oczekiwania
- Disabled SubmitButton i GoogleAuthButton
- Timer odliczający czas do odblokowania

### 5. Anulowanie OAuth flow (OAuth Cancelled)

**Scenariusz**: Użytkownik zamyka okno logowania Google bez zalogowania

**Obsługa**:

```typescript
const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

if (result.type === 'cancel') {
  // Nie traktuj jako błąd - użytkownik po prostu anulował
  console.log('OAuth cancelled by user');
  return;
}

if (result.type === 'dismiss') {
  // Podobnie - użytkownik zamknął okno
  return;
}
```

**Reakcja UI**:

- Brak ErrorBanner (zamknięcie okna to normalna akcja)
- Powrót do ekranu logowania
- GoogleAuthButton odblokowany

### 6. Wygasła sesja przy auto-login (Session Expired)

**Scenariusz**: Aplikacja uruchamia się z nieważną sesją w SecureStore

**Obsługa**:

```typescript
const checkSession = async () => {
  try {
    const sessionString = await SecureStore.getItemAsync('session');

    if (!sessionString) {
      return; // Brak sesji - normalny flow logowania
    }

    const session = JSON.parse(sessionString);

    // Sprawdź czy token nie wygasł
    if (session.expires_at < Date.now() / 1000) {
      // Spróbuj odświeżyć token
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: session.refresh_token,
      });

      if (error) {
        // Token refresh failed - wymagane ponowne logowanie
        await SecureStore.deleteItemAsync('session');

        useAuthStore.setState({
          error: {
            code: 'session_expired',
            message: 'Twoja sesja wygasła. Zaloguj się ponownie.',
            recoverable: true,
          },
        });

        return;
      }

      // Zapisz nową sesję
      await SecureStore.setItemAsync('session', JSON.stringify(data.session));
    }
  } catch (error) {
    // Obsługa błędów parsowania/odczytu
    await SecureStore.deleteItemAsync('session');
  } finally {
    setIsCheckingSession(false);
  }
};
```

**Reakcja UI**:

- ErrorBanner: "Twoja sesja wygasła. Zaloguj się ponownie."
- Wyświetlenie formularza logowania
- Opcjonalnie: pole email wypełnione ostatnim użytym emailem

### 7. Błędy walidacji formularza

**Scenariusz**: Użytkownik próbuje wysłać formularz z błędami walidacji

**Obsługa**:

```typescript
const onSubmit = handleSubmit(async (data) => {
  // React Hook Form już zwalidował dane zgodnie ze schematem Zod
  await signInWithEmail(data);
}, (errors) => {
  // Callback przy błędach walidacji
  console.log('Validation errors:', errors);

  // Możemy dodać dodatkową logikę, np. focus na pierwszym błędnym polu
  const firstErrorField = Object.keys(errors)[0];
  if (firstErrorField) {
    // Focus na pierwszym polu z błędem
  }
});
```

**Reakcja UI**:

- Komunikaty błędów pod odpowiednimi polami
- Czerwone ramki wokół nieprawidłowych pól
- SubmitButton disabled do czasu poprawienia błędów

### 8. Nieznany błąd (Unknown Error)

**Scenariusz**: Wystąpił nieoczekiwany błąd

**Obsługa**:

```typescript
try {
  await signInWithEmail(credentials);
} catch (error) {
  console.error('Unexpected login error:', error);

  // Sentry/logging dla monitorowania
  logErrorToService(error);

  useAuthStore.setState({
    error: {
      code: 'unknown',
      message: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie lub skontaktuj się z pomocą techniczną.',
      recoverable: true,
    },
  });
}
```

**Reakcja UI**:

- ErrorBanner z ogólnym komunikatem
- Przycisk "Spróbuj ponownie"
- Link do support/kontaktu

## 11. Kroki implementacji

### Krok 1: Konfiguracja Supabase i środowiska

1. Zainstaluj zależności:

   ```bash
   npx expo install @supabase/supabase-js expo-secure-store expo-auth-session expo-web-browser @react-native-community/netinfo
   ```

2. Utwórz plik `src/config/supabase.ts`:
   - Inicjalizacja klienta Supabase z customowym storage (SecureStore)
   - Konfiguracja URL i anon key z `.env`
3. Skonfiguruj Deep Linking w `app.json`:
   - Dodaj `evolync://` jako scheme dla OAuth callback

### Krok 2: Konfiguracja Zustand store dla autentykacji

1. Utwórz plik `src/modules/auth/store/authStore.ts`
2. Zdefiniuj interfejs `AuthStore` z polami: user, session, isLoading, error
3. Zaimplementuj akcje: signInWithEmail, signInWithGoogle, signOut, checkSession, clearError
4. Dodaj persist middleware dla trwałego stanu (opcjonalnie)

### Krok 3: Utworzenie custom hook useAuth

1. Utwórz plik `src/modules/auth/hooks/useAuth.ts`
2. Zaimplementuj logikę `signInWithEmail`:
   - Wywołanie `supabase.auth.signInWithPassword()`
   - Zapis sesji do SecureStore
   - Aktualizacja globalnego stanu
   - Obsługa błędów
3. Zaimplementuj logikę `signInWithGoogle`:
   - Wywołanie `supabase.auth.signInWithOAuth()`
   - Otwarcie WebBrowser z OAuth URL
   - Obsługa callback
4. Zaimplementuj `checkSession`:
   - Odczyt sesji z SecureStore
   - Weryfikacja ważności tokenu
   - Refresh tokenu jeśli potrzebny

### Krok 4: Konfiguracja walidacji z Zod

1. Utwórz plik `src/modules/auth/validation/loginSchema.ts`
2. Zdefiniuj schemat walidacji dla formularza logowania:

   ```typescript
   const loginSchema = z.object({
     email: z.string().min(1).email().max(255),
     password: z.string().min(6).max(72),
   });
   ```

3. Dodaj polskie komunikaty błędów

### Krok 5: Budowa komponentów UI - Atomy

#### EmailInput

1. Utwórz `src/modules/auth/components/EmailInput.tsx`
2. Użyj Tamagui Input z Label
3. Zintegruj z React Hook Form (Controller)
4. Dodaj wyświetlanie błędów walidacji
5. Style: focus state, error state, disabled state

#### PasswordInput

1. Utwórz `src/modules/auth/components/PasswordInput.tsx`
2. Dodaj toggle dla pokazania/ukrycia hasła (Eye/EyeOff icon z Lucide)
3. Zintegruj z React Hook Form
4. Dodaj wyświetlanie błędów
5. Obsługa secure text entry

#### SubmitButton

1. Utwórz `src/modules/auth/components/SubmitButton.tsx`
2. Użyj Tamagui Button
3. Dodaj loading spinner (podczas isSubmitting)
4. Disabled state (invalid form lub loading)
5. Accessibility: aria-label, role

#### GoogleAuthButton

1. Utwórz `src/modules/auth/components/GoogleAuthButton.tsx`
2. Dodaj ikonę Google (SVG asset)
3. Obsługa onPress → wywołanie `signInWithGoogle()`
4. Disabled gdy offline
5. Loading state

### Krok 6: Budowa komponentów UI - Molekuły

#### LoginForm

1. Utwórz `src/modules/auth/components/LoginForm.tsx`
2. Użyj React Hook Form z zodResolver:

   ```typescript
   const { control, handleSubmit, formState } = useForm<LoginFormData>({
     resolver: zodResolver(loginSchema),
     mode: 'onBlur',
   });
   ```

3. Zbuduj layout z EmailInput, PasswordInput, ForgotPasswordLink, SubmitButton
4. Obsługa onSubmit → wywołanie `signInWithEmail()`
5. Przekazywanie errors z formState do inputs

#### ErrorBanner

1. Utwórz `src/modules/auth/components/ErrorBanner.tsx`
2. Conditional rendering na podstawie `error !== null`
3. Wyświetlanie komunikatu błędu
4. Przycisk X do zamknięcia (onDismiss)
5. Różne style dla różnych typów błędów (error, warning, info)

#### RegisterPrompt

1. Utwórz `src/modules/auth/components/RegisterPrompt.tsx`
2. Tekst: "Nie masz konta?"
3. Button/Link: "Załóż konto" → nawigacja do `/auth/register`
4. Style: subtle, secondary button

### Krok 7: Budowa głównego ekranu LoginScreen

1. Utwórz `app/auth/login.tsx` (Expo Router screen)
2. Struktura layoutu:

   ```tsx
   <SafeAreaView>
     <KeyboardAvoidingView behavior="padding">
       <ScrollView>
         {isCheckingSession ? (
           <LoadingSpinner />
         ) : (
           <>
             <AppLogo />
             <ErrorBanner error={error} onDismiss={clearError} />
             <LoginForm onSubmit={handleEmailLogin} />
             <Divider text="lub" />
             <GoogleAuthButton onPress={handleGoogleLogin} />
             <RegisterPrompt onNavigate={() => router.push('/auth/register')} />
           </>
         )}
       </ScrollView>
     </KeyboardAvoidingView>
   </SafeAreaView>
   ```

3. Dodaj useEffect dla auto-login:

   ```typescript
   useEffect(() => {
     checkSession();
   }, []);
   ```

4. Obsługa nawigacji po udanym logowaniu

### Krok 8: Obsługa OAuth callback

1. Utwórz `app/auth/callback.tsx`
2. Wyciągnięcie tokenu z URL params:

   ```typescript
   const { access_token, refresh_token } = useLocalSearchParams();
   ```

3. Utworzenie sesji w Supabase:

   ```typescript
   await supabase.auth.setSession({ access_token, refresh_token });
   ```

4. Zapis do SecureStore
5. Przekierowanie do głównego ekranu

### Krok 9: Integracja NetInfo dla sprawdzania połączenia

1. Utwórz hook `useNetworkStatus`:

   ```typescript
   const useNetworkStatus = () => {
     const [isConnected, setIsConnected] = useState(true);

     useEffect(() => {
       const unsubscribe = NetInfo.addEventListener(state => {
         setIsConnected(state.isConnected);
       });
       return unsubscribe;
     }, []);

     return isConnected;
   };
   ```

2. Użyj w LoginScreen:
   - Disable GoogleAuthButton gdy offline
   - Sprawdzenie przed wywołaniem API

### Krok 10: Implementacja obsługi błędów

1. Dodaj mapowanie błędów Supabase na `AuthError`:

   ```typescript
   const mapSupabaseError = (error: SupabaseError): AuthError => {
     if (error.message.includes('Invalid login credentials')) {
       return { code: 'invalid_credentials', message: '...', recoverable: true };
     }
     // ... inne mapowania
   };
   ```

2. W każdym try/catch wywołań API użyj mapowania
3. Aktualizacja stanu błędu w store
4. Wyświetlenie ErrorBanner

### Krok 11: Dodanie Loading States

1. Globalny loading screen podczas `isCheckingSession`:
   - Spinner + logo
   - Splash screen transition
2. Loading state w SubmitButton podczas `isSubmitting`
3. Loading state w GoogleAuthButton podczas OAuth flow
4. Skeleton loaders (opcjonalnie)

### Krok 12: Stylowanie z Tamagui

1. Utwórz plik `src/modules/auth/theme/authTheme.ts`
2. Zdefiniuj kolory, spacing, typography dla ekranów auth
3. Zastosuj theme w komponentach
4. Responsywność dla różnych rozmiarów ekranów
5. Dark mode support (jeśli w scope)

### Krok 13: Accessibility

1. Dodaj odpowiednie `accessibilityLabel` do wszystkich interaktywnych elementów
2. `accessibilityHint` dla złożonych akcji (np. Google login)
3. `accessibilityRole` dla buttonów, inputs
4. Testowanie z VoiceOver (iOS) i TalkBack (Android)
5. Focus management - autofocus na pierwszym polu

### Krok 14: Testy jednostkowe

1. Testy dla `useAuth` hook:
   - Poprawne wywołanie API
   - Zapis sesji do SecureStore
   - Obsługa błędów
2. Testy dla komponentów:
   - EmailInput: walidacja formatowania
   - PasswordInput: toggle visibility
   - LoginForm: integracja z React Hook Form
3. Testy dla walidacji Zod schema

### Krok 15: Testy integracyjne (E2E)

1. Scenariusz: Poprawne logowanie email/hasło
2. Scenariusz: Błędne dane logowania
3. Scenariusz: Logowanie offline
4. Scenariusz: Auto-login przy ponownym uruchomieniu
5. Scenariusz: OAuth flow (Google)

### Krok 16: Optymalizacja wydajności

1. Memoizacja komponentów z `React.memo`
2. `useCallback` dla handlerów eventów
3. Lazy loading dla OAuth (dynamiczny import WebBrowser)
4. Debounce dla walidacji (opcjonalnie)

### Krok 17: Dokumentacja

1. Dodaj JSDoc do wszystkich publicznych funkcji i komponentów
2. Utwórz README w `src/modules/auth/` z opisem architektury
3. Przykłady użycia hooków i komponentów
4. Flow diagram procesu autentykacji

### Krok 18: Przygotowanie do deployment

1. Sprawdzenie wszystkich zmiennych środowiskowych (`.env`)
2. Konfiguracja Supabase w production:
   - Prawidłowe redirect URLs
   - Rate limiting
   - Email templates
3. Testowanie na fizycznych urządzeniach (iOS + Android)
4. Weryfikacja Deep Linking w production build

### Krok 19: Monitoring i logging

1. Integracja z Sentry dla error tracking:
   - Logowanie błędów autentykacji
   - Breadcrumbs dla OAuth flow
2. Analytics events:
   - Login success/failure
   - Method used (email vs Google)
   - Auto-login rate
3. Performance monitoring (FPS, load time)

### Krok 20: Finalizacja i code review

1. Code review z zespołem
2. Refactoring na podstawie feedbacku
3. Aktualizacja typów TypeScript
4. Cleanup console.logs i debug code
5. Merge do main branch
