---
layout: page
feature: trainings
title: Treningi
group: organization
accent: trainings
icon: activity
order: 22
summary: "Plan treningów: pojedyncze treningi w wybrane dni albo serie cykliczne (co tydzień lub w n-ty dzień tygodnia miesiąca) do 6 miesięcy naprzód, dla organizacji, jednej szkoły lub wybranych członków. Serie można edytować od danego dnia, przedłużać i odwoływać dzień po dniu."
purpose: "Uczniowie i instruktorzy widzą w kalendarzu i na pulpicie, kiedy i gdzie jest najbliższy trening, także offline."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Planuje, edytuje, przedłuża, odwołuje i usuwa treningi"
  - role: "Uczeń"
    outcome: "Widzi przeznaczone dla siebie treningi w kalendarzu i na pulpicie, tylko do odczytu"
rules:
  - "Trening ma nazwę (do 60 znaków), dzień, godzinę początku i końca, opcjonalne miejsce (do 300 znaków albo *Użyj adresu szkoły*) i odbiorców: **cała organizacja**, **jedna szkoła** lub **wybrani członkowie**."
  - "**Pojedynczy**: jeden trening na każdy wybrany dzień. **Cykliczny**: jedna lub więcej reguł *Powtarzaj w* (co tydzień w wybrane dni albo co miesiąc w 1.–4. lub ostatni dzień tygodnia), każda z własnymi godzinami, od *Od* do *Do*."
  - "Seria trwa **najwyżej 6 miesięcy**. *Przedłuż* ciągnie ją do 6 miesięcy za obecny koniec; poza 6-miesięcznym oknem serii zaczyna się seria-kontynuacja."
  - "Godziny są zegarowe *HH:mm*, więc zmiana czasu letniego nigdy nie przesuwa treningu."
  - "**Minione treningi są tylko do odczytu.**"
  - "Edycja lub usunięcie treningu z serii najpierw pyta: **tylko ten trening** czy **ten i następne**. *Ten i następne* kończy starą serię dzień wcześniej i zastępuje resztę nową serią; wcześniejsze treningi nie są ruszane, odwołane dni zostają odwołane."
  - "*Odwołaj* oznacza jeden trening jako odwołany (zostaje w kalendarzu) i da się to cofnąć; usunięcie go usuwa."
  - "Pulpit liczy treningi z najbliższych 7 dni."
messages:
  - situation: "Usunięcie jednego treningu"
    message: "Usunąć ten trening? Tej operacji nie można cofnąć."
  - situation: "Usunięcie tego i następnych"
    message: "Usunąć ten i wszystkie następne treningi serii? Wcześniejsze zostaną."
  - situation: "Edycja treningu z serii"
    title: "Edytuj trening cykliczny"
    message: "Judo dla dzieci należy do serii."
flows:
  - id: single
    title: "Pojedynczy trening"
    steps:
      - title: "Nowy trening"
        text: "Z `+` w kalendarzu lub z pulpitu: nazwa, *Pojedynczy*, dzień (wzięty z dnia wybranego w kalendarzu), początek i koniec, miejsce, *Dla kogo?*."
        screen: TrainingCreateSingle
      - title: "Utwórz"
        text: "Jeden trening na każdy wybrany dzień, z zaproszonymi przy *wybranych członkach*, zapisany w jednej transakcji i synchronizowany."
        screen: TrainingDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: recurring
    title: "Seria cykliczna"
    steps:
      - title: "Powtarzaj w"
        text: "*Cykliczny* pokazuje reguły *Powtarzaj w*: Co tydzień z dniami tygodnia albo Co miesiąc z tygodniem miesiąca, każda z początkiem i końcem; czerwone × usuwa regułę. *Od* i *Do* ograniczają serię (najwyżej 6 miesięcy)."
        screen: TrainingCreate
      - title: "Utwórz"
        text: "Seria i wszystkie jej treningi są generowane na urządzeniu i zapisywane naraz, potem synchronizowane."
        screen: TrainingDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
    diagram: |
      flowchart TD
        rules[Reguły Powtarzaj w<br/>Od – Do] --> expand[Rozwinięcie na dni<br/>bez duplikatów dzień + godzina]
        expand --> write[Seria + treningi<br/>+ zaproszeni w jednym zapisie]
        write --> sync[Synchronizacja]
        sync --> cal[Kalendarze odbiorców]
  - id: series
    title: "Edycja, przedłużenie, odwołanie"
    steps:
      - title: "Trening"
        text: "Data i godzina, miejsce, odbiorcy i karta serii z *Przedłuż*; niżej *Edytuj* i *Odwołaj*, kosz w nagłówku."
        screen: TrainingDetails
      - title: "Ten czy następne"
        text: "Edycja i usunięcie treningu z serii pytają najpierw: tylko ten trening czy ten i wszystkie następne od jego dnia."
        screen: TrainingScopeSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Przedłuż"
        text: "Nowe *Do* do 6 miesięcy naprzód; arkusz pokazuje, ile treningów doda."
        screen: TrainingExtendSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Nowy / edycja treningu (trasy `/organization/trainings/create`, `…/{trainingId}/edit`) | `src/modules/trainings/components/TrainingFormScreen.tsx`, `trainingFormState.ts`, `SeriesRuleCard.tsx`, `SchoolAddressSheet.tsx` |
| Szczegóły treningu (trasa `/organization/trainings/{trainingId}`) | `TrainingDetailsScreen.tsx`, `TrainingScopeSheet.tsx`, `ExtendSeriesSheet.tsx` |
| Tworzenie, edycja, przedłużanie, odwoływanie, usuwanie | `src/modules/trainings/services/trainingService.ts` |
| Dni i rozwijanie serii (czysta logika) | `src/modules/trainings/types/helpers.ts` |
| Synchronizacja na serwerze | `supabase/functions/sync/sync-trainings.ts` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `training_series` | `organization_id`, `school_id`, `name`, `location`, `visibility`, `invitee_ids`, `start_date`, `end_date`, `rules` (JSON), `previous_series_id` |
| `trainings` | `organization_id`, `school_id`, `series_id`, `name`, `date`, `start_time`, `end_time`, `location`, `visibility`, `status` (`active` / `cancelled`) |
| `training_invitees` | `training_id`, `school_member_id` |

Zaplanowany trening to nie zajęcia z [listy obecności](./attendance).

## Synchronizacja

- Właściciel organizacji wypycha i pobiera treningi swojej organizacji; serwer ogranicza wypchnięcie do organizacji wywołującego i odrzuca powiązanie serii z inną organizacją.
- Uczeń pobiera, tylko do odczytu, treningi, których jest odbiorcą: organizacji, swojej szkoły lub na które został zaproszony.
- Treningi nie wysyłają powiadomień.

</FeatureView>
