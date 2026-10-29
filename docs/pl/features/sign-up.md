---
layout: page
feature: sign-up
title: Rejestracja
group: account
accent: brand
icon: user-plus
order: 1
summary: "Nowa osoba zakłada konto. Instruktor od razu dostaje organizację z pierwszą szkołą, uczeń dostaje konto i w następnym kroku dołącza do szkoły kodem."
purpose: "Właściciel szkoły zaczyna korzystać z Evolync bez żadnej konfiguracji po naszej stronie, a uczeń może założyć konto, zanim dostanie kod od instruktora."
who:
  - role: "**Prowadzę szkołę**: instruktor, właściciel"
    outcome: "Konto + organizacja + role + pierwsza szkoła, potem dashboard organizacji"
  - role: "**Trenuję w szkole**: uczeń"
    outcome: "Tylko konto, potem Dołącz do szkoły (można pominąć)"
rules:
  - "Rejestracja wymaga internetu."
  - "Potwierdzanie e-maila jest wyłączone: konto jest zalogowane od razu po utworzeniu."
  - "Hasło: co najmniej 8 znaków, wielka litera, mała litera, cyfra i jeden z `@ $ ! % * ? &`; innych znaków nie wolno używać. Chipy pod polem pokazują, które zasady są spełnione. Hasło wpisuje się dwa razy."
  - "Instruktor: imię i nazwisko (min. 2 znaki), nazwa organizacji i pierwszej szkoły (min. 3 znaki każda). Kolejne szkoły dodaje się później."
  - "Uczeń: imię i nazwisko oraz telefon są opcjonalne. Telefon to prefiks kraju i 4–15 cyfr."
  - "Jeden e-mail = jedno konto. Jeśli e-mail należy do konta, które starsza wersja aplikacji zostawiła bez organizacji, to samo hasło dokańcza je organizacją zamiast zwracać błąd."
messages:
  - situation: "E-mail już zarejestrowany"
    message: "Ten adres email jest już zarejestrowany"
  - situation: "Inny błąd"
    message: "Rejestracja nie powiodła się. Spróbuj ponownie."
screens:
  - src: /screens/sign-up/account-type.png
    caption: "Rodzaj konta"
  - src: /screens/sign-up/organization.png
    caption: "Prowadzę szkołę: nowa organizacja"
  - src: /screens/sign-up/student.png
    caption: "Trenuję w szkole: nowe konto"
flows:
  - id: instructor
    title: "Instruktor: Prowadzę szkołę"
    steps:
      - title: "Rodzaj konta"
        text: "*Zarejestruj się* na ekranie logowania otwiera wybór. Instruktor wybiera **Prowadzę szkołę**."
        screen: AuthRegisterType
      - title: "Konto i organizacja"
        text: "Jeden formularz: imię i nazwisko, e-mail, hasło dwa razy, nazwa organizacji i pierwszej szkoły. Chipy pod hasłem zapalają się, gdy zasady są spełnione."
        screen: AuthRegisterOrganization
      - title: "Konto i organizacja naraz"
        text: "Rejestracja wysyła z kontem nazwy organizacji i szkoły. Trigger w bazie tworzy organizację, role Owner / Instructor / Student i pierwszą szkołę w tej samej transakcji: jeśli coś się nie uda, konto też nie powstaje."
        api:
          - { id: auth-sign-up }
      - title: "Odczyt organizacji"
        text: "Aplikacja odczytuje id nowej organizacji. Gdy e-mail był zajęty przez konto bez organizacji, loguje się tym samym hasłem i tworzy organizację przez `setup_instructor_organization`."
        api:
          - { id: organizations-owned }
          - { id: setup-instructor-organization }
      - title: "Dashboard organizacji"
        text: "Sesja i organizacja zapisują się na urządzeniu; otwiera się dashboard, a pierwsza synchronizacja idzie w tle."
        screen: Main
        api:
          - { id: sync-pull, x: 86, y: 10 }
    diagram: |
      sequenceDiagram
        actor U as Instruktor
        participant A as Aplikacja
        participant Auth as Supabase Auth
        participant DB as Baza Supabase
        participant Sync as Edge Function sync
        U->>A: Konto + organizacja + pierwsza szkoła, Utwórz
        A->>Auth: signUp (e-mail, hasło, nazwy organizacji i szkoły)
        Note over Auth,DB: trigger w tej samej transakcji:<br/>organizacja, role Owner / Instructor / Student,<br/>pierwsza szkoła
        Auth-->>A: Użytkownik + sesja
        A->>DB: Własna organizacja
        DB-->>A: organization_id
        A->>A: Zapis sesji i organizacji na urządzeniu
        A-->>U: Dashboard organizacji
        A-)Sync: Pobranie danych (w tle)
  - id: student
    title: "Uczeń: Trenuję w szkole"
    steps:
      - title: "Rodzaj konta"
        text: "Uczeń wybiera **Trenuję w szkole**."
        screen: AuthRegisterType
      - title: "Nowe konto"
        text: "Wymagane są tylko e-mail i hasło; imię i telefon są opcjonalne. Karta na dole zapowiada, że następny krok to kod szkoły."
        screen: AuthRegisterStudent
      - title: "Utworzenie konta"
        text: "Supabase Auth tworzy użytkownika z imieniem i telefonem w metadanych; aplikacja synchronizuje dane w tle."
        api:
          - { id: auth-sign-up }
          - { id: sync-pull }
      - title: "Dołącz do szkoły"
        text: "Aplikacja przechodzi od razu do [Dołączenia do szkoły](./join-school). Wstecz i Gotowe prowadzą tam do dashboardu ucznia, nigdy z powrotem do rejestracji."
        screen: JoinSchool
    diagram: |
      sequenceDiagram
        actor U as Uczeń
        participant A as Aplikacja
        participant Auth as Supabase Auth
        participant Sync as Edge Function sync
        U->>A: E-mail, hasło (imię, telefon opcjonalnie), Utwórz
        A->>Auth: signUp (e-mail, hasło, imię i nazwisko, telefon)
        Auth-->>A: Użytkownik + sesja
        A-)Sync: Synchronizacja (w tle)
        A-->>U: Dołącz do szkoły
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Rodzaj konta (route `/auth/register`) | `app/auth/register/index.tsx`, `AccountTypeOption.tsx` |
| Formularz instruktora (route `/auth/register/instructor`) | `src/modules/auth/components/RegisterInstructorForm.tsx` |
| Formularz ucznia (route `/auth/register/user`) | `src/modules/auth/components/RegisterForm.tsx` |
| Pola hasła i chipy zasad | `PasswordFields.tsx`, `PasswordRules.tsx`, `utils/passwordRules.ts` |
| Walidacja | `src/modules/auth/validation/registerSchema.ts` |
| Rejestracja instruktora | `hooks/useRegisterInstructor.ts`, `services/registerInstructor.ts`, `services/instructorSignUp.ts` |
| Rejestracja ucznia | `hooks/useRegister.ts`, `services/register.ts` |
| Konfiguracja organizacji (SQL) | trigger `handle_new_user_signup` w `supabase/migrations/20261026000100_instructor_signup_in_one_transaction.sql`; `setup_instructor_organization` dla kont bez organizacji |

## Dane

- `full_name` (u ucznia też `phone_number`, u instruktora `organization_name` i `school_name`) trafia do metadanych użytkownika w Supabase Auth.
- Organizacja instruktora zapisuje się na urządzeniu pod kluczem `organization`, więc aplikacja startuje na dashboardzie organizacji także offline.

## Uwagi

- **Jedna transakcja.** Organizację instruktora tworzy trigger `on_auth_user_created` przy wstawieniu do `auth.users`, więc rejestracja albo udaje się w całości, albo nic nie zostaje. Konta, które starsze wersje aplikacji zostawiły bez organizacji, są dokańczane przy kolejnej rejestracji tym samym hasłem.
- **Komunikaty walidacji podążają za językiem.** Schematy są budowane przez `localizedSchema` przy wyświetleniu formularza, a błędy widoczne na ekranie są sprawdzane ponownie po zmianie języka.

</FeatureView>
