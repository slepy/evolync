---
layout: page
feature: school
title: Iskolai irányítópult
group: school
accent: school
icon: house
order: 10
summary: "Egy iskola kezdőlapja az oktatónak: az iskola következő edzései, a Tanulók, Befizetések, Rendelések és Jelenlét csempéi, valamint az iskola beállításai a névvel, címmel és az alapértelmezett befizetési összeggel."
purpose: "Minden egy iskoláról egy helyen, az iskola pirosában."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Megnyitja az iskola moduljait, tételeket ad hozzá a csempékről, módosítja az iskola nevét, címét és befizetési alapértékeit"
rules:
  - "Az iskolai irányítópult a [szervezeti irányítópult](./organization) *Iskoláid* listájából nyílik."
  - "A *Következő* az iskola közelgő edzéseit mutatja; a naptár ikon megnyitja az iskola [Naptárát](./calendar)."
  - "Csempék: **Tanulók**, **Befizetések**, **Rendelések**, **Jelenlét**, mindegyik rövid állapotsorral; a csempe `+` gombja egyből új tételt nyit."
  - "*Iskola beállításai*: ISKOLA NEVE (2–100 karakter), CÍM (legfeljebb 500), ALAPÉRTELMEZETT ÖSSZEG és PÉNZNEM. A *Mentés* az első módosítás után jelenik meg."
  - "Az alapértelmezett összeg csak az **új** számlázási időszakokra vonatkozik; a meglévők megtartják az összegüket (lásd [Befizetések](./payments))."
  - "Az iskola címe edzés helyszíneként is használható (*Iskola címének használata*)."
messages:
  - situation: "A befizetési alapértékek alatt"
    message: "Az alapértékek módosítása nem változtatja meg a már létező időszakokat."
flows:
  - id: dashboard
    title: "Iskolai irányítópult"
    steps:
      - title: "Iskola"
        text: "Vissza gomb, az iskola neve és a Synced jelzés; a piros *Következő* doboz az iskola edzéseivel; a modulcsempék és az *Iskola beállításai* sor."
        screen: School
      - title: "Iskola beállításai"
        text: "*Alapadatok* (név, cím) és *Befizetési alapértékek* (összeg, pénznem). A *Mentés* írja az iskolát és a beállításait, és szinkronizál."
        screen: SchoolSettingsEdited
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Iskolai irányítópult (útvonal `/school/{schoolId}/dashboard`) | `app/school/[schoolId]/dashboard/index.tsx`, `src/modules/dashboard/components/SchoolDashboard.tsx` |
| A csempék állapotsorai | `src/modules/dashboard/hooks/schoolTileSubtitles.ts` |
| Iskola beállításai (útvonal `/school/{schoolId}/settings`) | `app/school/[schoolId]/settings.tsx`, `src/modules/school/components/SchoolSettingsScreen.tsx`, `services/schoolSettingsService.ts`, `validation/schoolSchema.ts` |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `schools` | `organization_id`, `name`, `address` |
| `school_settings` | `school_id`, `default_payment_amount`, `default_currency` |

</FeatureView>
