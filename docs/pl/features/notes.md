---
layout: page
feature: notes
title: Notatki
group: notebook
accent: notebook
icon: book-open
order: 40
summary: "Prywatne notatki opisowe technik: tytuł, tagi i wiersze zapisane jako dialog Osoby 1 i Osoby 2, z tym, kto prowadzi w każdym kroku. Każdy użytkownik ma własny notatnik, niezależnie od roli."
purpose: "Pozwala każdemu, kto trenuje, zapisać technikę krok po kroku, tak jak uczy się jej w parach, i znaleźć ją po tagu lub wyszukiwaniu."
who:
  - role: "Każdy zalogowany użytkownik"
    outcome: "Pisze, edytuje, taguje, wyszukuje i usuwa swoje notatki; nikt inny ich nie widzi"
rules:
  - "Notatki są **prywatne**: synchronizowane tylko do autora, filtrowane po `user_id` na serwerze."
  - "Notatka ma **tytuł** (wymagany, do 200 znaków), **tagi** i **wiersze**."
  - "Każdy wiersz mówi, co robi **Osoba 1** i **Osoba 2**; przycisk zamiany zmienia, kto prowadzi, a dymek prowadzącego jest na górze."
  - "Puste wiersze nie są zapisywane; przy zapisie wiersze są numerowane w kolejności na ekranie."
  - "*Zapisz* pojawia się dopiero, gdy tytuł, zestaw tagów lub któryś wiersz różni się od zapisanej notatki."
  - "Lista filtruje po **chipach tagów** (*Wszystkie*, potem tagi użytkownika) i **wyszukiwaniu** w tytule i nazwach tagów, bez względu na wielkość liter i polskie znaki."
  - "Usunięcie notatki usuwa jej wiersze, po potwierdzeniu."
  - "Zakładka *Notatnik* na dolnym pasku wymienia sposoby pisania: *Notatki opisowe* z liczbą, [3D](./threed) i *Wideo* (wkrótce)."
messages:
  - situation: "Usunięcie notatki"
    title: "Usuń notatkę"
    message: "Usunąć tę notatkę razem ze wszystkimi wierszami?"
  - situation: "Brak tytułu"
    message: "Tytuł jest wymagany"
  - situation: "Pusty notatnik"
    message: "Zapisz technikę krok po kroku: co robi Osoba 1 i jak reaguje Osoba 2."
flows:
  - id: write
    title: "Pisanie notatki"
    steps:
      - title: "Notatnik"
        text: "Zakładka *Notatnik*: *Notatki opisowe*, *3D*, *Wideo*."
        screen: NotesNotebook
      - title: "Notatki opisowe"
        text: "Wyszukiwanie, chipy tagów i *Twoje notatki* z datą i tagami każdej; *Dodaj* otwiera nową notatkę."
        screen: NotesList
      - title: "Nowa notatka"
        text: "TYTUŁ, TAGI (przerywane *Dodaj tag*) i pierwszy pusty wiersz; *Utwórz* zapisuje notatkę, jej tagi i niepuste wiersze."
        screen: NoteCreate
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Tagi"
        text: "Arkusz tagów zaznacza tagi użytkownika; *Dodaj* tworzy nowy (zob. [Tagi](./tags))."
        screen: NoteTagsSheet
      - title: "Notatka"
        text: "Wiersze jako dymki czatu, Osoba 1 cyjanowa po lewej, Osoba 2 po prawej; kosz wiersza go usuwa. *Zapisz* pojawia się po zmianie."
        screen: NoteDetailsEdited
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Po tagu"
        text: "Chip tagu zawęża listę do notatek z tym tagiem."
        screen: NotesListFiltered
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Zakładka Notatnik (trasa `/techniques`) | `app/techniques/index.tsx`, `src/modules/techniques/components/NotebookScreen.tsx` |
| Lista notatek (trasa `/techniques/notes`) | `NotesListScreen.tsx`, `noteList.ts`, `hooks/useNoteList.ts` |
| Nowa notatka / notatka (trasy `…/notes/create`, `…/notes/{documentId}`) | `NoteCreateScreen.tsx`, `NoteDetailsScreen.tsx`, `NoteForm.tsx`, `NoteRowCard.tsx`, `noteRows.ts` |
| Tworzenie, zapis, usuwanie | `src/modules/techniques/notes/services/noteService.ts` |
| Synchronizacja na serwerze | `supabase/functions/sync/sync-notes.ts` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `technique_note_documents` | `user_id`, `title`, `description` |
| `technique_note_rows` | `document_id`, `order_index`, `person_1_text`, `person_2_text`, `direction` (`right`: prowadzi Osoba 1, `left`: Osoba 2) |

</FeatureView>
