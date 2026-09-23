# Dokument wymagań produktu (PRD) - Evolync

## 1. Przegląd produktu

Evolync to kompleksowa aplikacja mobilna typu cross-platform (React Native), która łączy w sobie funkcjonalności systemu zarządzania szkołą sportową (CRM) z zaawansowanym narzędziem do wizualizacji i notowania technik ruchowych w środowisku 3D. System został zaprojektowany z myślą o pracy w trybie offline-first, co jest kluczowe dla instruktorów prowadzących zajęcia w miejscach o ograniczonym zasięgu internetu.

Aplikacja obsługuje dwie główne role:

* **Instruktor:** Zarządza szkołami, studentami, płatnościami, zamówieniami sprzętu oraz tworzy plany treningowe oparte na wizualizacjach 3D.
* **Student:** Monitoruje swój status płatności, zamawia sprzęt, odbiera komunikaty od trenera oraz tworzy własne, prywatne notatki techniczne w 3D.

## 2. Problem użytkownika

Instruktorzy sportów walki i dyscyplin ruchowych borykają się z rozproszeniem narzędzi organizacyjnych (papierowe listy obecności, zeszyty płatności, komunikatory) oraz trudnością w utrwalaniu i planowaniu skomplikowanych sekwencji ruchowych.

* **Brak centralizacji:** Zarządzanie obecnością, płatnościami i zamówieniami odbywa się manualnie, co prowadzi do błędów i braku przejrzystości.
* **Ograniczona komunikacja:** Informacje o odwołanych zajęciach lub nowym sprzęcie giną w grupowych czatach.
* **Ulotność wiedzy:** Studenci zapominają techniki poznane na seminariach, a notatki tekstowe są niewystarczające do opisania ruchu w przestrzeni 3D.
* **Problemy z zasięgiem:** Wiele sal treningowych (piwnice, hale) nie ma dostępu do internetu, co wyklucza użycie typowych systemów SaaS opartych na chmurze.

## 3. Wymagania funkcjonalne

### 3.1. System Uwierzytelniania i Zarządzania Kontem

* Rejestracja i logowanie za pomocą adresu e-mail oraz Google OAuth (Supabase Auth).
* **Trwałe logowanie:** Sesja użytkownika jest zapamiętywana w bezpiecznym magazynie urządzenia. Aplikacja nie wymaga logowania przy każdym uruchomieniu, co jest warunkiem koniecznym dla działania offline.
* **Organizacja:** Automatyczne tworzenie "Organizacji" dla nowego Instruktora po rejestracji. Instruktor staje się jej właścicielem.
* **Role:** Role nie są zdefiniowane globalnie. Właściciel Organizacji (Owner) jest określony przez relację z Organizacją. Pozostałe uprawnienia (Instruktor, Student) wynikają z przypisanej roli w tabeli `organization_roles` powiązanej z członkostwem w szkole.
* **Mechanizm "Kodu Szkoły":** Instruktor generuje kody zaproszeń (osobna tabela); Student używa kodu do przypisania się do szkoły i otrzymania roli.
* **Shadow Users (Uczniowie Zarządzani):** Możliwość dodawania uczniów bez konta (tylko imię/nazwisko) w celu prowadzenia ewidencji.
* **Account Linking:** Mechanizm łączenia konta "Shadow" z prawdziwym użytkownikiem poprzez adres e-mail.
* Proces akceptacji: Konto studenta wymaga zatwierdzenia przez Instruktora.
* Archiwizacja: Możliwość przeniesienia studenta do archiwum z zachowaniem historii finansowej.

### 3.2. Panel Ownera

* **Zarządzanie Szkołami:**
  * **Lista Szkół:** Widok startowy dla Ownera. Lista kafelkowa szkół z opcją wejścia w dashboard.
  * **Dodawanie Szkoły:** Możliwość dodania nowej szkoły bezpośrednio z listy (FAB). Wymagana tylko nazwa szkoły. Działa offline (generowanie ID lokalnie).
  * **Edycja:** Zmiana nazwy i adresu szkoły możliwa w dedykowanej zakładce "Ustawienia" wewnątrz dashboardu szkoły.
  * **Archiwizacja:** Możliwość zarchiwizowania szkoły (ukrycie na liście, zachowanie danych).
* **Zarządzanie Studentami:**
  * Jednolita lista studentów (z aplikacją i bez).
  * Sprawdzanie obecności (offline) dla wszystkich typów użytkowników.
  * Podgląd statusu płatności.
  * **Ograniczenia:** W MVP instruktorzy (nie-ownerzy) nie są współdzieleni między szkołami.
* **Finanse:** Definiowanie cykli rozliczeniowych, ręczne oznaczanie wpłat.
* **Sprzęt:** Katalog produktów przypisany do Organizacji.
  * **Walutowość:** Obsługa wielu walut na poziomie produktu (jeden produkt może być w PLN, inny w EUR). Cena i waluta są przypisane do produktu.
  * Obsługa stanów magazynowych (ilość dostępna od ręki) oraz historii cen w zamówieniach.
* **Komunikacja:** Publikowanie ogłoszeń z priorytetem (Normalny, Wysoki). Śledzenie potwierdzeń przeczytania przez studentów.

### 3.3. Edytor i Przeglądarka 3D

* **Silnik 3D:** Wyświetlanie uniwersalnego modelu manekina.
* **Sceny Multi-Actor:** Możliwość dodania drugiego modelu (Partner/Przeciwnik) do sceny w celu prezentacji technik parterowych lub sparingowych.
* **Sterowanie:** Inverse Kinematics (IK) z interakcją "Drag & Drop".
* **Struktura Danych 3D:**
  * **Technika (Atom):** Ustawienie dla konkretnej części ciała (np. lewa ręka, tułów).
  * **Krok (Step):** Zbiór technik w jednym momencie czasu dla jednego lub obu modeli.
  * **Sekwencja:** Uporządkowana lista kroków z czasem trwania.
* **Metadane:** Tagi (prywatne) i Komentarze (współdzielone w Organizacji) dostępne dla Technik, Sekwencji i Kroków.
* **Prywatność:** Zasoby są prywatne dla twórcy (przypisane do użytkownika).

### 3.4. Planer Treningowy (Tylko Instruktor)

* Tworzenie planów treningowych składających się z uporządkowanych Sekwencji.
* Możliwość kopiowania planów między różnymi szkołami.
* Plany są widoczne wyłącznie dla instruktora (pomoc dydaktyczna).

### 3.5. Panel Studenta

* Podgląd statusu płatności (Opłacone / Zaległe).
* Składanie zamówień na sprzęt z katalogu szkoły.
* Odczyt ogłoszeń od instruktora.
* Dostęp do własnego edytora 3D (tworzenie notatek).

### 3.6. Architektura Systemu

* **Hierarchia:** Organizacja (Właściciel) -> Szkoły. Użytkownik może należeć do wielu szkół z różnymi rolami. Zasoby -> Użytkownik.
* **Offline-first:** Pełna funkcjonalność bez dostępu do sieci.
* **Synchronizacja:** Rozwiązywanie konfliktów metodą "Last write wins" po odzyskaniu połączenia.
* **Backend:** Supabase (PostgreSQL).

## 4. Granice produktu

* **Brak płatności online:** Aplikacja nie przetwarza transakcji finansowych, służy jedynie jako rejestr wpłat gotówkowych/przelewów zewnętrznych.
* **Brak animacji:** Techniki są prezentowane jako statyczne klatki, nie jako płynne animacje wideo.
* **Brak współdzielenia edycji:** Nie ma możliwości wspólnej pracy nad jednym modelem 3D w czasie rzeczywistym.
* **Brak udostępniania planów:** Studenci nie widzą planów treningowych przygotowanych przez trenera.

## 5. Historyjki użytkowników

### Uwierzytelnianie i Bezpieczeństwo

* **US-000**
  * **Tytuł:** Rejestracja Instruktora i utworzenie Organizacji
  * **Opis:** Jako nowy Instruktor, chcę założyć konto w aplikacji, aby automatycznie otrzymać własną przestrzeń (Organizację) i móc rozpocząć zarządzanie szkołami.
  * **Kryteria akceptacji:**
    * Rejestracja wymaga podania adresu e-mail i hasła LUB użycia konta Google.
    * Po pomyślnej rejestracji system automatycznie tworzy nową "Organizację" oraz domyślne role (np. Instruktor, Student).
    * Zarejestrowany użytkownik zostaje przypisany jako Właściciel Organizacji.
    * Użytkownik uzyskuje dostęp do panelu Instruktora.

* **US-000a**
  * **Tytuł:** Trwałe logowanie i dostęp offline
  * **Opis:** Jako Użytkownik, chcę, aby aplikacja pamiętała moje logowanie po ponownym uruchomieniu, abym mógł korzystać z niej natychmiast, również w miejscach bez dostępu do internetu.
  * **Kryteria akceptacji:**
    * Po pierwszym zalogowaniu (online), kolejne uruchomienia aplikacji pomijają ekran logowania.
    * Aplikacja uruchamia się poprawnie w trybie offline, korzystając z zapisanej sesji.
    * Wylogowanie jest możliwe tylko na żądanie użytkownika (przycisk "Wyloguj").

* **US-001**
  * **Tytuł:** Rejestracja konta użytkownika (Student)
  * **Opis:** Jako nowy użytkownik (Student), chcę założyć konto w aplikacji podając swoje dane lub używając Google, aby uzyskać dostęp do systemu, nawet jeśli nie mam jeszcze kodu szkoły.
  * **Kryteria akceptacji:**
    * Rejestracja możliwa przez Email (wymagane: Email, Hasło) lub Google OAuth.
    * Po pomyślnej rejestracji tworzone jest konto użytkownika (Auth).
    * Użytkownik po rejestracji nie jest przypisany do żadnej szkoły (brak dostępu do treści szkoły).

* **US-001a**
  * **Tytuł:** Dołączenie do szkoły za pomocą kodu
  * **Opis:** Jako zalogowany Student, chcę wpisać kod otrzymany od trenera, aby powiązać swoje konto ze szkołą.
  * **Kryteria akceptacji:**
    * Funkcja dostępna dla zalogowanego użytkownika nieprzypisanego do szkoły (lub chcącego dołączyć do kolejnej).
    * System waliduje poprawność i ważność czasową kodu.
    * Po wpisaniu poprawnego kodu tworzone jest powiązanie użytkownika ze szkołą ze statusem "Oczekujący" oraz przypisywana jest rola zdefiniowana w zaproszeniu.
    * Użyty kod staje się nieważny dla tego użytkownika (zabezpieczenie przed wielokrotnym użyciem tego samego kodu przez jedną osobę).

* **US-002**
  * **Tytuł:** Akceptacja studenta przez instruktora
  * **Opis:** Jako Instruktor, chcę otrzymywać powiadomienia o nowych rejestracjach i mieć możliwość ich akceptacji, aby mieć kontrolę nad tym, kto ma dostęp do danych szkoły.
  * **Kryteria akceptacji:**
    * Instruktor widzi listę oczekujących studentów.
    * Zatwierdzenie zmienia status studenta na "Aktywny" i daje mu dostęp do funkcji aplikacji.
    * Odrzucenie usuwa prośbę o dołączenie.

* **US-010**
  * **Tytuł:** Dodawanie nowej szkoły (Offline)
  * **Opis:** Jako Właściciel Organizacji, chcę dodać nową szkołę z poziomu listy szkół, aby móc zarządzać kolejną placówką bez konieczności konfiguracji przez web/support.
  * **Kryteria akceptacji:**
    * Przycisk "+" (FAB) na liście szkół widoczny tylko dla Ownera.
    * Formularz wymaga tylko nazwy szkoły.
    * Szkoła tworzona jest natychmiastowo lokalnie (UUID) i widoczna na liście.
    * Po utworzeniu następuje automatyczne przekierowanie do dashboardu nowej szkoły.

* **US-011**
  * **Tytuł:** Archiwizacja szkoły
  * **Opis:** Jako Właściciel, chcę zarchiwizować nieaktywną szkołę, aby nie zaśmiecała mi listy, ale zachować jej historię finansową.
  * **Kryteria akceptacji:**
    * Opcja "Archiwizuj" dostępna w ustawieniach szkoły.
    * Szkoła znika z głównej listy lub trafia do sekcji "Archiwum".
    * Dane (studenci, transakcje) nie są usuwane z bazy.

* **US-012**
  * **Tytuł:** Obsługa wielu walut produktów
  * **Opis:** Jako Instruktor, chcę zdefiniować cenę produktu "Kimono" w EUR, a "Ochraniacze" w PLN, ponieważ zamawiam je od różnych dostawców.
  * **Kryteria akceptacji:**
    * Podczas dodawania/edycji produktu mogę wybrać walutę z listy.
    * W zamówieniu i podsumowaniu płatności widoczna jest właściwa waluta przy każdej pozycji.

### Zarządzanie Szkołami i Studentami

* **US-003**
  * **Tytuł:** Sprawdzanie obecności offline (Hybrid List)
  * **Opis:** Jako Instruktor, chcę zaznaczyć obecność zarówno studentów z aplikacją, jak i tych bez konta ("Shadow"), aby mieć pełną ewidencję frekwencji w jednym miejscu.
  * **Kryteria akceptacji:**
    * Lista studentów zawiera oznaczenia (np. ikony) rozróżniające typ konta.
    * Możliwość zaznaczenia obecności dla obu typów użytkowników.
    * Dane synchronizują się po odzyskaniu połączenia.

* **US-003a**
  * **Tytuł:** Dodawanie ucznia bez konta (Shadow User)
  * **Opis:** Jako Instruktor, chcę dodać do listy ucznia podając tylko jego imię i nazwisko, aby móc od razu rejestrować jego wpłaty i obecność.
  * **Kryteria akceptacji:**
    * Formularz dodawania ucznia z polem "Imię i Nazwisko" (wymagane) i "Email" (opcjonalne).
    * Uczeń pojawia się na liście natychmiast.

* **US-003b**
  * **Tytuł:** Łączenie konta Shadow z aplikacją
  * **Opis:** Jako Instruktor, chcę wysłać zaproszenie do ucznia "Shadow", aby po rejestracji jego historia (obecność, wpłaty) została automatycznie przypisana do nowego konta.
  * **Kryteria akceptacji:**
    * System wysyła zaproszenie na podany email.
    * Po rejestracji z tym samym emailem, konto Shadow jest konwertowane na konto połączone.

* **US-004**
  * **Tytuł:** Rejestracja wpłaty manualnej
  * **Opis:** Jako Instruktor, chcę oznaczyć w aplikacji, że student zapłacił gotówką za bieżący miesiąc, aby system przestał wyświetlać go jako dłużnika.
  * **Kryteria akceptacji:**
    * Instruktor może zmienić status płatności studenta na "Opłacony" dla danego okresu.
    * Data wpłaty jest rejestrowana w historii.
    * Student natychmiast widzi zmianę statusu (po synchronizacji).

* **US-005**
  * **Tytuł:** Zarządzanie zamówieniami sprzętu
  * **Opis:** Jako Instruktor, chcę zmienić status zamówienia studenta na "Do odbioru", aby wiedział, że może odebrać rękawice na najbliższym treningu.
  * **Kryteria akceptacji:**
    * Instruktor widzi listę wszystkich aktywnych zamówień.
    * Możliwość zmiany statusu z "W realizacji" na "Do odbioru".
    * Zmiana statusu generuje powiadomienie dla studenta.

* **US-006a**
  * **Tytuł:** Edycja sceny z dwoma modelami
  * **Opis:** Jako Instruktor, chcę dodać drugiego manekina do sceny i ustawić go w pozycji "żółwia", aby zademonstrować technikę duszenia zza pleców.
  * **Kryteria akceptacji:**
    * Przycisk "Dodaj Partnera" wstawia drugi model do sceny.
    * Możliwość przełączania aktywnego modelu (edycja IK działa na wybranym).
    * Możliwość obracania i przesuwania całego modelu względem drugiego.

### Edytor 3D

* **US-006**
  * **Tytuł:** Tworzenie pozy za pomocą IK
  * **Opis:** Jako Użytkownik (Instruktor/Student), chcę ustawić pozę manekina przeciągając jego rękę w wybrane miejsce, aby szybko odwzorować technikę bez ręcznego ustawiania każdego stawu.
  * **Kryteria akceptacji:**
    * Mechanizm Inverse Kinematics automatycznie dopasowuje położenie ramienia i przedramienia przy ruchu dłonią.
    * Interakcja odbywa się poprzez gest "Drag & Drop".
    * Możliwość zablokowania stóp w miejscu podczas ruchu tułowia.

* **US-007**
  * **Tytuł:** Zapisywanie sekwencji techniki
  * **Opis:** Jako Instruktor, chcę zapisać serię 3 klatek przedstawiających wejście w dźwignię, dodać do niej tytuł i tagi, aby móc ją później wykorzystać w planie treningowym.
  * **Kryteria akceptacji:**
    * Możliwość dodawania kolejnych klatek (snapshotów) do jednej techniki.
    * Formularz zapisu zawiera pola: Tytuł, Opis, Tagi.
    * Technika zapisuje się w prywatnej bibliotece użytkownika.

### Panel Studenta

* **US-008**
  * **Tytuł:** Zamawianie sprzętu
  * **Opis:** Jako Student, chcę wybrać ochraniacze z listy dostępnego sprzętu i złożyć zamówienie, aby instruktor wiedział, co dla mnie sprowadzić.
  * **Kryteria akceptacji:**
    * Widok katalogu ze zdjęciem (opcjonalnie), nazwą i ceną.
    * Przycisk "Zamów" tworzy nowe zamówienie ze statusem "Złożone".
    * Student widzi historię i status swoich zamówień.

* **US-009**
  * **Tytuł:** Podgląd statusu płatności
  * **Opis:** Jako Student, chcę widzieć na ekranie głównym, czy mam opłacony bieżący okres, aby uniknąć nieporozumień z trenerem.
  * **Kryteria akceptacji:**
    * Wyraźny wskaźnik statusu (np. Zielony - Opłacone, Czerwony - Nieopłacone).
    * Informacja o dacie końcowej bieżącego okresu rozliczeniowego.

## 6. Metryki sukcesu

* **Wydajność 3D:** Utrzymanie stałych 60 klatek na sekundę (FPS) podczas manipulacji modelem na urządzeniach ze średniej półki (np. 3-letnie smartfony).
* **Szybkość tworzenia:** Średni czas potrzebny na stworzenie prostej pozy (ustawienie 4 kończyn) przez wprawnego użytkownika poniżej 30 sekund.
* **Niezawodność synchronizacji:** 100% skuteczność synchronizacji danych (obecność, płatności) po powrocie urządzenia do strefy online (brak utraty danych).
* **Adopcja funkcji:** 80% aktywnych studentów sprawdza ogłoszenia w aplikacji w ciągu 24h od publikacji.
