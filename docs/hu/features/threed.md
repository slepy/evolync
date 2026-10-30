---
layout: page
feature: threed
title: 3D jegyzetfüzet
group: notebook
accent: threed
icon: box
order: 41
summary: "Technikák 3D pózokként: a szekvencia lépések listája, mindegyik lépés egy teljes 3D emberi modell ízületenként beállított póza (opcionális partnerrel és kézszerkesztővel). A pózok újrahasználható technikaként és kezdőpozícióként menthetők, a szekvencia pedig lépésről lépésre megnézhető."
purpose: "Mozgásjegyzet arra, amit szavakkal nem lehet leírni: hol van minden ízület, lépésről lépésre, minden felhasználónál privátan és offline is."
who:
  - role: "Bármely bejelentkezett felhasználó"
    outcome: "Szekvenciákat hoz létre, lépéseket pózol, technikákat, kezdőpozíciókat és kézbeállításokat ment, szekvenciákat néz meg"
rules:
  - "A 3D-ben minden a felhasználó **privát** adata, és csak hozzá szinkronizálódik."
  - "A könyvtárnak három füle van: **Szekvenciák** (keresés, lépések · dátum, címkék), **Technikák** (testrész szerinti szűrő: Karok, Kezek, Lábak, Gerinc) és **Pozíciók** (egész test pózai)."
  - "A **szekvenciának** van címe, leírása, [címkéi](./tags) és számozott **lépései**. A szekvencia képernyő nem mutat modellt; a modell csak a **szerkesztőben** és a **megjelenítőben** jelenik meg."
  - "A szerkesztőben egy ízületre koppintva kijelölöd; *Forgatás* vagy *Mozgatás* tengelyenként egy csúszkával (X, Y, Z), a *Tükrözés* átmásolja a másik oldalra, a *Visszaállítás* törli. A jeleneten húzva forog a kamera; a pad mozgatja és nagyítja."
  - "A *Partner* egy második alakot mutat alapállásban az első mellett, távolsági viszonyításként; nem pózolható és nem mentődik. A *Pozíciók* egy mentett kezdőpozíciót alkalmaz; a *Pozíció mentése* a teljes pózt kezdőpozícióként tárolja."
  - "A *Technika mentése* a kijelölt testrész (ízületei) pózát menti egy névvel; a *Technikák* egy mentettet alkalmaz az aktuális lépésre."
  - "A **kézszerkesztő** minden ujjszegmenst hajlít (X) és szétnyit (Z); a **kézbeállítás** egy kéz mind a 16 csontját tárolja."
  - "A *Mentés* a pózt az aktuális lépésbe írja. Egy technika vagy pozíció törlése után az azt használó lépések megtartják a pózukat."
  - "A **megjelenítő** egyenként mutatja a lépéseket (Előző / Következő); animált lejátszás nincs."
messages:
  - situation: "Szekvencia törlése"
    message: "Biztosan törlöd ezt a szekvenciát? Ez a művelet nem vonható vissza."
  - situation: "Lépés törlése"
    message: "Biztosan törlöd ezt a lépést?"
  - situation: "Technika törlése"
    title: "Technika törlése"
    message: "Törlöd ezt a technikát? Az ezt használó lépések megtartják a pózukat."
  - situation: "A 3D jelenet nem töltődött be"
    message: "Nem sikerült betölteni a 3D jelenetet. Lépj vissza, és próbáld újra."
flows:
  - id: sequence
    title: "Szekvencia"
    steps:
      - title: "Könyvtár"
        text: "*3D* a Jegyzetfüzet fülön: Szekvenciák, Technikák, Pozíciók; az *Új hozzáadása* új szekvenciát nyit."
        screen: ThreeDLibrary
      - title: "Új szekvencia"
        text: "CÍM, LEÍRÁS, CÍMKÉK; a *Létrehozás* tárolja, és az 1. lépésen megnyitja a szerkesztőt."
        screen: ThreeDSequenceCreate
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Szekvencia"
        text: "Cím, leírás, címkék, *Szerkesztés* és *Megtekintés*, majd a számozott lépések törléssel; egy lépés rajta nyitja meg a szerkesztőt."
        screen: ThreeDSequence
  - id: pose
    title: "Lépés pózolása"
    steps:
      - title: "Szerkesztő"
        text: "A modell az ízületjelölőkkel, a kamerapad és a lépéssáv a *Lépés hozzáadása* gombbal; eszközök: *Partner*, *Pozíciók*, *Pozíció mentése*, *Visszaállítás*."
        screen: ThreeDEditor
      - title: "Ízület"
        text: "A kijelölt ízület panelje: Forgatás / Mozgatás és az X Y Z csúszkák, *Tükrözés*, *Technika mentése*, *Technikák*. A *Mentés* a lépésbe írja a pózt és szinkronizál."
        screen: ThreeDEditorJoint
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Partner"
        text: "Második alak alapállásban az első mellett; nem pózolható, és nem mentődik a lépéssel."
        screen: ThreeDEditorPartner
      - title: "Kéz"
        text: "Kéz, Hüvelykujj … Kisujj, SZEGMENS 1–3, X és Z csúszkák, és a felhasználó beállításai ehhez a kézhez az *Új hozzáadása* gombbal."
        screen: ThreeDHandEditor
      - title: "Technika mentése"
        text: "TESTRÉSZ az ízületei számával és NÉV; a technika megjelenik a Technikák között."
        screen: ThreeDSaveTechnique
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Technika alkalmazása"
        text: "A testrész mentett pózai kereséssel; koppintásra egy az aktuális lépésre kerül."
        screen: ThreeDTechniqueSheet
  - id: view
    title: "Megtekintés"
    steps:
      - title: "Megjelenítő"
        text: "A szekvencia a modellen, teljes képernyőn; lépésenként egy haladási szakasz, és Előző / Következő a *2. LÉPÉS / 6* körül."
        screen: ThreeDViewer
      - title: "Technika"
        text: "Egy technika vagy pozíció a könyvtárból: a póz a modellen, a név, a testrész, a mentés ideje és a címkék."
        screen: ThreeDTechniquePreview
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Könyvtár (útvonal `/techniques/threed`) | `src/modules/threed/components/ThreeDLibraryScreen.tsx`, `library.ts` |
| Új szekvencia / szekvencia (útvonalak `…/threed/create`, `…/threed/{sequenceId}`) | `SequenceCreateScreen.tsx`, `SequenceDetailsScreen.tsx`, `services/sequenceService.ts` |
| Szerkesztő (útvonal `…/{sequenceId}/edit`) | `SequenceEditorScreen.tsx`, `JointPanel.tsx`, `HandEditorPanel.tsx`, `StepStrip.tsx`, `SaveTechniqueSheet.tsx`, `TechniquePickerSheet.tsx` |
| Megjelenítő (útvonal `…/{sequenceId}/viewer`), technika (útvonal `…/threed/technique/{techniqueId}`) | `SequenceViewerScreen.tsx`, `TechniquePreviewScreen.tsx` |
| Modell és jelenet | `HumanModel.tsx`, `ThreeDCanvas.tsx`, `SceneScreen.tsx`, `jointAxes.ts` |
| Technikák, kézbeállítások | `services/techniqueService.ts`, `services/handPresetService.ts` |
| Szerveroldali szinkronizálás | `supabase/functions/sync/sync-threed.ts` |

Architektúra részletei: a `threed-guide` skill és a `.ai/3d-prd.md`.

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `sequences` | `user_id`, `title`, `description`, `cover_image_url` |
| `sequence_steps` | `sequence_id`, `order_index`, `duration_ms`, `data` (JSON: csonttranszformációk) |
| `techniques` | `user_id`, `title`, `description`, `body_part`, `data` (JSON) |
| `body_pose_presets` | `user_id`, `name`, `body_part_type` (`hand` / `foot`), `data` (JSON) |

A régebbi technikákat (V1, V2) a `utils/dataCompat.ts` fájl `normalizeTechniqueData` függvénye olvassa be.

## Megjegyzések

- A tervek vonalakkal rajzolják az alakot; az alkalmazás mindig a valódi 3D modellt jeleníti meg.

</FeatureView>
