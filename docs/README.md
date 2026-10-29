# Dokumentacja Evolync

Interaktywna dokumentacja (VitePress) w wyglądzie aplikacji: lista funkcjonalności, a w każdej zakładki **Opis / Przepływy / Technika / API**. W Przepływach klikasz kroki, telefon pokazuje ekran kroku, a pulsujące punkty `API` otwierają szczegóły endpointu. Trzy języki: en, pl, hu.

```bash
npm run docs:dev       # z katalogu głównego repo; podgląd na http://localhost:5173
npm run docs:build     # kontrola spójności + statyczny HTML w docs/.vitepress/dist
npm run docs:preview   # zbudowana wersja na http://localhost:4173 (po każdym buildzie uruchom ponownie)
```

## Struktura

```text
docs/
├── en/ pl/ hu/                    # to samo drzewo w każdym języku
│   ├── index.md                   # strona startowa (<FeatureHome />)
│   ├── endpoints.md               # wszystkie endpointy (<EndpointList />)
│   └── features/{id}.md           # jedna funkcjonalność
├── api/endpoints.json             # endpointy, opisy w 3 językach
├── public/screens/boards/         # ekrany kroków (wyrenderowane boardy projektowe)
├── public/screens/{id}/           # zrzuty z aplikacji (galeria w Opisie)
├── scripts/check.mjs              # kontrola spójności, uruchamiana przed buildem
└── .vitepress/
    ├── config.mts                 # języki, nawigacja, motyw diagramów
    └── theme/                     # komponenty eksploratora, style w kolorach aplikacji
```

English jest pod `/`, polski pod `/pl/`, węgierski pod `/hu/`.

## Źródło prawdy

Dokumentacja opisuje **kod**, nie plany. Pliki w `.ai/` służą tylko jako pomoc: każde stwierdzenie sprawdzaj w `src/`, `app/` i `supabase/`. Teksty widoczne dla użytkownika (komunikaty, przyciski) bierz z `src/core/i18n/locales/{en,pl,hu}.json`.

## Plik funkcjonalności

Frontmatter niesie wszystko, co interaktywne; treść pliku to zakładka **Technika**.

```md
---
layout: page
feature: sign-in            # id, takie samo we wszystkich językach
title: Logowanie
group: account              # account | school | … (nazwy grup w theme/labels.ts)
accent: brand               # brand | school | student | organization (theme/accents.ts)
icon: log-in                # ikona z theme/components/Icon.vue
order: 2                    # kolejność na liście
summary: "Jedno zdanie pod tytułem."
purpose: "Cel funkcjonalności."
who:                        # Opis → Kto korzysta
  - role: "Instruktor"
    outcome: "Dashboard organizacji"
rules: ["…", "…"]           # Opis → Zasady (**pogrubienie**, *kursywa*, `kod`)
messages:                   # Opis → Komunikaty (title opcjonalny)
  - situation: "Zły e-mail lub hasło"
    title: "Zły e-mail lub hasło"
    message: "Sprawdź oba pola…"
screens:                    # Opis → zrzuty z aplikacji
  - src: /screens/sign-in/form.png
    caption: "Logowanie"
api: [auth-google]          # endpointy funkcjonalności spoza kroków
flows:
  - id: email
    title: "Logowanie e-mailem"
    steps:
      - title: "Zaloguj"
        text: "Co się dzieje w tym kroku."
        screen: AuthLogin    # public/screens/boards/AuthLogin.png; brak = krok na serwerze
        api:
          - { id: auth-sign-in-password, x: 80, y: 68 }   # x, y w % ekranu = punkt na ekranie
          - { id: sync-pull }                              # bez x, y: tylko chip pod opisem
    diagram: |               # pełny diagram Mermaid (przycisk pod przepływem)
      sequenceDiagram
        …
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |

</FeatureView>
```

Nowa funkcjonalność: utwórz `features/{id}.md` w `en/`, `pl/` i `hu/` i dodaj jej nazwę w `labels.ts` → `features` (panel endpointu linkuje po niej). Lista po lewej i strona startowa zbierają funkcjonalności same.

Link do konkretnego kroku: `…/features/join-school#flows/request/5`.

## Nowy endpoint

Dopisz obiekt do `api/endpoints.json`:

| Pole | Znaczenie |
| --- | --- |
| `id` | stały identyfikator, używany w krokach i jako kotwica na liście |
| `group` | `function`, `rpc`, `rest`, `auth` albo `storage` |
| `method`, `path` | metoda HTTP i ścieżka w Supabase |
| `call` | jak aplikacja to wywołuje |
| `auth`, `summary`, `notes` | teksty w `en`, `pl`, `hu` |
| `request`, `response` | przykładowe body (tekst) |
| `source` | pliki, które wywołują lub implementują endpoint |
| `features` | `id` funkcjonalności, które go używają |

## Kontrola

`npm --prefix docs run check` (uruchamia się też przed każdym buildem) zatrzymuje build, gdy:

- strony nie ma w którymś języku,
- wersje językowe funkcjonalności różnią się strukturą: przepływy, kroki, ekrany, punkty API, liczba zasad, komunikatów, zrzutów albo nagłówków,
- krok wskazuje ekran, którego nie ma w `public/screens/boards/`, albo zrzut, którego nie ma,
- id endpointu nie istnieje w `api/endpoints.json`,
- endpointowi brakuje tłumaczenia albo linkuje do nieistniejącej funkcjonalności.

## Ekrany kroków

Ekrany w przepływach to boardy z `design/Project/` wyrenderowane do PNG. Boardy potrzebują runtime'u Claude Design (`support.js`), którego nie ma w repo; `scripts/boards/support.js` to minimalny zastępnik (`renderVals`, `{{ … }}`, `<sc-for>`, `<sc-if>`), który wypełnia je danymi z boardu.

```bash
docs/scripts/render-board.sh StudentsList                                     # → public/screens/boards/StudentsList.png
docs/scripts/render-board.sh StudentsList StudentsRequests '{"tab":"requests"}' # inny stan boardu pod inną nazwą
```

Trzeci argument to JSON dopisywany do stanu boardu (inna zakładka, otwarty arkusz). Pozycje punktów API (`x`, `y`) podaje się w procentach ekranu 390 × 844.
