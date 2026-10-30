---
layout: page
feature: threed
title: Notatnik 3D
group: notebook
accent: threed
icon: box
order: 41
summary: "Techniki jako pozy 3D: sekwencja to lista kroków, każdy to poza pełnego modelu człowieka 3D ustawiana staw po stawie (z opcjonalnym partnerem i edytorem dłoni). Pozy można zapisać jako techniki i pozycje startowe do ponownego użycia, a sekwencję oglądać krok po kroku."
purpose: "Zapis ruchu, którego nie da się oddać słowami: gdzie jest każdy staw, krok po kroku, prywatnie dla każdego użytkownika i offline."
who:
  - role: "Każdy zalogowany użytkownik"
    outcome: "Tworzy sekwencje, ustawia kroki, zapisuje techniki, pozycje startowe i ustawienia dłoni, ogląda sekwencje"
rules:
  - "Wszystko w 3D jest **prywatne** dla użytkownika i synchronizowane tylko do niego."
  - "Biblioteka ma trzy zakładki: **Sekwencje** (wyszukiwanie, kroki · data, tagi), **Techniki** (filtr części ciała: Ręce, Dłonie, Nogi, Kręgosłup) i **Pozycje** (pozy całego ciała)."
  - "**Sekwencja** ma tytuł, opis, [tagi](./tags) i numerowane **kroki**. Ekran sekwencji nie pokazuje modelu; model renderuje się tylko w **edytorze** i **podglądzie**."
  - "W edytorze dotknięcie stawu go zaznacza; *Obróć* lub *Przesuń* z suwakiem dla każdej osi (X, Y, Z), *Lustro* kopiuje na drugą stronę, *Reset* czyści. Przeciąganie po scenie obraca kamerę; pad ją przesuwa i przybliża."
  - "*Partner* pokazuje drugą postać w pozycji spoczynkowej obok pierwszej, jako odniesienie dystansu; nie jest ustawiana ani zapisywana. *Pozycje* stosują zapisaną pozycję startową; *Zapisz pozycję* zapisuje całą pozę jako pozycję startową."
  - "*Zapisz technikę* zapisuje pozę zaznaczonej części ciała (jej stawów) pod nazwą; *Techniki* stosują zapisaną do bieżącego kroku."
  - "**Edytor dłoni** zgina każdy segment palca (X) i go rozsuwa (Z); **ustawienie dłoni** zapisuje wszystkie 16 kości dłoni."
  - "*Zapisz* zapisuje pozę w bieżącym kroku. Usunięcie techniki lub pozycji zostawia pozę w krokach, które jej użyły."
  - "**Podgląd** pokazuje kroki po kolei (Poprzedni / Następny); nie ma animowanego odtwarzania."
messages:
  - situation: "Usunięcie sekwencji"
    message: "Czy na pewno chcesz usunąć tę sekwencję? Tej akcji nie można cofnąć."
  - situation: "Usunięcie kroku"
    message: "Czy na pewno chcesz usunąć ten krok?"
  - situation: "Usunięcie techniki"
    title: "Usuń technikę"
    message: "Usunąć tę technikę? Kroki, które jej użyły, zachowają ułożenie."
  - situation: "Scena 3D się nie załadowała"
    message: "Nie udało się załadować sceny 3D. Wróć i spróbuj ponownie."
flows:
  - id: sequence
    title: "Sekwencja"
    steps:
      - title: "Biblioteka"
        text: "*3D* w zakładce Notatnik: Sekwencje, Techniki, Pozycje; *Dodaj* otwiera nową sekwencję."
        screen: ThreeDLibrary
      - title: "Nowa sekwencja"
        text: "TYTUŁ, OPIS, TAGI; *Utwórz* zapisuje ją i otwiera edytor na kroku 1."
        screen: ThreeDSequenceCreate
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Sekwencja"
        text: "Tytuł, opis, tagi, *Edytuj* i *Pokaż*, potem numerowane kroki z usuwaniem; krok otwiera na sobie edytor."
        screen: ThreeDSequence
  - id: pose
    title: "Ustawianie kroku"
    steps:
      - title: "Edytor"
        text: "Model ze znacznikami stawów, pad kamery i pasek kroków z *Dodaj krok*; narzędzia *Partner*, *Pozycje*, *Zapisz pozycję*, *Reset*."
        screen: ThreeDEditor
      - title: "Staw"
        text: "Panel zaznaczonego stawu: Obróć / Przesuń i suwaki X Y Z, *Lustro*, *Zapisz technikę*, *Techniki*. *Zapisz* zapisuje pozę w kroku i synchronizuje."
        screen: ThreeDEditorJoint
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Partner"
        text: "Druga postać w pozycji spoczynkowej obok pierwszej; nie jest ustawiana ani zapisywana z krokiem."
        screen: ThreeDEditorPartner
      - title: "Dłoń"
        text: "Dłoń, Kciuk … Mały, SEGMENT 1–3, suwaki X i Z oraz ustawienia użytkownika dla tej dłoni z *Dodaj*."
        screen: ThreeDHandEditor
      - title: "Zapisz technikę"
        text: "CZĘŚĆ CIAŁA z liczbą stawów i NAZWA; technika pojawia się w Technikach."
        screen: ThreeDSaveTechnique
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Zastosuj technikę"
        text: "Zapisane pozy części ciała z wyszukiwaniem; dotknięcie stosuje jedną do bieżącego kroku."
        screen: ThreeDTechniqueSheet
  - id: view
    title: "Oglądanie"
    steps:
      - title: "Podgląd"
        text: "Sekwencja na modelu, na pełnym ekranie; jeden segment postępu na krok i Poprzedni / Następny wokół *KROK 2 Z 6*."
        screen: ThreeDViewer
      - title: "Technika"
        text: "Technika lub pozycja z biblioteki: poza na modelu, nazwa, część ciała, data zapisu i tagi."
        screen: ThreeDTechniquePreview
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Biblioteka (trasa `/techniques/threed`) | `src/modules/threed/components/ThreeDLibraryScreen.tsx`, `library.ts` |
| Nowa sekwencja / sekwencja (trasy `…/threed/create`, `…/threed/{sequenceId}`) | `SequenceCreateScreen.tsx`, `SequenceDetailsScreen.tsx`, `services/sequenceService.ts` |
| Edytor (trasa `…/{sequenceId}/edit`) | `SequenceEditorScreen.tsx`, `JointPanel.tsx`, `HandEditorPanel.tsx`, `StepStrip.tsx`, `SaveTechniqueSheet.tsx`, `TechniquePickerSheet.tsx` |
| Podgląd (trasa `…/{sequenceId}/viewer`), technika (trasa `…/threed/technique/{techniqueId}`) | `SequenceViewerScreen.tsx`, `TechniquePreviewScreen.tsx` |
| Model i scena | `HumanModel.tsx`, `ThreeDCanvas.tsx`, `SceneScreen.tsx`, `jointAxes.ts` |
| Techniki, ustawienia dłoni | `services/techniqueService.ts`, `services/handPresetService.ts` |
| Synchronizacja na serwerze | `supabase/functions/sync/sync-threed.ts` |

Szczegóły architektury: skill `threed-guide` i `.ai/3d-prd.md`.

## Dane

| Tabela | Kolumny |
| --- | --- |
| `sequences` | `user_id`, `title`, `description`, `cover_image_url` |
| `sequence_steps` | `sequence_id`, `order_index`, `duration_ms`, `data` (JSON: transformacje kości) |
| `techniques` | `user_id`, `title`, `description`, `body_part`, `data` (JSON) |
| `body_pose_presets` | `user_id`, `name`, `body_part_type` (`hand` / `foot`), `data` (JSON) |

Starsze techniki (V1, V2) są czytane przez `normalizeTechniqueData` w `utils/dataCompat.ts`.

## Uwagi

- Plansze projektu rysują postać liniami; aplikacja zawsze renderuje prawdziwy model 3D.
- `updateSequenceCoverImage` (wysyłanie do bucketu `3d-sequences`) istnieje, ale żaden ekran go nie wywołuje, więc sekwencje nie mają okładki.

</FeatureView>
