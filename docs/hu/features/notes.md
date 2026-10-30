---
layout: page
feature: notes
title: Jegyzetek
group: notebook
accent: notebook
icon: book-open
order: 40
summary: "A technikák privát leíró jegyzetei: cím, címkék és sorok párbeszédként az 1. és a 2. személy között, lépésenként azzal, ki vezet. Minden felhasználónak saját jegyzetfüzete van, szereptől függetlenül."
purpose: "Bárki, aki edz, lépésről lépésre leírhat egy technikát úgy, ahogy párban tanítják, és címke vagy keresés alapján újra megtalálhatja."
who:
  - role: "Bármely bejelentkezett felhasználó"
    outcome: "Írja, szerkeszti, címkézi, keresi és törli a saját jegyzeteit; más nem látja őket"
rules:
  - "A jegyzetek **privátak**: csak a szerzőhöz szinkronizálódnak, a szerveren `user_id` szerint szűrve."
  - "Egy jegyzetnek van **címe** (kötelező, legfeljebb 200 karakter), **címkéi** és **sorai**."
  - "Minden sor azt írja le, mit csinál az **1. személy** és a **2. személy**; a csere gomb módosítja, ki vezet, és a vezető buborékja van felül."
  - "Az üres sorok nem tárolódnak; mentéskor a sorok a képernyőn látható sorrendben számozódnak újra."
  - "A *Mentés* csak akkor jelenik meg, ha a cím, a címkék köre vagy bármely sor eltér a mentett jegyzettől."
  - "A lista **címke chipekkel** (*Mind*, majd a felhasználó címkéi) és **kereséssel** szűr a címben és a címkenevekben, kis- és nagybetűtől és ékezetektől függetlenül."
  - "A jegyzet törlése megerősítés után a sorait is törli."
  - "Az alsó sáv *Jegyzetfüzet* füle sorolja az írásmódokat: *Leíró jegyzetek* a számukkal, [3D](./threed) és *Videó* (hamarosan)."
messages:
  - situation: "Jegyzet törlése"
    title: "Jegyzet törlése"
    message: "Törlöd ezt a jegyzetet az összes sorával együtt?"
  - situation: "Nincs cím"
    message: "A cím megadása kötelező"
  - situation: "Üres jegyzetfüzet"
    message: "Írd le a technikát lépésről lépésre: mit csinál az 1. személy, és hogyan reagál a 2. személy."
flows:
  - id: write
    title: "Jegyzet írása"
    steps:
      - title: "Jegyzetfüzet"
        text: "A *Jegyzetfüzet* fül: *Leíró jegyzetek*, *3D*, *Videó*."
        screen: NotesNotebook
      - title: "Leíró jegyzetek"
        text: "Keresés, címke chipek és a *Jegyzeteid* mindegyik dátumával és címkéivel; az *Új hozzáadása* új jegyzetet nyit."
        screen: NotesList
      - title: "Új jegyzet"
        text: "CÍM, CÍMKÉK (szaggatott *Címke hozzáadása*) és az első üres sor; a *Létrehozás* tárolja a jegyzetet, a címkéit és a nem üres sorait."
        screen: NoteCreate
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Címkék"
        text: "A címkelap a felhasználó címkéit jelöli be; az *Új hozzáadása* újat hoz létre (lásd [Címkék](./tags))."
        screen: NoteTagsSheet
      - title: "Jegyzet"
        text: "A sorok csevegőbuborékként: az 1. személy cián, balra, a 2. személy jobbra; a sor kukája eltávolítja. A *Mentés* módosítás után jelenik meg."
        screen: NoteDetailsEdited
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Címke szerint"
        text: "Egy címke chip a listát az adott címkéjű jegyzetekre szűkíti."
        screen: NotesListFiltered
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Jegyzetfüzet fül (útvonal `/techniques`) | `app/techniques/index.tsx`, `src/modules/techniques/components/NotebookScreen.tsx` |
| Jegyzetlista (útvonal `/techniques/notes`) | `NotesListScreen.tsx`, `noteList.ts`, `hooks/useNoteList.ts` |
| Új jegyzet / jegyzet (útvonalak `…/notes/create`, `…/notes/{documentId}`) | `NoteCreateScreen.tsx`, `NoteDetailsScreen.tsx`, `NoteForm.tsx`, `NoteRowCard.tsx`, `noteRows.ts` |
| Létrehozás, mentés, törlés | `src/modules/techniques/notes/services/noteService.ts` |
| Szerveroldali szinkronizálás | `supabase/functions/sync/sync-notes.ts` |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `technique_note_documents` | `user_id`, `title`, `description` |
| `technique_note_rows` | `document_id`, `order_index`, `person_1_text`, `person_2_text`, `direction` (`right`: az 1. személy vezet, `left`: a 2.) |

</FeatureView>
