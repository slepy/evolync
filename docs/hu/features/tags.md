---
layout: page
feature: tags
title: Címkék
group: notebook
accent: tags
icon: tag
order: 42
summary: "A felhasználó saját címkéi (Guard, Söprések, Lábmunka…) a jegyzetekhez és a 3D sorozatokhoz: egy lista a hozzáadáshoz, átnevezéshez és törléshez, egy lap a kiválasztáshoz és chipek a szűréshez."
purpose: "Úgy csoportosítja a technikákat, ahogy a felhasználó gondol rájuk, jegyzetekben és 3D-ben egyaránt."
who:
  - role: "Bármely bejelentkezett felhasználó"
    outcome: "Saját címkelistát vezet, és címkézi a jegyzeteket és a 3D sorozatokat"
rules:
  - "A címkék a felhasználó **privát** címkéi, a jegyzetek és a 3D sorozatok közösen használják őket."
  - "A név 1–30 karakter, és **felhasználónként egyedi**, kis- és nagybetűtől függetlenül (*guard* = *Guard*)."
  - "A címkék mindig a Címkék rózsaszínében jelennek meg, bármilyen színnel mentették őket."
  - "Egy címke törlése előbb rákérdez, majd eltávolítja a listából és minden jegyzetből és sorozatból."
  - "A *CÍMKÉK* mező (jegyzet, új 3D sorozat) a kiválasztott címkéket `×` jellel mutatja, a szaggatott *Címke hozzáadása* megnyitja a választót; a választó *Új hozzáadása* gombja létrehoz és bejelöl egy címkét."
messages:
  - situation: "Címke törlése"
    message: "Törlöd a címkét?"
  - situation: "Foglalt név"
    message: "Ilyen nevű címke már létezik"
  - situation: "Túl hosszú név"
    message: "A név legfeljebb 30 karakter lehet"
  - situation: "Még nincs címke"
    message: "Még nincsenek címkék. Koppints az Új hozzáadása gombra az elsőhöz."
flows:
  - id: tags
    title: "Címkék"
    steps:
      - title: "Technikai jegyzetfüzet"
        text: "Az irányítópult jegyzetfüzet szakaszában van a *Jegyzetfüzet megnyitása* és a *Címkék*; a `+` egyből címkét ad hozzá."
        screen: TechniqueNotebook
      - title: "Címkéid"
        text: "Címkénként egy sor; az *Új hozzáadása* a hozzáadási lapot, egy sor a szerkesztési lapot nyitja meg."
        screen: TagsList
      - title: "Címke hozzáadása"
        text: "NÉV, *Létrehozás*; helyben tárolódik és szinkronizálódik."
        screen: TagsAddSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Címke szerkesztése"
        text: "Átnevezés a *Mentés* gombbal; a kuka megerősítés után törli a címkét."
        screen: TagsEditSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Címkelista (útvonal `/tags`) | `app/tags/index.tsx`, `src/modules/tags/components/TagsListScreen.tsx`, `TagSheet.tsx` |
| Választó és mező | `TagPickerSheet.tsx`, `TagsField.tsx`, `hooks/useEntityTags.ts` |
| Létrehozás, átnevezés, törlés, csatolás | `src/modules/tags/services/tagService.ts`, `validation/tagSchema.ts` |
| Szerveroldali szinkronizálás | `supabase/functions/sync/sync-tags.ts` |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `tags` | `user_id`, `name`, `color` |
| `taggables` | `tag_id`, `taggable_id`, `taggable_type` (jegyzet, 3D sorozat) |

</FeatureView>
