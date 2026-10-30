---
layout: page
feature: organization
title: Organizacja
group: organization
accent: organization
icon: building
order: 20
summary: "Dom instruktora: pulpit organizacji z tym, co najbliższe, listą szkół i kafelkami zamówień, produktów i stopni. Przełącznik kontekstu przenosi między organizacją a szkołami, w których użytkownik trenuje jako uczeń."
purpose: "Jeden punkt startowy do wszystkiego, czym zarządza właściciel, i jeden przełącznik dla tych, którzy uczą i trenują."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Widzi organizację w skrócie, otwiera szkołę lub moduł, dodaje szkołę, przełącza się do szkoły, w której trenuje"
  - role: "Uczeń"
    outcome: "Przełącza się między szkołami, w których trenuje, i dołącza do kolejnej"
rules:
  - "Każdy instruktor ma **jedną organizację**, tworzoną przy rejestracji (zob. [Rejestracja](./sign-up))."
  - "Pole **Najbliższe** pokazuje najbliższe wydarzenie lub trening organizacji; ikona kalendarza otwiera [Kalendarz](./calendar)."
  - "*Twoje szkoły* wymienia szkoły organizacji z adresem; *Dodaj* otwiera nową szkołę."
  - "Kafelki *Zarządzaj*: **Zamówienia** (wszystkie szkoły), **Produkty**, **Stopniowanie**; `+` na kafelku otwiera od razu nową pozycję."
  - "Nowa szkoła wymaga nazwy (2–100 znaków); zaraz po utworzeniu otwiera się jej pulpit."
  - "**Przełącznik kontekstu** (lewy górny róg) wymienia organizację użytkownika w *ZARZĄDZAJ* i każdą szkołę, w której jest aktywnym uczniem, w *TRENUJ JAKO UCZEŃ*. Dotknięcie przełącza i zamyka; *Dołącz do kolejnej szkoły* otwiera [Dołączenie do szkoły](./join-school)."
  - "Wybrany kontekst ucznia jest zapamiętywany na urządzeniu."
  - "Wszystko na pulpicie jest czytane z lokalnej bazy i działa offline."
messages:
  - situation: "Za krótka nazwa szkoły"
    message: "Nazwa musi mieć co najmniej 2 znaki"
flows:
  - id: dashboard
    title: "Pulpit i szkoły"
    steps:
      - title: "Pulpit organizacji"
        text: "Bursztynowy nagłówek z przełącznikiem kontekstu i pigułką Synced, *Najbliższe*, *Twoje szkoły* z *Dodaj*, potem kafelki *Zarządzaj*."
        screen: Main
        api:
          - { id: sync-pull, x: 84, y: 5 }
      - title: "Wydarzenie i trening"
        text: "*Najbliższe* wymienia najbliższe wydarzenie i trening dnia."
        screen: MainC
      - title: "Nowa szkoła"
        text: "*Dodaj* pod *Twoimi szkołami*: nazwa, *Utwórz*. Szkoła jest zapisywana lokalnie i synchronizowana; aplikacja otwiera jej pulpit."
        screen: School
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: switch
    title: "Przełączanie kontekstu"
    steps:
      - title: "Zmień kontekst"
        text: "*ZARZĄDZAJ*: własna organizacja z liczbą szkół. *TRENUJ JAKO UCZEŃ*: szkoły, w których użytkownik jest uczniem, z miastem. Szkoła innej organizacji, której brakuje na urządzeniu, jest raz pobierana z Supabase."
        screen: Switcher
        api:
          - { id: schools-by-id, x: 50, y: 78 }
      - title: "Pulpit ucznia"
        text: "Szkoła z *TRENUJ JAKO UCZEŃ* otwiera [Pulpit ucznia](./student-dashboard) tej szkoły."
        screen: Student
    diagram: |
      flowchart TD
        sw[Przełącznik kontekstu] --> org{Opcja}
        org -- organizacja --> od[Pulpit organizacji]
        org -- szkoła jako uczeń --> mem[Zapamiętaj członkostwo<br/>na urządzeniu]
        mem --> sd[Pulpit ucznia]
        org -- Dołącz do kolejnej szkoły --> join[Dołączenie do szkoły]
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Pulpit organizacji (trasa `/organization/dashboard`) | `app/organization/dashboard.tsx`, `src/modules/organization/components/Dashboard.tsx`, `hooks/useOrganizationDashboard.ts` |
| Strażnik ekranów tylko dla właściciela | `src/modules/organization/hooks/useRequireOrganizationOwner.ts` |
| Nowa szkoła (trasa `/school/create`) | `app/school/create.tsx`, `createSchool` w `src/modules/school/services/schoolService.ts`, `validation/schoolSchema.ts` |
| Przełącznik i arkusz kontekstu | `src/core/components/ContextSwitcher/` (`ContextSwitcher`, `ContextSheet`, `useContextSwitch`) |
| Układ i nagłówek pulpitu | `DashboardPage`, `DashboardHeader`, `NextUp`, `ModuleTileGrid` w `src/core/components` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `organizations` | `owner_id`, `name` |
| `schools` | `organization_id`, `name`, `address` |

</FeatureView>
