# Dokument Wymagań Produktu (PRD) - Moduł Wydarzeń (Events)

## 1. Przegląd

Moduł Wydarzeń rozszerza funkcjonalność aplikacji Evolync o możliwość organizowania i zarządzania inicjatywami takimi jak seminaria, obozy, warsztaty czy spotkania integracyjne. Moduł służy celom informacyjnym oraz ewidencji zapisów i płatności gotówkowych, działając w zgodzie z filozofią Offline-First.

## 2. Wymagania Funkcjonalne

### 2.1. Model Danych Wydarzenia

Każde wydarzenie opisane jest następującymi atrybutami:

- **Dane informacyjne:**
  - **Nazwa:** Tytuł wydarzenia.
  - **Krótka notatka:** Zwięzły tekst widoczny bezpośrednio na liście wydarzeń (np. "Wymagane ochraniacze").
  - **Adres:** Pole tekstowe (String) określające lokalizację.
- **Czas trwania:**
  - System obsługuje ciągły zakres dat (Data rozpoczęcia - Data zakończenia).
  - Wydarzenia mogą trwać jeden lub więcej dni.
- **Finanse:**
  - **Cena:** Kwota za udział.
  - **Waluta:** Wybierana z listy per wydarzenie (niezależna od waluty szkoły).

### 2.2. Widoczność Wydarzeń

System obsługuje 3 poziomy widoczności definiowane przy tworzeniu wydarzenia:

1. **Poziom Organizacji:** Wydarzenie widoczne dla wszystkich członków wszystkich szkół w danej Organizacji.
2. **Poziom Szkoły:** Wydarzenie widoczne tylko dla członków konkretnej, wskazanej szkoły.
3. **Poziom Wybranych Użytkowników:** Wydarzenie widoczne tylko dla wskazanych osób ("Whitelist").
   - Interfejs wyboru użytkowników grupuje ich szkołami.
   - Możliwość wyboru użytkowników "Shadow" (bez konta).

### 2.3. System Statusów i Zapisów

- **Statusy uczestnictwa:**
  1. `Nieobecny` (Domyślny).
  2. `Biorę udział` (RSVP - deklaracja).
  3. `Opłacono` (Potwierdzenie finansowe).
- **Logika przejść:**
  - **Student:** Może przełączać się między `Nieobecny` a `Biorę udział`. Nie może zmienić statusu, jeśli jest on ustawiony na `Opłacono`.
  - **Instruktor/Owner:** Ma pełną kontrolę. Może ustawić dowolny status dla każdego ucznia (również Shadow Usera). Ustawienie statusu `Opłacono` blokuje możliwość rezygnacji przez studenta.

### 2.4. Zarządzanie Cyklem Życia Wydarzenia (CRUD)

- **Tworzenie:** Dostępne dla Instruktora/Ownera.
- **Edycja:** Możliwość zmiany danych (ceny, dat, lokalizacji) oraz zarządzania listą widoczności (dodawanie nowych osób).
  - Zmiana ceny aktualizuje widok dla nowych zapisów; dla opłaconych cena powinna być historycznie zachowana (lub systemowo "zamrożona" - do decyzji implementacyjnej).
- **Usuwanie:**
  - Dozwolone całkowite usunięcie rekordu TYLKO, gdy żaden uczestnik nie ma statusu `Opłacono`.
- **Anulowanie:**
  - Jeśli istnieją wpłaty (`Opłacono`), wydarzenie nie może być usunięte, a jedynie oznaczone jako **`Anulowane`**. Rekord pozostaje w systemie do rozliczeń.

## 3. Interfejs Użytkownika (UX/UI)

### 3.1. Lokalizacja i Nawigacja

- Główny punkt dostępu: Nowa ikona/sekcja w widoku Organizacji (dostępna z poziomu nadrzędnego nad szkołami).

### 3.2. Widok Listy Wydarzeń

- **Sortowanie:** Chronologiczne, najbliższe nadchodzące wydarzenia na górze.
- **Karta Wydarzenia:** Musi zawierać:
  - Nazwę.
  - Datę/Zakres dat.
  - Cenę i Walutę.
  - Krótką Notatkę
  - Aktualny status użytkownika (np. "Opłacono").
- **Filtrowanie:** Przełącznik lub filtr widoku: **"Nadchodzące"** vs **"Historyczne"**. Wydarzenia przeszłe są domyślnie ukryte.

## 4. Logika Biznesowa i Ograniczenia (Constraints)

1. **Offline-First:**
   - Wszystkie akcje (zapisy, zmiany statusów) działają offline.
   - Konflikty: Władza Instruktora jest nadrzędna przy synchronizacji statusów.
2. **Brak Limitów:**
   - System nie pilnuje limitu miejsc (Overbooking jest dozwolony).
3. **Uczestnicy:**
   - Brak obsługi gości "z ulicy" (spoza bazy użytkowników systemu).
   - Uczestnikiem może być User z aplikacją lub Shadow User.
4. **Zakres:**
   - Brak płatności online (tylko ewidencja gotówki).
   - Brak Push Notyfikacji w wersji MVP.
   - Brak integracji z mapami (adres to tekst).
   - Moduł nie jest powiązany z Egzaminami ani Planami Treningowymi 3D.
