---
layout: page
feature: trainings
title: Tervezett edzések
group: organization
accent: trainings
icon: activity
order: 22
summary: "Az edzésrend: egyszeri edzések a kiválasztott napokon vagy ismétlődő sorozatok (hetente, vagy a hónap n-edik hétköznapján) legfeljebb 6 hónapra előre, a szervezetnek, egy iskolának vagy kiválasztott tagoknak. A sorozat egy adott naptól szerkeszthető, meghosszabbítható és naponként lemondható."
purpose: "A tanulók és az oktatók a naptárban és az irányítópulton látják, mikor és hol lesz a következő edzés, offline is."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Edzéseket tervez, szerkeszt, hosszabbít meg, mond le és töröl"
  - role: "Tanuló"
    outcome: "Csak olvasásra látja a neki szóló edzéseket a naptárban és az irányítópulton"
rules:
  - "Az edzésnek van neve (legfeljebb 60 karakter), napja, kezdő és záró időpontja, opcionális helyszíne (legfeljebb 300 karakter, vagy *Iskola címének használata*) és célközönsége: **az egész szervezet**, **egy iskola** vagy **kiválasztott tagok**."
  - "**Egyszeri**: kiválasztott naponként egy edzés. **Ismétlődő**: egy vagy több *Ismétlés* szabály (hetente a kiválasztott napokon, vagy havonta a hónap 1–4. vagy utolsó adott hétköznapján), mindegyik saját időpontokkal, a *Kezdet* és az *Eddig* között."
  - "Egy sorozat **legfeljebb 6 hónapig** tart. A *Meghosszabbítás* a jelenlegi végétől legfeljebb 6 hónappal tolja ki; a sorozat saját 6 hónapos ablakán túl folytatássorozat indul."
  - "Az időpontok faliórás *HH:mm* értékek, így a nyári időszámítás váltása soha nem tol el edzést."
  - "**A múltbeli edzések csak olvashatók.**"
  - "Sorozathoz tartozó edzés szerkesztése vagy törlése előbb megkérdezi: **csak ez az edzés** vagy **ez és a következők**. Az *Ez és a következők* az előző napon lezárja a régi sorozatot, és a többit új sorozattal váltja fel; a korábbi edzések érintetlenek, a lemondott napok lemondottak maradnak."
  - "A *Lemondás* egy edzést lemondottnak jelöl (a naptárban marad), és visszavonható; a törlés eltávolítja."
  - "Az irányítópult a következő 7 nap edzéseit számolja."
messages:
  - situation: "Egy edzés törlése"
    message: "Törlöd ezt az edzést? Ez nem vonható vissza."
  - situation: "Ez és a következők törlése"
    message: "Törlöd ezt és a sorozat összes következő edzését? A korábbiak megmaradnak."
  - situation: "Sorozathoz tartozó edzés szerkesztése"
    title: "Ismétlődő edzés szerkesztése"
    message: "Gyerek judo egy sorozat része."
flows:
  - id: single
    title: "Egyszeri edzés"
    steps:
      - title: "Új edzés"
        text: "A naptár `+` gombjáról vagy az irányítópultról: név, *Egyszeri*, a nap (a naptárban kiválasztott napból), kezdet és vég, helyszín, *Kinek szól?*."
        screen: TrainingCreateSingle
      - title: "Létrehozás"
        text: "Kiválasztott naponként egy edzés, *kiválasztott tagok* esetén a meghívottakkal, egy tranzakcióban írva és szinkronizálva."
        screen: TrainingDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: recurring
    title: "Ismétlődő sorozat"
    steps:
      - title: "Ismétlés"
        text: "Az *Ismétlődő* megmutatja az *Ismétlés* szabályokat: Hetente a hétköznapokkal vagy Havonta a hónap hetével, mindegyik kezdettel és véggel; a piros × eltávolít egy szabályt. A *Kezdet* és az *Eddig* határolja a sorozatot (legfeljebb 6 hónap)."
        screen: TrainingCreate
      - title: "Létrehozás"
        text: "A sorozat és minden edzése az eszközön generálódik és egyszerre íródik, majd szinkronizálódik."
        screen: TrainingDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
    diagram: |
      flowchart TD
        rules[Ismétlési szabályok<br/>Kezdet – Eddig] --> expand[Kibontás napokra<br/>ismétlődő nap + idő kiszűrve]
        expand --> write[Sorozat + edzések<br/>+ meghívottak egy írásban]
        write --> sync[Szinkronizálás]
        sync --> cal[A célközönség naptárai]
  - id: series
    title: "Szerkesztés, meghosszabbítás, lemondás"
    steps:
      - title: "Edzés"
        text: "Dátum és idő, helyszín, célközönség és a sorozat kártyája a *Meghosszabbítás* gombbal; alatta *Szerkesztés* és *Lemondás*, a fejlécben kuka."
        screen: TrainingDetails
      - title: "Ez vagy a következők"
        text: "Sorozathoz tartozó edzés szerkesztése és törlése előbb megkérdezi: csak ez az edzés, vagy ez és minden következő a napjától."
        screen: TrainingScopeSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Meghosszabbítás"
        text: "Új *Eddig* legfeljebb 6 hónapra előre; a lap mutatja, hány edzést ad hozzá."
        screen: TrainingExtendSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Új / szerkesztett edzés (útvonalak `/organization/trainings/create`, `…/{trainingId}/edit`) | `src/modules/trainings/components/TrainingFormScreen.tsx`, `trainingFormState.ts`, `SeriesRuleCard.tsx`, `SchoolAddressSheet.tsx` |
| Az edzés részletei (útvonal `/organization/trainings/{trainingId}`) | `TrainingDetailsScreen.tsx`, `TrainingScopeSheet.tsx`, `ExtendSeriesSheet.tsx` |
| Létrehozás, szerkesztés, meghosszabbítás, lemondás, törlés | `src/modules/trainings/services/trainingService.ts` |
| Napok és sorozatkibontás (tiszta logika) | `src/modules/trainings/types/helpers.ts` |
| Szerveroldali szinkronizálás | `supabase/functions/sync/sync-trainings.ts` |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `training_series` | `organization_id`, `school_id`, `name`, `location`, `visibility`, `invitee_ids`, `start_date`, `end_date`, `rules` (JSON), `previous_series_id` |
| `trainings` | `organization_id`, `school_id`, `series_id`, `name`, `date`, `start_time`, `end_time`, `location`, `visibility`, `status` (`active` / `cancelled`) |
| `training_invitees` | `training_id`, `school_member_id` |

A tervezett edzés nem azonos a [jelenléti napló](./attendance) edzésével.

## Szinkronizálás

- A szervezet tulajdonosa a szervezete edzéseit feltölti és letölti; a szerver a feltöltést a hívó szervezetére korlátozza, és elveti a más szervezethez kötött sorozatlinket.
- A tanuló csak olvasásra tölti le azokat az edzéseket, amelyeknek célközönsége: a szervezet, az iskolája, vagy meghívták.
- Az edzések nem küldenek értesítést.

</FeatureView>
