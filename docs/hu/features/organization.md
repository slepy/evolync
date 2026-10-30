---
layout: page
feature: organization
title: Szervezet
group: organization
accent: organization
icon: building
order: 20
summary: "Az oktató kezdőlapja: a szervezet irányítópultja a következő programmal, az iskolák listájával és a rendelések, termékek és fokozatok csempéivel. A környezetváltó a szervezet és azon iskolák között vált, ahol a felhasználó tanulóként edz."
purpose: "Egy kiindulópont mindenhez, amit a tulajdonos kezel, és egy kapcsoló azoknak, akik tanítanak és edzenek is."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Egy pillantással látja a szervezetet, megnyit egy iskolát vagy modult, iskolát ad hozzá, átvált egy iskolára, ahol edz"
  - role: "Tanuló"
    outcome: "Vált az iskolák között, ahol edz, és csatlakozik egy újhoz"
rules:
  - "Minden oktatónak **egy szervezete** van, amely regisztrációkor jön létre (lásd [Regisztráció](./sign-up))."
  - "A **Következő** doboz a szervezet legközelebbi eseményét vagy edzését mutatja; a naptár ikon megnyitja a [Naptárat](./calendar)."
  - "Az *Iskoláid* a szervezet iskoláit sorolja a címükkel; az *Új hozzáadása* új iskolát nyit."
  - "*Kezelés* csempék: **Rendelések** (minden iskola), **Termékek**, **Fokozatok**; a csempe `+` gombja egyből új tételt nyit."
  - "Az új iskolához név kell (2–100 karakter); létrehozás után rögtön a saját irányítópultja nyílik meg."
  - "A **környezetváltó** (bal fent) a *KEZELÉS* alatt a felhasználó szervezetét, a *TANULÓKÉNT EDZEK* alatt minden iskolát mutat, ahol aktív tanuló. Koppintásra vált és bezárul; a *Csatlakozás másik iskolához* megnyitja a [Csatlakozás iskolához](./join-school) képernyőt."
  - "A kiválasztott tanulói környezetet az eszköz megjegyzi."
  - "Az irányítópulton minden a helyi adatbázisból jön, és offline is működik."
messages:
  - situation: "Túl rövid iskolanév"
    message: "A névnek legalább 2 karakterből kell állnia"
flows:
  - id: dashboard
    title: "Irányítópult és iskolák"
    steps:
      - title: "Szervezeti irányítópult"
        text: "Borostyán fejléc a környezetváltóval és a Synced jelzéssel, *Következő*, *Iskoláid* az *Új hozzáadása* gombbal, majd a *Kezelés* csempék."
        screen: Main
        api:
          - { id: sync-pull, x: 84, y: 5 }
      - title: "Esemény és edzés"
        text: "A *Következő* a nap legközelebbi eseményét és edzését sorolja."
        screen: MainC
      - title: "Új iskola"
        text: "*Új hozzáadása* az *Iskoláid* alatt: név, *Létrehozás*. Az iskola helyben íródik és szinkronizálódik; az alkalmazás megnyitja az irányítópultját."
        screen: School
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: switch
    title: "Környezetváltás"
    steps:
      - title: "Környezet váltása"
        text: "*KEZELÉS*: a saját szervezet az iskolák számával. *TANULÓKÉNT EDZEK*: iskolák, ahol a felhasználó tanuló, a várossal. Egy másik szervezet iskoláját, ha hiányzik az eszközről, egyszer letölti a Supabase-ből."
        screen: Switcher
        api:
          - { id: schools-by-id, x: 50, y: 78 }
      - title: "Tanulói irányítópult"
        text: "A *TANULÓKÉNT EDZEK* alatti iskola megnyitja annak az iskolának a [Tanulói irányítópultját](./student-dashboard)."
        screen: Student
    diagram: |
      flowchart TD
        sw[Környezetváltó] --> org{Lehetőség}
        org -- szervezet --> od[Szervezeti irányítópult]
        org -- iskola tanulóként --> mem[Tagság megjegyzése<br/>az eszközön]
        mem --> sd[Tanulói irányítópult]
        org -- Csatlakozás másik iskolához --> join[Csatlakozás iskolához]
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Szervezeti irányítópult (útvonal `/organization/dashboard`) | `app/organization/dashboard.tsx`, `src/modules/organization/components/Dashboard.tsx`, `hooks/useOrganizationDashboard.ts` |
| A csak tulajdonosi képernyők védelme | `src/modules/organization/hooks/useRequireOrganizationOwner.ts` |
| Új iskola (útvonal `/school/create`) | `app/school/create.tsx`, `createSchool` a `src/modules/school/services/schoolService.ts` fájlban, `validation/schoolSchema.ts` |
| Környezetváltó és lap | `src/core/components/ContextSwitcher/` (`ContextSwitcher`, `ContextSheet`, `useContextSwitch`) |
| Az irányítópult elrendezése és fejléce | `DashboardPage`, `DashboardHeader`, `NextUp`, `ModuleTileGrid` a `src/core/components` mappában |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `organizations` | `owner_id`, `name` |
| `schools` | `organization_id`, `name`, `address` |

</FeatureView>
