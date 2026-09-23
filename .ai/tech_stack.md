# Propozycja Tech Stacku - Evolync

Na podstawie wymagań zdefiniowanych w PRD, proponuję następujący stos technologiczny, który zapewni wydajność, skalowalność oraz realizację kluczowych funkcji takich jak tryb offline-first i obsługa 3D.

## 1. Core (Fundamenty)

* **Framework:** **React Native** (z wykorzystaniem **Expo**)
  * *Dlaczego:* Umożliwia szybkie tworzenie aplikacji na iOS i Androida z jednej bazy kodu. Expo (Managed Workflow) drastycznie przyspiesza konfigurację środowiska, obsługę natywnych modułów i deployment (OTA updates).
* **Język:** **TypeScript**
  * *Dlaczego:* Niezbędny przy skomplikowanej logice biznesowej i matematyce 3D. Zapewnia bezpieczeństwo typów i ułatwia refaktoryzację.

## 2. Backend & Baza Danych (Offline-first)

* **Backend-as-a-Service:** **Supabase**
  * *Dlaczego:* Zgodnie z wymaganiami. Dostarcza PostgreSQL, Autentykację, Storage i Edge Functions.
* **Lokalna Baza Danych (Offline):** **WatermelonDB**
  * *Dlaczego:* Kluczowy element dla architektury "Offline-first". WatermelonDB jest wysoce wydajną bazą danych dla React Native, zbudowaną na SQLite (przez JSI). Jest znacznie szybsza niż AsyncStorage i zaprojektowana do synchronizacji danych.
* **Synchronizacja:** **WatermelonDB Sync Adapter**
  * *Dlaczego:* Wbudowany mechanizm synchronizacji w WatermelonDB pozwala na łatwe podłączenie do Supabase (pull/push changes) i obsługę konfliktów.

## 3. Silnik 3D i Wizualizacja

* **Silnik 3D:** **React Three Fiber (R3F)** (nakładka na **Three.js**)
  * *Dlaczego:* Standard w ekosystemie Reacta. Pozwala budować sceny 3D deklaratywnie, co idealnie łączy się z logiką aplikacji. Działa w React Native przez `expo-gl`.
* **Narzędzia pomocnicze:** **Drei** (`@react-three/drei/native`)
  * *Dlaczego:* Gotowe komponenty (kamery, światła, loadery modeli), które przyspieszają development.
* **Inverse Kinematics (IK):** **Three.js IK Solver** (np. `CCDIKSolver` z `three-stdlib`) lub dedykowana biblioteka IK.
  * *Dlaczego:* Niezbędne do sterowania manekinem. Będziemy musieli zaimplementować logikę "Drag & Drop" mapującą dotyk na ekranie na pozycję "celu" (target) dla łańcucha kinematycznego.

## 4. Zarządzanie Stanem i UI

* **Globalny Stan (App):** **Zustand**
  * *Dlaczego:* Lekki, szybki i działa poza drzewem komponentów Reacta, co jest przydatne przy komunikacji między UI a pętlą renderowania 3D (która działa z wysoką częstotliwością).
* **UI Framework:** **Tamagui** lub **React Native Paper**
  * *Rekomendacja:* **Tamagui** - oferuje świetną wydajność i nowoczesny design system, co jest ważne przy aplikacji, która musi utrzymać 60 FPS przy renderowaniu 3D.
* **Nawigacja:** **Expo Router**
  * *Dlaczego:* Nowoczesne podejście oparte na strukturze plików (file-based routing), w pełni zintegrowane z ekosystemem Expo.

## 5. Narzędzia Dodatkowe

* **Formularze:** **React Hook Form** + **Zod** (walidacja).
* **Daty:** **date-fns** (lekka biblioteka do manipulacji datami).
* **Ikony:** **Lucide React Native**.
* **Płatności (Rejestr):** Brak zewnętrznych bibliotek (tylko logika wewnętrzna).
* **Wielojęzyczność (i18n):** **i18next** + **react-i18next** + **expo-localization**
  * *Dlaczego:* Standard w ekosystemie React. Obsługa wielu języków (angielski domyślnie, polski) z wykrywaniem języka urządzenia. Preferencje przechowywane w AsyncStorage (działa offline).
  * *Lokalizacja:* `src/core/i18n/` - konfiguracja, pliki tłumaczeń (JSON), hooki i komponenty.
  * *Użycie:* Hook `useTranslation()` w komponentach, komponent `<LanguageSwitcher />` do zmiany języka.

## Podsumowanie Architektury Danych (Offline-first)

1. Aplikacja czyta i zapisuje dane **wyłącznie** do lokalnej bazy **WatermelonDB**.
2. UI jest reaktywne na zmiany w WatermelonDB (dzięki obserwatorom).
3. W tle działa proces synchronizacji, który:
    * Wysyła zmiany (utworzone/zmienione rekordy) do Supabase.
    * Pobiera zmiany z Supabase i aktualizuje lokalną bazę.
4. Dzięki temu aplikacja działa błyskawicznie i jest w pełni funkcjonalna bez internetu.

## Struktura Projektu (Modułowa)

Projekt wykorzystuje architekturę modułową w katalogu `src/modules/`, aby uniknąć monolitu. Stosujemy podejście **Vertical Slice Architecture** również dla bazy danych.

* **src/modules/**:
  * **core**: Współdzielone komponenty UI, hooki, motywy, narzędzia.
  * **auth / home / settings**: Moduły funkcjonalne. Każdy moduł zawiera własny folder `database/` z definicją swoich tabel (`schema.ts`) oraz mapowaniem typów (`types/db.ts`).
* **src/database**: Warstwa infrastruktury. Zawiera konfigurację WatermelonDB, która agreguje schematy ze wszystkich modułów, oraz wygenerowane typy Supabase.

Katalog `app/` służy wyłącznie do definicji nawigacji (Expo Router) i importuje ekrany z odpowiednich modułów.
