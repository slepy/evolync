# Architektura UI dla Evolync

## 1. Przegląd struktury UI

Architektura UI Evolync została zaprojektowana z myślą o podejściu **Offline-First**, co determinuje sposób prezentacji danych i interakcji z użytkownikiem. Interfejs jest podzielony na dwa główne konteksty (Role): **Instruktor** i **Student**, z wyraźnym rozdzieleniem nawigacji.

Kluczowe założenia:

- **Modularność:** Centralnym punktem jest Dashboard (Szkoły lub Organizacji), z którego użytkownik przechodzi do szczegółowych modułów.
- **Synchronizacja:** UI aktywnie informuje o stanie synchronizacji danych (ikona chmury, blokady akcji wymagających online).
- **Szybkość działania:** Lokalne bazy danych (WatermelonDB) zapewniają natychmiastowy dostęp do list i szczegółów, z "lazy loading" dla długich list.
- **Hierarchia:** Wyraźne rozróżnienie między kontekstem Organizacji (globalne ustawienia) a Szkoły (codzienna praca).

## 2. Lista widoków

### A. Onboarding & Auth (Wspólne)

#### 1. Ekran Powitalny / Logowanie

- **Ścieżka:** `/auth/login`
- **Cel:** Umożliwienie wejścia do aplikacji lub przejścia do rejestracji.
- **Kluczowe informacje:** Logo, pola email/hasło, przycisk "Zaloguj przez Google".
- **Komponenty:** Formularz logowania, Social Auth Buttons.
- **UX/Bezpieczeństwo:** Walidacja inline, bezpieczne przechowywanie tokenów, automatyczne logowanie (trwała sesja).

#### 2. Rejestracja (Wizard)

- **Ścieżka:** `/auth/register`
- **Cel:** Utworzenie konta i określenie początkowej roli.
- **Kluczowe informacje:** Dane użytkownika, opcjonalny kod szkoły.
- **Komponenty:**
  - Krok 1: Dane podstawowe (Email, Hasło, Imię).
  - Krok 2: Wybór ścieżki (Jestem Instruktorem / Mam kod zaproszenia).
  - Krok 3 (Instruktor): Nazwa Organizacji, Nazwa pierwszej Szkoły.
- **UX:** Pasek postępu, jasne instrukcje, walidacja unikalności emaila (wymaga online).

### B. Kontekst Instruktora (`InstructorStack`)

#### 3. Dashboard Szkoły (Hub)

- **Ścieżka:** `/school/:schoolId/dashboard`
- **Cel:** Szybki podgląd stanu szkoły i dostęp do kluczowych funkcji.
- **Kluczowe informacje:** Nazwa szkoły, liczniki (zaległości płatnicze, nowe zamówienia), skróty do modułów.
- **Komponenty:**
  - **Header:** School Switcher (dropdown), Wskaźnik Sync,
  - **Kafelki:** Studenci, Płatności, Zamówienia, Obecności, Komunikacja. Ustawienia
  - **FAB (Floating Action Button):** Szybkie akcje (np. "Nowe ogłoszenie").
- **UX:** Dashboard odświeża się automatycznie po zmianach lokalnych.

#### 3a. Ustawienia Szkoły

- **Ścieżka:** `/school/:schoolId/settings`
- **Cel:** Edycja danych szkoły i zarządzanie jej cyklem życia.
- **Kluczowe informacje:** Nazwa, Adres, Status.
- **Komponenty:**
  - **Formularz:** Edycja nazwy i adresu.
  - **Sekcja Niebezpieczna:** Przycisk "Archiwizuj Szkołę" (wymaga potwierdzenia).
- **Dostęp:** Tylko dla Właściciela (Owner).

#### 4. Lista Studentów

- **Ścieżka:** `/school/:schoolId/students`
- **Cel:** Zarządzanie bazą uczniów (w tym Shadow Users).
- **Kluczowe informacje:** Lista nazwisk, status (Aktywny/Oczekujący/Shadow), status płatności (ikona).
- **Komponenty:**
  - **Sticky Header:** Aktywny kod zaproszenia + przycisk "Generuj".
  - **Lista:** Elementy z awatarem i statusem.
  - **Filtry:** Szukaj, Pokaż tylko dłużników.
- **UX:** Lazy loading, wyraźne rozróżnienie Shadow Userów.

#### 5. Profil Studenta

- **Ścieżka:** `/school/:schoolId/students/:studentId`
- **Cel:** Szczegółowy wgląd w historię ucznia i edycja danych.
- **Kluczowe informacje:** Dane osobowe, historia finansowa, zamówienia.
- **Komponenty:**
  - **Zakładki:** Dane, Finanse, Zamówienia.
  - **Akcje:** "Połącz konto" (dla Shadow), "Edytuj", "Archiwizuj".
- **UX:** Edycja danych zablokowana dla kont połączonych (tylko student może edytować swoje dane), dostępna dla Shadow.

#### 6. Moduł Obecności (Lista Sesji)

- **Ścieżka:** `/school/:schoolId/attendance`
- **Cel:** Przegląd historii treningów i rozpoczęcie sprawdzania obecności.
- **Kluczowe informacje:** Daty treningów, liczba obecnych.
- **Komponenty:** Kalendarz/Lista sesji, Przycisk "Sprawdź obecność teraz".

#### 7. Sprawdzanie Obecności (Aktywna Sesja)

- **Ścieżka:** `/school/:schoolId/attendance/check`
- **Cel:** Szybkie odznaczenie frekwencji.
- **Kluczowe informacje:** Lista aktywnych studentów.
- **Komponenty:** Lista z "toggle" (Domyślnie: Obecny).
- **UX:** Praca offline, szybkie "odklikiwanie" nieobecnych.

#### 8. Finanse i Płatności

- **Ścieżka:** `/school/:schoolId/payments`
- **Cel:** Rejestracja wpłat i monitorowanie dłużników.
- **Kluczowe informacje:** Lista transakcji, podsumowanie miesiąca.
- **Komponenty:** Przycisk "Dodaj wpłatę manualną" (Modal: Wybór studenta, kwota, okres).

#### 9. Zarządzanie Zamówieniami

- **Ścieżka:** `/school/:schoolId/orders`
- **Cel:** Obsługa sklepu szkolnego.
- **Kluczowe informacje:** Zamówienia pogrupowane statusami. Kwoty z odpowiednią walutą produktu (PLN/EUR).
- **Komponenty:**
  - **Zakładki:** Aktywne (z filtrami: Złożone, W realizacji, Do odbioru), Zakończone, Anulowane.
  - **Szczegóły:** Zmiana statusu zamówienia.

#### 10. Dashboard Organizacji (Lista Szkół)

- **Ścieżka:** `/organization/dashboard`
- **Cel:** Zarządzanie globalne i wybór szkoły.
- **Kluczowe informacje:** Lista szkół, ustawienia globalne.
- **Komponenty:**
  - **Lista:** Kafelki szkół z podstawowymi metrykami.
  - **FAB (+):** Przycisk "Dodaj nową szkołę" (wymaga tylko nazwy, działa offline).
  - **Sekcje:** Ustawienia, zamowienia centralne, produkty.

### C. Kontekst Studenta (`StudentStack`)

#### 11. Dashboard Studenta

- **Ścieżka:** `/user/dashboard`
- **Cel:** Centrum informacyjne dla ucznia.
- **Kluczowe informacje:** Status płatności (Priorytet), Ogłoszenia.
- **Komponenty:**
  - **Status Widget:** Duży kafel (Zielony/Czerwony) z datą ważności opłaty.
  - **Siatka:** Zamówienia, Techniki, Sekwencje.
  - **Dla nieprzypisanych:** Przycisk "Dołącz do szkoły" (wpisanie kodu).

#### 12. Sklep Studenta (Katalog)

- **Ścieżka:** `/user/orders`
- **Cel:** Przeglądanie i zamawianie sprzętu.
- **Kluczowe informacje:** Produkty, ceny (z walutą), dostępność.
- **Komponenty:** Lista produktów, Koszyk (Bottom Sheet lub osobny ekran), Historia zamówień.

#### 13. Moje Finanse

- **Ścieżka:** `/user/finances`
- **Cel:** Transparentność rozliczeń.
- **Kluczowe informacje:** Historia wpłat.
- **Komponenty:** Lista pogrupowana latami/miesiącami.

### D. Moduł 3D (Wspólny)

#### 14. Biblioteka Technik/Sekwencji

- **Ścieżka:** `/library`
- **Cel:** Przeglądanie zasobów 3D.
- **Komponenty:** Lista z miniaturami, Filtry (Tagi).

#### 15. Edytor / Przeglądarka 3D

- **Ścieżka:** `/editor/:assetId`
- **Cel:** Tworzenie i wizualizacja ruchu.
- **Komponenty:**
  - **Viewport 3D:** Manekin(y) z Gizmo na stawach.
  - **Toolbar:** Przełącznik modeli (A/B), Reset pozy, Zapisz.
  - **Timeline (Filmstrip):** Zarządzanie krokami sekwencji.
- **UX:** Obsługa gestów (obrót kamery vs IK), wysoka wydajność (60fps).

## 3. Mapa podróży użytkownika

### Scenariusz: Nowy Instruktor zakłada szkołę i dodaje ucznia

1. **Start:** Użytkownik otwiera aplikację -> Ekran Powitalny.
2. **Rejestracja:** Wybiera "Zarejestruj" -> Wypełnia dane -> Wybiera "Załóz organizacje".
3. **Konfiguracja:** Wpisuje nazwę Organizacji ("Klub Walki") i pierwszej Szkoły ("Centrum").
4. **Dashboard:** Ląduje na Dashboardzie Organizacji.
5. **Dodawanie ucznia:** Klika kafel "Studenci" -> "Dodaj ucznia (Shadow)" -> Wpisuje "Jan Kowalski".
6. **Płatność:** Przechodzi do profilu Jana -> Zakładka "Finanse" -> "Dodaj wpłatę" -> Wybiera "Gotówka", "Bieżący miesiąc".
7. **Zaproszenie:** W profilu klika "Połącz konto" -> Wpisuje email Jana -> System wysyła zaproszenie.

### Scenariusz: Student sprawdza technikę i zamawia sprzęt

1. **Start:** Logowanie (lub auto-login).
2. **Dashboard:** Widzi zielony status "Opłacone". Klika "Techniki".
3. **Biblioteka:** Wybiera technikę "Dźwignia prosta".
4. **3D:** Ogląda technikę, obraca kamerą. Wraca do Dashboardu.
5. **Sklep:** Klika "Zamówienia" -> "Katalog".
6. **Zakup:** Wybiera "Rękawice", dodaje do koszyka -> "Zamów".
7. **Status:** Widzi nowe zamówienie ze statusem "Złożone".

## 4. Układ i struktura nawigacji

Aplikacja wykorzystuje **React Navigation** z podziałem na stosy (Stacks) i Tabs.

### Root Navigator

- **AuthStack:** Login, Register.
- **AppStack:** Główna aplikacja (chroniona tokenem).

### AppStack

Logika warunkowa renderuje odpowiedni stos w zależności od roli i kontekstu:

1. **InstructorStack (Bottom Tabs):**
   - **Home:** Dashboard Szkoły (z School Switcherem w nagłówku).
   - **Library:** Biblioteka 3D.
   - **Menu:** Dostęp do ustawień konta.
   - _Modale:_ OrganizationDashboard, AddPayment, EditStudent.

2. **StudentStack (Bottom Tabs):**
   - **Home:** Dashboard Studenta.
   - **Shop:** Katalog i zamówienia.
   - **Library:** Biblioteka 3D (własne notatki + udostępnione).
   - **Profile:** Ustawienia i finanse.

### School Switcher (Komponent Nawigacyjny)

Specjalny komponent w nagłówku `InstructorStack`.

- Kliknięcie rozwija listę dostępnych szkół.
- Ostatnia pozycja listy: "Zarządzaj Organizacją" -> Otwiera `OrganizationDashboard` (FullScreen Modal).

## 5. Kluczowe komponenty

- **SyncIndicator:** Ikona w nagłówku (Chmura).
  - _Stan:_ Zielona (Zsynchro), Żółta (W trakcie), Przekreślona (Offline/Błąd).
  - _Akcja:_ Kliknięcie wymusza próbę synchronizacji lub pokazuje log błędów.
- **SchoolSwitcher:** Dropdown w nagłówku Dashboardu Instruktora pozwalający na zmianę kontekstu danych (filtrowanie bazy WatermelonDB po `school_id`).
- **3DViewport:** Komponent renderujący scenę (np. React Three Fiber / Expo GL). Obsługuje gesty dotykowe dla kamery i Raycasting dla Gizmo (IK).
- **OfflineBanner:** Pasek informacyjny pojawiający się, gdy urządzenie traci połączenie ("Pracujesz w trybie offline. Zmiany zostaną zapisane lokalnie").
- **ActionCard:** Kafel na Dashboardzie zawierający ikonę, tytuł i opcjonalny licznik (Badge) powiadamiający o akcjach wymagających uwagi (np. "3" przy Zamówieniach).
- **StatusBadge:** Uniwersalny komponent do wyświetlania statusów (Płatności, Zamówienia, Obecność) z jednolitym kodowaniem kolorystycznym (Zielony/Żółty/Czerwony/Szary).
