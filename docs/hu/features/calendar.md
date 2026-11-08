---
layout: page
feature: calendar
title: Naptár
group: organization
accent: organization
icon: calendar
order: 23
summary: "Egyetlen havi rács az aktuális környezet eseményeivel és edzéseivel: az egész szervezet, egy iskola vagy a tanuló. A többnapos események sávként jelennek meg, a kiválasztott nap felsorolja a tételeit, és az oktató azon a napon eseményt vagy edzést ad hozzá."
purpose: "Egy helyen válaszol arra, mikor és mi lesz, anélkül hogy külön meg kellene nyitni az Eseményeket és az Edzéseket."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Látja a szervezet vagy egy iskola beosztását, és eseményt, edzést ad hozzá egy napra"
  - role: "Tanuló"
    outcome: "Csak olvasásra látja az eseményeit és az iskolája edzéseit, és megnyit egy eseményt, hogy válaszoljon"
rules:
  - "A naptár az aktuális környezet irányítópultjának fejlécéből (*Következő*) nyílik."
  - "**Szervezet**: minden iskola eseményei és edzései; az *Új hozzáadása* eseményt vagy edzést kínál. A *Lista* nézet dátumtartomány és típus szerint szűri a szervezet eseményeit. Az esemény nyila kibontja a résztvevőit; egy résztvevőre koppintva az adott esemény *Résztvevők* képernyője nyílik meg (*Résztvevők kezelése*), az esemény sorára koppintva a részletei."
  - "**Iskola**: csak az iskolát érintő edzések; az *Új hozzáadása* edzést nyit ennek az iskolának."
  - "**Tanuló**: azok az események, amelyekben részt vesz, és az iskolája (vagy neki szóló) edzései; nincs *Új hozzáadása*; csak az események nyithatók meg."
  - "Szűrő chipek: *Mind*, *Események*, *Edzések*. A rács hétfővel kezdődik; legfeljebb két többnapos esemény kap sávot, a többi pontként látszik."
  - "A kiválasztott nap lesz az új esemény vagy edzés kezdőnapja."
  - "A napok UTC éjfélként tárolódnak és UTC-ben formázódnak, így az eszköz időzónája soha nem tol át egy tételt másik napra."
messages:
  - situation: "Új hozzáadása egy napon"
    title: "Új hozzáadása"
    message: "A kiválasztott nap lesz a kezdő dátum."
flows:
  - id: browse
    title: "Hónap és nap"
    steps:
      - title: "Szervezeti naptár"
        text: "Havi rács eseménysávokkal és pontokkal az eseményekhez és edzésekhez; a kiválasztott nap először az eseményeit, majd az edzéseit sorolja kezdési idő szerint. Egy sor megnyitja az eseményt vagy az edzést."
        screen: Calendar
      - title: "Új hozzáadása"
        text: "*Új hozzáadása* a kiválasztott napon: *Esemény* (egy vagy több nap) vagy *Edzés* (egyszeri vagy ismétlődő)."
        screen: CalendarAddSheet
      - title: "Iskolai naptár"
        text: "Az iskola irányítópultjáról nyílik, az iskola színében, és csak az iskolát érintő edzésekkel."
        screen: CalendarSchool
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Útvonalak | `app/organization/calendar.tsx`, `app/school/[schoolId]/calendar.tsx`, `app/user/calendar.tsx` |
| Adatokhoz kötött naptár (betölti a hatókör eseményeit és edzéseit) | `src/core/components/Calendar/Calendar.tsx` |
| Havi nézet és a hozzáadási lap | `CalendarView.tsx`, `CalendarAddSheet.tsx`, `DayCell.tsx`, `FilterChips.tsx` |
| Havi rács, sávok, a nap tételei (tiszta logika) | `calendarMonth.ts`, `calendarFormat.ts` |
| A szervezet eseménylistája (Lista nézet) | `src/modules/events/components/EventListView.tsx` |

A naptár csak a helyi adatbázist olvassa az események és edzések repositoryjain keresztül, így offline is működik. Lásd [Események](./events) és [Tervezett edzések](./trainings).

## Megjegyzések

- Az iskolai terv az iskola naptárában eseményeket is mutat; az alkalmazás ott csak edzéseket mutat.

</FeatureView>
