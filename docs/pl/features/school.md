---
layout: page
feature: school
title: Pulpit szkoły
group: school
accent: school
icon: house
order: 10
summary: "Dom jednej szkoły dla instruktora: najbliższe treningi szkoły, kafelki Uczniów, Płatności, Zamówień i Obecności oraz ustawienia szkoły z nazwą, adresem i domyślną kwotą płatności."
purpose: "Wszystko o jednej szkole w jednym miejscu, w czerwieni szkoły."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Otwiera moduły szkoły, dodaje pozycje z kafelków, zmienia nazwę, adres i domyślne płatności szkoły"
rules:
  - "Pulpit szkoły otwiera się z *Twoich szkół* na [pulpicie organizacji](./organization)."
  - "*Najbliższe* pokazuje nadchodzące treningi szkoły; ikona kalendarza otwiera [Kalendarz](./calendar) szkoły."
  - "Kafelki: **Uczniowie**, **Płatności**, **Zamówienia**, **Obecności**, każdy z krótkim opisem stanu; `+` na kafelku otwiera od razu nową pozycję."
  - "*Ustawienia szkoły*: NAZWA SZKOŁY (2–100 znaków), ADRES (do 500), DOMYŚLNA KWOTA i WALUTA. *Zapisz* pojawia się po pierwszej zmianie."
  - "Domyślna kwota działa tylko dla **nowych** okresów rozliczeniowych; istniejące zachowują swoje kwoty (zob. [Płatności](./payments))."
  - "Adres szkoły może być miejscem treningu (*Użyj adresu szkoły*)."
messages:
  - situation: "Pod domyślnymi płatnościami"
    message: "Zmiana ustawień domyślnych nie zmienia okresów, które już istnieją."
flows:
  - id: dashboard
    title: "Pulpit szkoły"
    steps:
      - title: "Szkoła"
        text: "Przycisk wstecz, nazwa szkoły i pigułka Synced; czerwone pole *Najbliższe* z treningami szkoły; kafelki modułów i wiersz *Ustawienia szkoły*."
        screen: School
      - title: "Ustawienia szkoły"
        text: "*Podstawowe informacje* (nazwa, adres) i *Domyślne płatności* (kwota, waluta). *Zapisz* zapisuje szkołę i jej ustawienia i synchronizuje."
        screen: SchoolSettingsEdited
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Pulpit szkoły (trasa `/school/{schoolId}/dashboard`) | `app/school/[schoolId]/dashboard/index.tsx`, `src/modules/dashboard/components/SchoolDashboard.tsx` |
| Opisy stanu na kafelkach | `src/modules/dashboard/hooks/schoolTileSubtitles.ts` |
| Ustawienia szkoły (trasa `/school/{schoolId}/settings`) | `app/school/[schoolId]/settings.tsx`, `src/modules/school/components/SchoolSettingsScreen.tsx`, `services/schoolSettingsService.ts`, `validation/schoolSchema.ts` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `schools` | `organization_id`, `name`, `address` |
| `school_settings` | `school_id`, `default_payment_amount`, `default_currency` |

</FeatureView>
