---
layout: page
feature: grading
title: Fokozatok
group: organization
accent: grading
icon: award
order: 24
summary: "A szervezet fokozatai (övei) sorrendben, mindegyik névvel és övszínnel. A tanuló fokozatát az adatlapján állítják be, és mindenhol az avatárja színes sarkaként látszik."
purpose: "Egy fokozatlista a szervezet összes iskolájának, hogy minden oktató és tanuló ugyanazokat az öveket lássa."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Fokozatokat ad hozzá, nevez át, színez át és töröl; a tanuló adatlapján beállítja a fokozatát"
  - role: "Tanuló"
    outcome: "Az avatárján látja a fokozata színét"
rules:
  - "A fokozatok a **szervezethez** tartoznak, nem egy iskolához."
  - "A fokozatnak van **neve** (1–50 karakter, a szervezeten belül egyedi, kis- és nagybetűtől függetlenül) és opcionális **színe** (hex, színválasztóban kiválasztva)."
  - "Az új fokozat a lista végére kerül; átrendezés nincs."
  - "Egy fokozat törlése újraszámozza a többit, és egy tranzakcióban **törli a fokozatot minden tanulótól**, akinek ez volt."
  - "Az alkalmazásban minden tag avatárjának sarka a tanuló fokozatának színét mutatja (`MemberAvatar`)."
messages:
  - situation: "Fokozat törlése"
    message: "Biztosan törlöd ezt a fokozatot?"
  - situation: "A nevet már egy másik fokozat használja"
    message: "Ilyen nevű fokozat már létezik"
  - situation: "Hiányzó vagy túl hosszú név"
    message: "A fokozat nevének megadása kötelező · A fokozat neve legfeljebb 50 karakter lehet"
  - situation: "Még nincs fokozat"
    message: "Még nincsenek fokozatok. Add hozzá az elsőt a kezdéshez."
flows:
  - id: ranks
    title: "Fokozatok"
    steps:
      - title: "Fokozataid"
        text: "A szervezet irányítópultjáról: a fokozatok sorrendben, mindegyik az övszínével. Az *Új hozzáadása* új fokozatot nyit, egy sor szerkesztésre nyitja meg."
        screen: GradingList
      - title: "Új fokozat"
        text: "NÉV és SZÍN; a *Létrehozás* a végére adja a fokozatot és szinkronizál."
        screen: GradingAddSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Szín"
        text: "A SZÍN mező a választóra váltja a lapot: telítettségi panel, árnyalatcsúszka és a hex érték."
        screen: GradingColorPicker
      - title: "Szerkesztés vagy törlés"
        text: "A *Mentés* tárolja az új nevet vagy színt; a kuka megerősítés után törli a fokozatot, és eltávolítja azoktól a tanulóktól, akiknek ez volt."
        screen: GradingEditSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "A tanuló fokozata"
        text: "A tanuló adatlapján a fokozatlap a színükkel sorolja a fokozatokat; a választás a *Mentés* gombbal tárolódik."
        screen: StudentRankSheet
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Fokozatok (útvonal `/organization/grading`, a `?create=1` új fokozatot nyit) | `app/organization/grading/index.tsx`, `src/modules/grading/components/GradingConfigScreen.tsx` |
| Hozzáadási / szerkesztési lap és színválasztó | `RankSheet.tsx`, `rankSheetState.ts`, `RankColorPicker.tsx` |
| Hozzáadás, szerkesztés, törlés | `src/modules/grading/services/gradingService.ts`, `validation/gradingSchema.ts` |
| A tanuló fokozata | `StudentRankSheet.tsx` a students modulban, `MemberAvatar` a `src/core/components` mappában |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `organization_gradings` | `organization_id`, `name`, `order`, `color` |
| `school_members` | `current_rank_id` (a tanuló fokozata) |

A név egyediségét csak az eszköz ellenőrzi.

</FeatureView>
