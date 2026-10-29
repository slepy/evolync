---
layout: page
feature: sign-in
title: Logowanie
group: account
accent: brand
icon: log-in
order: 2
summary: "Instruktorzy i uczniowie logują się e-mailem i hasłem. Po pierwszym logowaniu aplikacja otwiera się sama, także offline."
purpose: "Daje dostęp do własnych szkół, uczniów i notatek technik. Jedno konto obsługuje obie role: to, co zobaczy użytkownik po zalogowaniu, zależy od tego, czy jest właścicielem organizacji."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Dashboard organizacji"
  - role: "Uczeń albo konto jeszcze bez szkoły"
    outcome: "Dashboard ucznia"
rules:
  - "**Pierwsze** logowanie wymaga internetu. Bez połączenia aplikacja pokazuje *Brak połączenia z internetem* i nie próbuje się logować."
  - "Potem sesja zostaje na urządzeniu. Przy starcie aplikacja loguje sama, **nawet offline i z wygasłym tokenem**: dane są czytane z lokalnej bazy, a sesja odświeża się, gdy urządzenie wróci do sieci."
  - "Jeśli token wygasł i nie da się go odświeżyć online, trzeba zalogować się ponownie (*Twoja sesja wygasła*)."
  - "Język interfejsu wybiera się w rogu ekranu; zapisuje się tylko na urządzeniu."
  - "Logowanie przez Google jest zaimplementowane w kodzie, ale ekran logowania **nie ma przycisku Google**."
messages:
  - situation: "Zły e-mail lub hasło"
    title: "Zły e-mail lub hasło"
    message: "Sprawdź oba pola i spróbuj ponownie. Pierwsze logowanie wymaga połączenia z internetem."
  - situation: "Brak połączenia"
    title: "Błąd połączenia"
    message: "Brak połączenia z internetem. Połącz się z siecią i spróbuj ponownie."
  - situation: "Zbyt wiele prób"
    title: "Zbyt wiele prób"
    message: "Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut."
  - situation: "Nie udało się odświeżyć sesji"
    message: "Twoja sesja wygasła. Zaloguj się ponownie."
  - situation: "Inny błąd"
    title: "Wystąpił błąd"
    message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie lub skontaktuj się z pomocą techniczną."
screens:
  - src: /screens/sign-in/form.png
    caption: "Logowanie"
  - src: /screens/sign-in/wrong-credentials.png
    caption: "Zły e-mail lub hasło"
api: [auth-google]
flows:
  - id: email
    title: "Logowanie e-mailem"
    steps:
      - title: "E-mail i hasło"
        text: "Użytkownik wpisuje e-mail i hasło. W rogu jest wybór języka; *Nie pamiętasz hasła?* i *Zarejestruj się* prowadzą do innych przepływów."
        screen: AuthLogin
      - title: "Zaloguj"
        text: "Aplikacja najpierw sprawdza sieć: offline pokazuje *Brak połączenia z internetem* i kończy. Online loguje w Supabase Auth i zapisuje sesję w SecureStore."
        screen: AuthLogin
        api:
          - { id: auth-sign-in-password, x: 80, y: 68 }
      - title: "Zły e-mail lub hasło"
        text: "Supabase odpowiada `invalid_credentials`. Baner mówi, co poszło nie tak, a pole hasła robi się czerwone. Zbyt wiele prób i błąd sieci mają własne komunikaty."
        screen: AuthLoginError
        api:
          - { id: auth-sign-in-password, x: 86, y: 43 }
      - title: "Kto się loguje"
        text: "Prosto z tabel Supabase: czy użytkownik ma organizację i w których szkołach jest aktywnym członkiem. Oba wyniki zapisują się na urządzeniu na potrzeby startu offline."
        api:
          - { id: organizations-owned }
          - { id: school-members-active }
      - title: "Synchronizacja danych"
        text: "Aplikacja pobiera dane użytkownika do lokalnej bazy w tle. Ekran startowy pokazuje postęp."
        screen: LaunchLoading
        api:
          - { id: sync-pull, x: 72, y: 86 }
      - title: "Dashboard"
        text: "Właściciel organizacji trafia na **dashboard organizacji**, wszyscy pozostali na **dashboard ucznia**."
        screen: Main
    diagram: |
      sequenceDiagram
        actor U as Użytkownik
        participant A as Aplikacja
        participant Auth as Supabase Auth
        participant DB as Baza Supabase
        participant Sync as Edge Function sync
        U->>A: E-mail + hasło, Zaloguj
        A->>A: Sprawdzenie sieci
        alt offline
          A-->>U: Brak połączenia z internetem
        else online
          A->>Auth: signInWithPassword
          alt złe dane
            Auth-->>A: invalid_credentials
            A-->>U: Zły e-mail lub hasło
          else sukces
            Auth-->>A: Sesja (JWT)
            A->>A: Zapis sesji na urządzeniu
            A->>DB: Czy ma organizację?
            A->>DB: Aktywne członkostwa w szkołach
            A-)Sync: Pobranie danych (w tle)
            A-->>U: Dashboard
          end
        end
  - id: startup
    title: "Start aplikacji: automatyczne logowanie"
    steps:
      - title: "Sesja na urządzeniu"
        text: "Przy każdym starcie aplikacja szuka zapisanej sesji. Bez niej otwiera ekran logowania."
        screen: LaunchLoading
      - title: "Wygasły token, online"
        text: "Wygasły access token odświeża się refresh tokenem. Jeśli to się nie uda, zapisane dane są czyszczone i trzeba zalogować się ponownie (*Twoja sesja wygasła*)."
        api:
          - { id: auth-refresh }
      - title: "Offline"
        text: "Offline aplikacja zostaje przy zapisanej sesji, **nawet wygasłej**, i pracuje na lokalnej bazie. Nic nie jest wysyłane, dopóki urządzenie nie wróci do sieci."
        screen: LaunchLoadingOffline
      - title: "Kontekst i synchronizacja"
        text: "Online aplikacja wczytuje na nowo organizację i członkostwa, a potem synchronizuje dane w tle."
        screen: LaunchLoading
        api:
          - { id: organizations-owned }
          - { id: school-members-active }
          - { id: sync-pull, x: 72, y: 86 }
      - title: "Dashboard"
        text: "Użytkownik jest na swoim dashboardzie bez wpisywania czegokolwiek."
        screen: Student
    diagram: |
      flowchart TD
        start([Start aplikacji]) --> stored{Sesja zapisana<br/>na urządzeniu?}
        stored -- nie --> login[Ekran logowania]
        stored -- tak --> expired{Token wygasł?}
        expired -- nie --> online1{Online?}
        online1 -- nie --> ctx[Organizacja i szkoły<br/>z urządzenia]
        online1 -- tak --> check{Sesja ważna<br/>w Supabase?}
        check -- nie --> clear[Czyszczenie zapisanych danych] --> login
        check -- tak --> ctx
        expired -- tak --> online2{Online?}
        online2 -- nie --> ctx
        online2 -- tak --> refresh{Odświeżenie tokenu}
        refresh -- błąd --> expiredMsg[Komunikat: sesja wygasła] --> login
        refresh -- ok --> ctx
        ctx --> sync[Synchronizacja w tle<br/>tylko online]
        sync --> route{Ma organizację?}
        route -- tak --> org[Dashboard organizacji]
        route -- nie --> user[Dashboard ucznia]
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Ekran (route `/auth/login`) | `app/auth/login.tsx` |
| Formularz, baner błędu | `src/modules/auth/components/LoginForm.tsx` |
| Walidacja | `src/modules/auth/validation/loginSchema.ts` |
| Logowanie, auto-logowanie, wylogowanie | `src/modules/auth/hooks/useAuth.ts` |
| Powrót z Google (route `/auth/callback`) | `app/auth/callback.tsx` |
| Wybór dashboardu (route `/`) | `app/index.tsx` |
| Przechowywanie sesji | `src/modules/auth/services/secureStorage.ts` |
| Synchronizacja danych | `src/database/sync.ts` |

Podczas sprawdzania sesji każdy route startowy pokazuje `LaunchScreen`, nigdy spinner.

## Dane na urządzeniu

Natywnie: Expo SecureStore. Web: AsyncStorage.

| Klucz | Zawartość |
| --- | --- |
| `session` | Sesja Supabase (tokeny, użytkownik) |
| `organization` | Własna organizacja `{ id, owner_id, name }` |
| `schoolMemberships` | Aktywne członkostwa w szkołach |
| `activeMembershipId` | Szkoła wybrana w przełączniku kontekstu |

## Mapowanie błędów

`mapSupabaseError` w `useAuth.ts` zamienia błędy Supabase na `invalid_credentials`, `too_many_requests`, `network_error` albo `unknown`; `LoginForm` dobiera tytuł banera po tym kodzie.

## Uwagi

- Odczyt organizacji i członkostw idzie bezpośrednio do tabel Supabase, poza synchronizacją. Działa tylko online, a wynik jest zapisywany na potrzeby startu offline.
- Logowanie offline z wygasłym tokenem korzysta wyłącznie z lokalnej bazy; nic nie jest wysyłane, dopóki token się nie odświeży.
- Logowanie przez Google (`useAuth.signInWithGoogle`, `app/auth/callback.tsx`) działa w kodzie, ale żaden ekran go nie oferuje.

</FeatureView>
