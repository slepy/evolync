---
layout: page
feature: calendar
title: Kalendarz
group: organization
accent: organization
icon: calendar
order: 23
summary: "Jedna siatka miesiąca z wydarzeniami i treningami bieżącego kontekstu: całej organizacji, jednej szkoły albo ucznia. Wydarzenia wielodniowe są rysowane jako paski, wybrany dzień wymienia swoje pozycje, a instruktor dodaje w tym dniu wydarzenie lub trening."
purpose: "Odpowiada w jednym miejscu, kiedy i co, bez osobnego otwierania Wydarzeń i Treningów."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Widzi plan organizacji lub jednej szkoły i dodaje wydarzenia i treningi w wybranym dniu"
  - role: "Uczeń"
    outcome: "Widzi swoje wydarzenia i treningi swojej szkoły, tylko do odczytu, i otwiera wydarzenie, żeby odpowiedzieć"
rules:
  - "Kalendarz otwiera się z nagłówka pulpitu (*Najbliższe*) bieżącego kontekstu."
  - "**Organizacja**: wydarzenia i treningi wszystkich szkół; *Dodaj* proponuje wydarzenie lub trening. Widok *Lista* filtruje wydarzenia organizacji po zakresie dat i typie."
  - "**Szkoła**: tylko treningi dotyczące tej szkoły; *Dodaj* otwiera trening dla tej szkoły."
  - "**Uczeń**: wydarzenia, w których bierze udział, i treningi jego szkoły (lub przeznaczone dla niego); bez *Dodaj*; otwierają się tylko wydarzenia."
  - "Chipy *Wszystko*, *Wydarzenia*, *Treningi*. Siatka zaczyna się od poniedziałku; najwyżej dwa wydarzenia wielodniowe dostają pasek, pozostałe są kropkami."
  - "Wybrany dzień staje się dniem początku nowego wydarzenia lub treningu."
  - "Dni są zapisywane jako północ UTC i formatowane w UTC, więc strefa czasowa urządzenia nigdy nie przesuwa pozycji na inny dzień."
messages:
  - situation: "Dodaj w danym dniu"
    title: "Dodaj"
    message: "Wybrany dzień zostanie wpisany jako data początku."
flows:
  - id: browse
    title: "Miesiąc i dzień"
    steps:
      - title: "Kalendarz organizacji"
        text: "Siatka miesiąca z paskami wydarzeń i kropkami wydarzeń i treningów; wybrany dzień wymienia najpierw wydarzenia, potem treningi według godziny. Wiersz otwiera wydarzenie lub trening."
        screen: Calendar
      - title: "Dodaj"
        text: "*Dodaj* w wybranym dniu: *Wydarzenie* (jeden lub więcej dni) albo *Trening* (jednorazowy lub cykliczny)."
        screen: CalendarAddSheet
      - title: "Kalendarz szkoły"
        text: "Otwierany z pulpitu szkoły, w kolorze szkoły i tylko z treningami, które jej dotyczą."
        screen: CalendarSchool
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Trasy | `app/organization/calendar.tsx`, `app/school/[schoolId]/calendar.tsx`, `app/user/calendar.tsx` |
| Kalendarz połączony z danymi (ładuje wydarzenia i treningi zakresu) | `src/core/components/Calendar/Calendar.tsx` |
| Widok miesiąca i arkusz dodawania | `CalendarView.tsx`, `CalendarAddSheet.tsx`, `DayCell.tsx`, `FilterChips.tsx` |
| Siatka miesiąca, paski, pozycje dnia (czysta logika) | `calendarMonth.ts`, `calendarFormat.ts` |
| Lista wydarzeń organizacji (widok Lista) | `src/modules/events/components/EventListView.tsx` |

Kalendarz czyta tylko lokalną bazę, przez repozytoria wydarzeń i treningów, więc działa offline. Zob. [Wydarzenia](./events) i [Treningi](./trainings).

## Uwagi

- Plansza szkoły pokazuje w kalendarzu szkoły wydarzenia; aplikacja pokazuje tam tylko treningi.

</FeatureView>
