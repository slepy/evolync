---
layout: page
feature: student-dashboard
title: Tanulói irányítópult
group: student
accent: student
icon: user
order: 30
summary: "A tanuló kezdőlapja: iskolában a következő program (események és edzések), a befizetései, jelenléte és rendelései csempéi, valamint a technikai jegyzetfüzet. Iskola nélkül a Csatlakozás iskolához doboz és a jóváhagyásra váró kérések."
purpose: "Egy pillantással megmutatja a tanulónak a klub életét, és offline is működik, azoknak is, akik maguk soha nem vezetnek iskolát."
who:
  - role: "Tanuló"
    outcome: "Látja a következő eseményt és edzést, megnyitja a befizetéseit, jelenlétét, rendeléseit és jegyzetfüzetét, csatlakozik egy iskolához"
  - role: "Máshol edző oktató"
    outcome: "Ugyanezt az irányítópultot kapja, ha a *TANULÓKÉNT EDZEK* alatt egy iskolára vált"
rules:
  - "**Iskolában** (kék környezet): környezetváltó az iskola nevével, *Következő* a legközelebbi eseménnyel és edzéssel, **Befizetések**, **Jelenlét**, **Rendelések** csempék, majd a [technikai jegyzetfüzet](./notes)."
  - "**Iskola nélkül** (semleges környezet): *Irányítópultom*, a *Még nem vagy beiratkozva egyetlen iskolába sem* doboz a *Csatlakozás iskolához* gombbal, és a jegyzetfüzet."
  - "Az oktatóra váró csatlakozási kérések a doboz alatt látszanak, amíg döntés nem születik; az elutasított kérés ezt jelzi, és új küldhető."
  - "A *Következő* naptár ikonja megnyitja a tanuló [Naptárát](./calendar); egy esemény a részleteit nyitja meg, ahol a tanuló *Részt vesz* vagy *Hiányzik* választ ad (lásd [Események](./events))."
  - "Minden, amit a tanuló lát, a saját adata: az eszközére csak a saját befizetései, jelenléte és rendelései kerülnek."
flows:
  - id: home
    title: "Irányítópult"
    steps:
      - title: "Még nincs iskola"
        text: "Rögtön regisztráció után: a *Csatlakozás iskolához* doboz és a jegyzetfüzet; a függő kérések a doboz alatt jelennek meg."
        screen: NoSchool
      - title: "Iskolában"
        text: "*Következő* az eseménnyel és az edzéssel, utána a csempék. A Synced jelzés mutatja, hogy minden a szerveren van-e."
        screen: Student
        api:
          - { id: sync-pull, x: 84, y: 10 }
      - title: "Befizetések"
        text: "Csak olvasható: időszakok az összeggel és az állapottal, valamint a még fizetendő összeg (lásd [Befizetések](./payments))."
        screen: StudentPayments
      - title: "Jelenlét"
        text: "Csak olvasható: edzések hónapok szerint és a jelenléti arány (lásd [Jelenlét](./attendance))."
        screen: StudentAttendance
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Tanulói irányítópult (útvonal `/user/dashboard`) | `app/user/dashboard.tsx`, `src/modules/dashboard/components/StudentDashboard.tsx`, `NoSchoolCard.tsx` |
| Aktív tagság (melyik iskola) | `getActiveMembership()` a store-ban, `activeMembershipId` az AsyncStorage-ban |
| Tanulói képernyők | `/user/payments`, `/user/attendance`, `/user/orders`, `/user/events`, `/user/calendar` |
| Jegyzetfüzet szakasz | `TechniqueNotebook` a `src/core/components` mappában |

</FeatureView>
