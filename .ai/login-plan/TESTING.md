# 🧪 Instrukcje testowania widoku logowania

## Przygotowanie

### 1. Sprawdź czy serwer Expo jest uruchomiony

```bash
npm start
```

Powinieneś zobaczyć:
- QR code do skanowania
- URL: `exp://192.168.x.x:8081` (Twój lokalny adres IP)
- Opcje: `› Press a │ open Android`, `› Press i │ open iOS simulator`

---

## Metody testowania

### Metoda 1: Expo Go na telefonie (Najszybsza) 📱

**Wymagania:**
- Telefon z Androidem lub iOS
- Aplikacja Expo Go zainstalowana ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Telefon i komputer w tej samej sieci WiFi

**Kroki:**
1. Otwórz aplikację Expo Go na telefonie
2. Zeskanuj QR code z terminala
3. Aplikacja załaduje się automatycznie
4. Powinieneś zobaczyć ekran logowania

**Uwaga:** Google OAuth **nie będzie działać** w Expo Go (wymaga custom native build)

---

### Metoda 2: iOS Simulator (Mac only) 📱

```bash
npm run ios
```

lub w terminalu Expo naciśnij `i`

**Wymagania:**
- macOS
- Xcode zainstalowany
- iOS Simulator skonfigurowany

**Co sprawdzić:**
- ✅ Wygląd ekranu logowania
- ✅ Walidacja formularza
- ✅ Logowanie email/hasło
- ⚠️ Google OAuth (wymaga dodatkowej konfiguracji)

---

### Metoda 3: Android Emulator 🤖

```bash
npm run android
```

lub w terminalu Expo naciśnij `a`

**Wymagania:**
- Android Studio zainstalowany
- Android Emulator uruchomiony (AVD)

**Co sprawdzić:**
- ✅ Wygląd ekranu logowania
- ✅ Walidacja formularza
- ✅ Logowanie email/hasło
- ⚠️ Google OAuth (wymaga dodatkowej konfiguracji)

---

### Metoda 4: Web Browser 🌐

```bash
npm run web
```

lub w terminalu Expo naciśnij `w`

Aplikacja otworzy się w przeglądarce na `http://localhost:8081`

**Co sprawdzić:**
- ✅ Wygląd ekranu logowania
- ✅ Walidacja formularza
- ⚠️ Logowanie email/hasło (może wymagać konfiguracji CORS w Supabase)
- ⚠️ Google OAuth (inne flow niż mobile)

---

## Co testować na ekranie logowania

### ✅ Checklist funkcjonalności

#### 1. UI/UX
- [ ] Logo aplikacji wyświetla się poprawnie
- [ ] Tekst powitalny jest czytelny
- [ ] Pola formularza są dobrze wycentrowane
- [ ] Klawiatura nie zasłania pól (KeyboardAvoidingView działa)
- [ ] ScrollView pozwala przewinąć ekran gdy klawiatura otwarta

#### 2. Walidacja formularza
- [ ] Email - komunikat błędu gdy pusty
- [ ] Email - komunikat błędu gdy nieprawidłowy format
- [ ] Email - komunikat błędu gdy > 255 znaków
- [ ] Hasło - komunikat błędu gdy puste
- [ ] Hasło - komunikat błędu gdy < 6 znaków
- [ ] Hasło - komunikat błędu gdy > 72 znaki
- [ ] Toggle show/hide hasła działa (ikona Eye/EyeOff)

#### 3. Loading states
- [ ] Przycisk "Zaloguj się" pokazuje spinner podczas logowania
- [ ] Przycisk "Zaloguj przez Google" pokazuje spinner
- [ ] Pola formularza są disabled podczas logowania
- [ ] Loading screen przy sprawdzaniu sesji (auto-login)

#### 4. Obsługa błędów
- [ ] ErrorBanner wyświetla się przy błędzie logowania
- [ ] Komunikat błędu jest czytelny i pomocny
- [ ] Przycisk X zamyka ErrorBanner
- [ ] Błąd sieci - odpowiedni komunikat
- [ ] Nieprawidłowe dane - odpowiedni komunikat

#### 5. Nawigacja
- [ ] Link "Zapomniałeś hasła?" (TODO - obecnie console.log)
- [ ] Link "Załóż konto" przekierowuje do `/auth/register` (screen nie istnieje - error)

#### 6. Funkcjonalność (wymaga konfiguracji Supabase)
- [ ] Logowanie email/hasło działa
- [ ] Auto-login przy ponownym uruchomieniu
- [ ] Wylogowanie czyści sesję
- [ ] Refresh tokenu gdy wygaśnie

---

## Testowanie funkcjonalności logowania

### Konfiguracja Supabase (wymagana dla pełnego testu)

1. **Przejdź do Supabase Dashboard:**
   - URL: https://supabase.com/dashboard
   - Projekt: `hojoncnyslustockwxxf`

2. **Włącz Email Authentication:**
   - Authentication → Providers → Email
   - Upewnij się że "Enable Email provider" jest włączone

3. **Utwórz testowego użytkownika:**
   ```sql
   -- W SQL Editor
   -- Opcja 1: Przez SQL
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('test@example.com', crypt('password123', gen_salt('bf')), now());

   -- Opcja 2: Przez Dashboard
   -- Authentication → Users → Add User
   -- Email: test@example.com
   -- Password: password123
   -- Auto Confirm User: YES
   ```

4. **Testuj logowanie:**
   - Email: `test@example.com`
   - Hasło: `password123`
   - Sprawdź czy po zalogowaniu przekierowuje do `/(tabs)`

---

## Testowanie Google OAuth (Advanced)

**Uwaga:** Google OAuth wymaga custom native build (nie działa w Expo Go)

### Wymagane kroki:

1. **Konfiguracja Google Cloud Console:**
   - Utwórz projekt w Google Cloud Console
   - Włącz Google+ API
   - Utwórz OAuth 2.0 Client ID dla:
     - iOS (Bundle ID)
     - Android (Package name + SHA-1)
     - Web (dla fallback)

2. **Konfiguracja Supabase:**
   - Authentication → Providers → Google
   - Włącz Google provider
   - Dodaj Client ID i Client Secret z Google Cloud

3. **Konfiguracja redirect URLs:**
   - Google Cloud Console: `evolync://auth/callback`
   - Supabase: `https://[project-ref].supabase.co/auth/v1/callback`

4. **Build custom native:**
   ```bash
   eas build --platform ios --profile development
   eas build --platform android --profile development
   ```

---

## Debugowanie

### Logowanie nie działa

**Sprawdź:**
1. Console logs w aplikacji (Expo Dev Tools)
2. Network tab - czy request do Supabase jest wysyłany?
3. Supabase Dashboard → Authentication → Users - czy użytkownik istnieje?
4. `.env` - czy zmienne środowiskowe są poprawne?

### Błędy TypeScript

```bash
npx tsc --noEmit
```

### Czyszczenie cache

```bash
# Wyczyść cache Expo
npx expo start --clear

# Wyczyść cache Metro
rm -rf .expo
rm -rf node_modules/.cache

# Pełny restart
npm install
npx expo start --clear
```

---

## Quick Test - Tylko UI (bez Supabase)

Jeśli chcesz tylko przetestować wygląd bez konfiguracji Supabase:

1. Zakomentuj wywołanie `checkSession()` w `app/auth/login.tsx`:
   ```typescript
   useEffect(() => {
     // checkSession(); // ZAKOMENTUJ TĘ LINIĘ
     setIsCheckingSession(false); // DODAJ TĘ LINIĘ
   }, []);
   ```

2. Odpal aplikację:
   ```bash
   npm start
   # Naciśnij i (iOS) lub a (Android) lub w (Web)
   ```

3. Przejdź ręcznie do `/auth/login`:
   - W Expo Dev Tools wpisz URL: `exp://localhost:8081/auth/login`
   - Lub zmodyfikuj `app/index.tsx` żeby zawsze przekierowywać do login

---

## Screenshot checklist

Podczas testowania zrób screenshoty:
- [ ] Ekran logowania (initial state)
- [ ] Formularz z błędami walidacji
- [ ] Loading state (spinner)
- [ ] ErrorBanner z komunikatem
- [ ] Hasło widoczne (toggle ON)
- [ ] Hasło ukryte (toggle OFF)
- [ ] Responsywność - mały ekran
- [ ] Responsywność - duży ekran

---

## Performance checklist

- [ ] Aplikacja startuje w < 3 sekundy
- [ ] Auto-login sprawdza sesję w < 1 sekundę
- [ ] Formularze są responsywne (brak lagów przy pisaniu)
- [ ] Animacje są płynne (60 FPS)
- [ ] Bundle size nie jest zbyt duży

---

## Gotowe do testowania! 🚀

Uruchom aplikację i sprawdź wszystkie punkty z checklisty. Powodzenia!
