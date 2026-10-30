---
layout: page
feature: tags
title: Tagi
group: notebook
accent: tags
icon: tag
order: 42
summary: "Własne etykiety użytkownika (Gardy, Przetoczenia, Praca nóg…) dla notatek i sekwencji 3D: jedna lista do dodawania, zmiany nazwy i usuwania, arkusz do wyboru i chipy do filtrowania."
purpose: "Grupuje techniki tak, jak myśli o nich użytkownik, w notatkach i w 3D."
who:
  - role: "Każdy zalogowany użytkownik"
    outcome: "Prowadzi własną listę tagów i taguje notatki oraz sekwencje 3D"
rules:
  - "Tagi są **prywatne** dla użytkownika i wspólne dla notatek i sekwencji 3D."
  - "Nazwa ma 1–30 znaków i jest **unikalna dla użytkownika** bez względu na wielkość liter (*guard* = *Guard*)."
  - "Tagi zawsze są w różu Tagów, niezależnie od zapisanego koloru."
  - "Usunięcie tagu najpierw pyta i zabiera go z listy oraz ze wszystkich notatek i sekwencji."
  - "Pole *TAGI* (notatka, nowa sekwencja 3D) pokazuje wybrane tagi z `×` i przerywane *Dodaj tag*, które otwiera wybór; *Dodaj* w wyborze tworzy tag i go zaznacza."
messages:
  - situation: "Usunięcie tagu"
    message: "Usunąć tag?"
  - situation: "Nazwa zajęta"
    message: "Tag o tej nazwie już istnieje"
  - situation: "Za długa nazwa"
    message: "Nazwa może mieć najwyżej 30 znaków"
  - situation: "Brak tagów"
    message: "Brak tagów. Stuknij Dodaj, aby utworzyć pierwszy."
flows:
  - id: tags
    title: "Tagi"
    steps:
      - title: "Notatnik technik"
        text: "Sekcja notatnika na pulpicie ma *Otwórz notatnik* i *Tagi*; `+` od razu dodaje tag."
        screen: TechniqueNotebook
      - title: "Twoje tagi"
        text: "Wiersz na tag; *Dodaj* otwiera arkusz dodawania, wiersz arkusz edycji."
        screen: TagsList
      - title: "Dodaj tag"
        text: "NAZWA, *Utwórz*; zapisywany lokalnie i synchronizowany."
        screen: TagsAddSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Edytuj tag"
        text: "Zmiana nazwy przez *Zapisz*; kosz usuwa tag po potwierdzeniu."
        screen: TagsEditSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Lista tagów (trasa `/tags`) | `app/tags/index.tsx`, `src/modules/tags/components/TagsListScreen.tsx`, `TagSheet.tsx` |
| Wybór i pole | `TagPickerSheet.tsx`, `TagsField.tsx`, `hooks/useEntityTags.ts` |
| Tworzenie, zmiana nazwy, usuwanie, przypinanie | `src/modules/tags/services/tagService.ts`, `validation/tagSchema.ts` |
| Synchronizacja na serwerze | `supabase/functions/sync/sync-tags.ts` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `tags` | `user_id`, `name`, `color` |
| `taggables` | `tag_id`, `taggable_id`, `taggable_type` (notatka, sekwencja 3D) |

</FeatureView>
