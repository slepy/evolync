# Product Requirements Document (PRD): Edytor i Przeglądarka 3D

## 1. Wstęp

Celem modułu jest dostarczenie narzędzia umożliwiającego userom aplikacji wizualizację technik oraz sekwencji ruchów przy użyciu modeli 3D. System działa w modelu **Offline-First**, a wszystkie tworzone zasoby są domyślnie **Prywatne** (przypisane do konta twórcy).

## 2. Kluczowe Założenia Techniczne

- **Silnik:** React Three Fiber (R3F) na silniku Expo.
- **Prywatność:** Brak udostępniania publicznego. Synchronizacja zasobów 3D odbywa się wyłącznie w ramach konta użytkownika.
- **Platforma:** Mobile (iOS/Android).
  - **Edytor:** Wymuszona orientacja pozioma (Landscape).
  - **Przeglądarka:** Dowolna orientacja (Landscape/Portrait).
- **Multimedia:** Rezygnacja z eksportu wideo i nagrywania audio w wersji MVP.

## 3. Specyfikacja Funkcjonalna: Edytor 3D

### 3.1. Scena i Modele

- **Multi-Actor:** Obsługa do 2 modeli (Main Actor + Partner).
  - **Main Actor:** Zakotwiczony centralnie.
  - **Partner:** Opcjonalny, wyróżniony kolorem (np. czerwony).
- **Wizualizacja Zasięgu:** System wyświetla wizualne ostrzeżenie (np. czerwona linia), gdy modele są zbyt daleko od siebie.
- **Reset:** Funkcja przywracająca modele do "Pozycji Neutralnej" (stopy blisko siebie, ręce wzdłuż ciała) bez usuwania partnera ze sceny.

### 3.2. Sterowanie (Inverse Kinematics)

- **System:** Drag & Drop IK Targetów (nadgarstki, kostki, biodra).
- **Selekcja:** Kliknięcie w część ciała aktywuje ją (podświetlenie). Kliknięcie w tło odznacza.
- **Mirroring:** Przycisk "Zastosuj lustrzane odbicie", który kopiuje ustawienie z lewej strony na prawą (akcja jednorazowa, nie realtime).

### 3.3. Obsługa Dłoni (Hand Presets)

Rozdzielenie kształtu dłoni od jej orientacji w przestrzeni.

1. **Kształt (Preset):** Użytkownik wybiera zdefiniowany układ palców z menu ikonowego:
   - Pięść
   - Otwarta dłoń
   - Chwyt (Palce zgięte)
   - Cięcie (Palce złączone)
   - Wskazujący/Środkowy
2. **Orientacja (Rotacja):** Użytkownik obraca nadgarstkiem (Gizmo), aby zdefiniować ułożenie (np. pięść pionowa lub pozioma).

### 3.4. Struktura Danych (Offline-First)

- **Technika (Atom):** Zapis ustawienia wybranej części ciała lub całego ciała. Typ `body_part` określa zakres:
  - **Częściowa (partial):** `left_arm`, `right_arm`, `left_leg`, `right_leg`, `torso` - zapis pozycji dla konkretnej kończyny/tułowia.
  - **Pełna (fullbody):** `fullbody` - zapis kompletnej pozy (wszystkie IK targety + hand presets). Służy jako **pozycja startowa** wielokrotnego użytku.
  - Zapisując Technikę do biblioteki, użytkownik nadaje jej **Tag** (np. Atak, Blok, Pozycja Startowa).
- **Pozycje Startowe:** Użytkownik może zapisać wiele pozycji startowych jako techniki `fullbody`. Przy tworzeniu nowej sekwencji lub kroku, może wybrać pozycję startową z biblioteki zamiast zaczynać od pozycji neutralnej.
- **Krok (Step):** Snapshot całej sceny w danym momencie. Automatycznie numerowany.
- **Sekwencja:** Lista kroków. Zawiera "Prywatne Notatki" (zamiast komentarzy organizacyjnych).
- **Masking:** Nałożenie techniki częściowej na model nadpisuje tylko zdefiniowane stawy, nie zmieniając reszty pozy. Nałożenie techniki `fullbody` nadpisuje wszystkie stawy.

### 3.5. Zunifikowany Edytor (Jeden Ekran)

Nie ma osobnych edytorów dla technik i sekwencji. Istnieje **jeden edytor 3D**, który działa w kontekście sekwencji:

- **Zapisywanie Technik z poziomu edytora:** Gdy użytkownik zaznacza (selekcja) konkretną część ciała (rękę, nogę, tułów), pojawia się opcja "Zapisz jako Technikę". Zapisuje to aktualną pozycję zaznaczonej kończyny/części jako technikę częściową.
- **Zapisywanie Pozycji Startowej:** Bez selekcji konkretnej części ciała, przycisk "Zapisz jako Pozycję Startową" zapisuje pełny snapshot (`fullbody`) do biblioteki technik.
- **Nakładanie Technik:** Z biblioteki technik użytkownik może nałożyć zapisaną technikę na aktualny model (masking dla częściowych, pełne nadpisanie dla fullbody).
- **Biblioteka Technik:** Dostępna jako panel/sheet w edytorze, nie jako osobny ekran nawigacji.

### 3.6. Okładka Sekwencji (Cover Image)

- Użytkownik samodzielnie wybiera krok (Step) oraz ustawia położenie kamery, które mają zostać użyte do wygenerowania okładki sekwencji.
- Po zatwierdzeniu wyboru, aplikacja wykonuje zrzut ekranu (screenshot) sceny 3D z wybranym ustawieniem kamery.
- Obrazek jest zapisywany w Supabase Storage, a link do niego trafia do pola `cover_image_url` w tabeli `sequences`.
- System nie renderuje miniatur 3D na liście – wyświetlana jest wyłącznie statyczna okładka.
- krok jest opcjonalny.

## 4. Specyfikacja Funkcjonalna: Przeglądarka (Viewer)

### 4.1. Interfejs Odtwarzania

- **Tryb Slideshow:** Nawigacja strzałkami "Dalej" / "Wstecz".
- **Interpolacja:** Płynne animowane przejście między pozycjami kroków (ok. 500ms).
- **Kamera:** Swobodna (OrbitControls) - użytkownik może dowolnie obracać widok w trakcie oglądania.

## 5. UI/UX

- **Lista Sekwencji:** Wyświetla miniaturę wygenerowaną z "Klatki Okładkowej" (wybranej przy zapisie).
- **Onboarding:** Statyczny overlay z instrukcjami przy pierwszym wejściu do edytora.

## 6. Zakres MVP (Wyłączenia)

- Fizyka kolizji (modele przenikają się).
- Edycja parametrów fizycznych modeli (wzrost, waga).
- Udostępnianie sekwencji innym uczniom (tylko własne notatki).
