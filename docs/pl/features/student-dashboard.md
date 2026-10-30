---
layout: page
feature: student-dashboard
title: Pulpit ucznia
group: student
accent: student
icon: user
order: 30
summary: "Dom ucznia: w szkole to, co najbliższe (wydarzenia i treningi), kafelki jego płatności, obecności i zamówień oraz notatnik technik. Bez szkoły pole Dołącz do szkoły i prośby czekające na akceptację."
purpose: "Pokazuje uczniowi życie klubu w skrócie i działa offline, także dla tych, którzy sami nigdy nie prowadzą szkoły."
who:
  - role: "Uczeń"
    outcome: "Widzi najbliższe wydarzenie i trening, otwiera swoje płatności, obecności, zamówienia i notatnik, dołącza do szkoły"
  - role: "Instruktor trenujący gdzie indziej"
    outcome: "Dostaje ten sam pulpit po przełączeniu na szkołę z *TRENUJ JAKO UCZEŃ*"
rules:
  - "**W szkole** (niebieski kontekst): przełącznik kontekstu z nazwą szkoły, *Najbliższe* z najbliższym wydarzeniem i treningiem, kafelki **Płatności**, **Obecności**, **Zamówienia**, potem [notatnik technik](./notes)."
  - "**Bez szkoły** (neutralny kontekst): *Mój pulpit*, pole *Nie należysz jeszcze do żadnej szkoły* z *Dołącz do szkoły* oraz notatnik."
  - "Prośby o dołączenie, które czekają na instruktora, są wymienione pod polem, dopóki nie zapadnie decyzja; odrzucona prośba to mówi i można wysłać nową."
  - "Ikona kalendarza w *Najbliższe* otwiera [Kalendarz](./calendar) ucznia; wydarzenie otwiera swoje szczegóły, gdzie uczeń odpowiada *Biorę udział* lub *Nieobecny* (zob. [Wydarzenia](./events))."
  - "Wszystko, co widzi uczeń, to jego własne dane: na urządzenie trafiają tylko jego płatności, obecności i zamówienia."
flows:
  - id: home
    title: "Pulpit"
    steps:
      - title: "Jeszcze bez szkoły"
        text: "Zaraz po rejestracji: pole *Dołącz do szkoły* i notatnik; oczekujące prośby pojawiają się pod polem."
        screen: NoSchool
      - title: "W szkole"
        text: "*Najbliższe* z wydarzeniem i treningiem, potem kafelki. Pigułka Synced pokazuje, czy wszystko jest na serwerze."
        screen: Student
        api:
          - { id: sync-pull, x: 84, y: 10 }
      - title: "Płatności"
        text: "Tylko do odczytu: okresy z kwotą i statusem oraz to, co zostało do zapłaty (zob. [Płatności](./payments))."
        screen: StudentPayments
      - title: "Obecności"
        text: "Tylko do odczytu: zajęcia po miesiącach i odsetek obecności (zob. [Obecności](./attendance))."
        screen: StudentAttendance
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Pulpit ucznia (trasa `/user/dashboard`) | `app/user/dashboard.tsx`, `src/modules/dashboard/components/StudentDashboard.tsx`, `NoSchoolCard.tsx` |
| Aktywne członkostwo (która szkoła) | `getActiveMembership()` w store, `activeMembershipId` w AsyncStorage |
| Ekrany ucznia | `/user/payments`, `/user/attendance`, `/user/orders`, `/user/events`, `/user/calendar` |
| Sekcja notatnika | `TechniqueNotebook` w `src/core/components` |

</FeatureView>
