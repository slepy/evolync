---
layout: page
feature: grading
title: Stopnie
group: organization
accent: grading
icon: award
order: 24
summary: "Stopnie (pasy) organizacji w kolejności, każdy z nazwą i kolorem pasa. Stopień ucznia ustawia się na jego karcie, a wszędzie widać go jako kolorowy róg awatara."
purpose: "Jedna lista stopni dla wszystkich szkół organizacji, żeby każdy instruktor i uczeń widział te same pasy."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Dodaje stopnie, zmienia ich nazwy i kolory, usuwa je; ustawia stopień ucznia na jego karcie"
  - role: "Uczeń"
    outcome: "Widzi kolor swojego stopnia na awatarze"
rules:
  - "Stopnie należą do **organizacji**, nie do szkoły."
  - "Stopień ma **nazwę** (1–50 znaków, unikalną w organizacji bez względu na wielkość liter) i opcjonalny **kolor** (hex, wybierany w próbniku kolorów)."
  - "Nowy stopień trafia na koniec listy; nie ma zmiany kolejności."
  - "Usunięcie stopnia numeruje pozostałe od nowa i **czyści stopień każdemu uczniowi**, który go miał, w jednej transakcji."
  - "Każdy awatar członka w aplikacji ma róg w kolorze stopnia ucznia (`MemberAvatar`)."
messages:
  - situation: "Usunięcie stopnia"
    message: "Czy na pewno chcesz usunąć ten stopień?"
  - situation: "Nazwa zajęta przez inny stopień"
    message: "Stopień z tą nazwą już istnieje"
  - situation: "Brak nazwy lub za długa"
    message: "Nazwa stopnia jest wymagana · Nazwa stopnia może mieć maksymalnie 50 znaków"
  - situation: "Brak stopni"
    message: "Nie zdefiniowano jeszcze żadnych stopni. Dodaj pierwszy, aby rozpocząć."
flows:
  - id: ranks
    title: "Stopnie"
    steps:
      - title: "Twoje stopnie"
        text: "Z pulpitu organizacji: stopnie w kolejności, każdy w kolorze pasa. *Dodaj* otwiera nowy stopień, wiersz otwiera go do edycji."
        screen: GradingList
      - title: "Nowy stopień"
        text: "NAZWA i KOLOR; *Utwórz* dodaje stopień na końcu i synchronizuje."
        screen: GradingAddSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Kolor"
        text: "Pole KOLOR przełącza arkusz na próbnik: panel nasycenia, suwak odcienia i wartość hex."
        screen: GradingColorPicker
      - title: "Edycja lub usunięcie"
        text: "*Zapisz* zapisuje nową nazwę lub kolor; kosz usuwa stopień po potwierdzeniu i czyści go uczniom, którzy go mieli."
        screen: GradingEditSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Stopień ucznia"
        text: "Na karcie ucznia arkusz stopni wymienia stopnie w ich kolorach; wybór zapisuje się przez *Zapisz*."
        screen: StudentRankSheet
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Stopnie (trasa `/organization/grading`, `?create=1` otwiera nowy stopień) | `app/organization/grading/index.tsx`, `src/modules/grading/components/GradingConfigScreen.tsx` |
| Arkusz dodawania / edycji i próbnik kolorów | `RankSheet.tsx`, `rankSheetState.ts`, `RankColorPicker.tsx` |
| Dodawanie, edycja, usuwanie | `src/modules/grading/services/gradingService.ts`, `validation/gradingSchema.ts` |
| Stopień ucznia | `StudentRankSheet.tsx` w module students, `MemberAvatar` w `src/core/components` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `organization_gradings` | `organization_id`, `name`, `order`, `color` |
| `school_members` | `current_rank_id` (stopień ucznia) |

Unikalność nazwy sprawdza tylko urządzenie.

</FeatureView>
