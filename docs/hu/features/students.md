---
layout: page
feature: students
title: Tanulók
group: school
accent: students
icon: users
order: 11
summary: "Az iskola tanulóinak listája az edző kezében: meghívókódok, csatlakozási kérések, fiók nélkül felvett tanulók, és minden tanuló kártyája fokozattal, összeggel, befizetésekkel, jelenléttel, rendelésekkel és eseményekkel."
purpose: "Egy hely, ahol az edző az iskola embereit kezeli: kóddal engedi be a tanulókat, felveszi azokat, akik soha nem telepítik az alkalmazást, és egy tanulóról mindent lát és módosít."
who:
  - role: "Edző (szervezet tulajdonosa)"
    outcome: "Csak a tulajdonos nyithatja meg a Tanulókat; mást visszairányít"
  - role: "Tanuló"
    outcome: "Jóváhagyás után kerül a listára, vagy az edző veszi fel fiók nélkül"
rules:
  - "A listán előbb a fiókkal rendelkező tagok állnak, aztán a függőben lévők, végül a fiók nélküli tanulók, csoportonként név szerint. Az **archivált** tanulók rejtve vannak. A keresés névben és e-mailben keres, a kis- és nagybetűtől és az ékezetektől függetlenül."
  - "Egy iskolának **egy aktív meghívókódja** van. Az új kód azonnal leváltja a régit. A kód 6 betű és számjegy, és 1, 7 vagy 30 napig érvényes."
  - "A *Kérések* fül számlálóval mutatja a függő kéréseket; az új kérésről szóló értesítés ezt a fület nyitja meg."
  - "Jóváhagyáskor az edző a kérést egy **korábban fiók nélkül felvett** tanulóhoz kapcsolhatja, így az előzmények (befizetések, jelenlét) egy személynél maradnak, és ugyanabban a lépésben hozzáadhatja a tanulót a futó befizetési időszakokhoz és a közelgő eseményekhez."
  - "A **fiók nélküli** tanuló azonnal kész, offline is, *Nincs fiók* jelölést kap, és rögzíthető a jelenléte és a befizetései."
  - "Csak a fiók nélküli tanulók szerkeszthetők; a fiókkal rendelkezők maguk kezelik a nevüket, e-mail-címüket és telefonszámukat."
  - "Az **archiválás** elrejti a tanulót a listákról, és megőrzi a teljes előzményt."
  - "A tanulónak lehet **saját befizetendő összege** (pl. gyereknek a fele) az új befizetési időszakokra; a meglévő befizetések megtartják az összegüket."
  - "A fokozat, valamint a befizetések, a jelenlét és az események állapota koppintásra változik, és a *Mentés* gombbal tárolódik."
messages:
  - situation: "Kód másolva"
    title: "Másolva"
    message: "A(z) K7M42Q kód a vágólapra másolva"
  - situation: "Nem sikerült kódot létrehozni"
    message: "Nem sikerült meghívókódot létrehozni. Próbáld újra."
  - situation: "Kérés elutasítása"
    title: "Kérés elutasítása"
    message: "A tanuló elutasítottként látja a kérést, és kóddal újat küldhet."
  - situation: "Jóváhagyás meglévő tanulóként, tanuló kiválasztása nélkül"
    message: "Válassz egy meglévő tanulót."
  - situation: "Nincs összekapcsolható fiók nélküli tanuló"
    message: "Ebben az iskolában nincsenek offline tanulók."
  - situation: "Tanuló archiválása"
    title: "Tanuló archiválása"
    message: "A tanuló archiválásra kerül, és lekerül az aktív tanulók listájáról. Az előzményei megmaradnak."
flows:
  - id: invite
    title: "Meghívókód"
    steps:
      - title: "Tanulók"
        text: "Az iskolai irányítópult csempéje nyitja meg a Tanulókat."
        screen: School
      - title: "Aktív kód"
        text: "A felső kártya mutatja az iskola aktív kódját és lejáratát. A *Másolás* a vágólapra teszi, hogy elküldhető legyen a tanulóknak."
        screen: StudentsList
      - title: "Új kód"
        text: "Az *Új hozzáadása* melletti négyzetes gomb új kódot nyit."
        screen: StudentsList
      - title: "1, 7 vagy 30 napig érvényes"
        text: "A kódot az eszköz sorsolja (6 karakter, A–Z és 0–9), és a helyben tárolt kódokkal veti össze. Az iskola előző kódja érvénytelenné válik, az új helyben mentődik és szinkronizálódik."
        screen: StudentInviteCreate
        api:
          - { id: sync-push, x: 82, y: 77 }
      - title: "A tanuló használja"
        text: "A tanuló a [Csatlakozás iskolához](./join-school) képernyőn írja be a kódot; a másik eszközön létrehozott kódot a Supabase-ben keresi meg az alkalmazás."
        screen: JoinSchoolFilled
        api:
          - { id: school-invites-by-code, x: 80, y: 93 }
    diagram: |
      sequenceDiagram
        actor I as Edző
        participant A as Alkalmazás
        participant L as Helyi adatbázis
        participant Sync as Edge Function sync
        actor S as Tanuló
        I->>A: Új meghívókód, 7 napig érvényes
        A->>A: 6 karakteres kód sorsolása
        A->>L: Foglalt már a kód?
        A->>L: Az iskola aktív kódjának érvénytelenítése
        A->>L: Az új kód mentése
        A-)Sync: A kód feltöltése
        I-->>S: Elküldi a kódot
        S->>A: Csatlakozás iskolához a kóddal
  - id: requests
    title: "Csatlakozási kérések"
    steps:
      - title: "Kérések"
        text: "A *Kérések* fül a függő kéréseket mutatja érkezési idejükkel; a jelvény a számukat adja."
        screen: StudentsRequests
      - title: "Jóváhagyás"
        text: "A jóváhagyás lapot nyit: **új tanuló** vagy **meglévő tanuló** (fiók nélkül felvett), a ma futó befizetési időszakok és a közelgő események. Az új tag Student szerepet kap; a meglévőt a tanuló fiókja aktiválja. A befizetések a tanuló saját összegét vagy az iskolai alapértéket kapják; az eseményekben a tanuló hiányzóként indul. A kérés törlődik, minden a szinkronizálással megy fel, a tanuló pedig *Kérés elfogadva* értesítést kap."
        screen: StudentsRequests
        api:
          - { id: sync-push, x: 85, y: 47 }
      - title: "Elutasítás"
        text: "Megerősítés után a kérés *Elutasítva* állapotba kerül; a tanuló ezt az irányítópultján látja, és kóddal új kérést küldhet, amely leváltja az elutasítottat."
        screen: StudentsRequests
        api:
          - { id: sync-push, x: 70, y: 47 }
    diagram: |
      flowchart TD
        req[Csatlakozási kérés] --> act{Edző}
        act -- Jóváhagyás --> type{Új vagy meglévő tanuló?}
        type -- új --> create[Aktív tag<br/>Student szereppel]
        type -- meglévő --> link[A fiók nélküli tanuló<br/>fiókot kap és aktív lesz]
        create --> extra[Kiválasztott befizetési időszakok<br/>és közelgő események]
        link --> extra
        extra --> done[A kérés törlődik]
        act -- Elutasítás --> rej[A kérés Elutasítva]
        done --> sync[Szinkronizálás]
        rej --> sync
  - id: offline
    title: "Fiók nélküli tanuló"
    steps:
      - title: "Új hozzáadása"
        text: "A lista *Új hozzáadása* gombja nyitja meg az űrlapot."
        screen: StudentsList
      - title: "Új tanuló"
        text: "A teljes név kötelező (2–100 karakter); az e-mail és a telefon nem. A megjegyzés elmondja, hogy a tanuló azonnal *Nincs fiók* jelöléssel jelenik meg."
        screen: StudentCreate
        api:
          - { id: sync-push, x: 82, y: 83 }
      - title: "A listán"
        text: "A tanuló *Nincs fiók* jelöléssel a listán van, és rögzíthető a jelenléte és a befizetései. Ha később kóddal csatlakozik, az edző jóváhagyáskor összekapcsolja."
        screen: StudentsList
    diagram: |
      sequenceDiagram
        actor I as Edző
        participant A as Alkalmazás
        participant L as Helyi adatbázis
        participant Sync as Edge Function sync
        I->>A: Név, e-mail, telefon, Létrehozás
        A->>L: A szervezet Student szerepe
        A->>L: Tag offline állapotban (Nincs fiók)
        A-->>I: Vissza a listára
        A-)Sync: A tag feltöltése
  - id: card
    title: "Tanulói kártya"
    steps:
      - title: "Tanuló"
        text: "Elérhetőség, fokozat, a tanuló befizetendő összege és négy fül: befizetések, jelenlét, rendelések és események. Az állapotra koppintva a következőre vált; a *Mentés* akkor jelenik meg, ha valami változott."
        screen: StudentDetails
        api:
          - { id: sync-push, x: 86, y: 82 }
      - title: "Fokozat"
        text: "A fokozatlap a szervezet fokozatait mutatja az övek színeiben; a választás a *Mentés* gombbal tárolódik."
        screen: StudentRankSheet
      - title: "Szerkesztés vagy archiválás"
        text: "A ⋯ menü: *Szerkesztés* (csak fiók nélküli tanulóknál) és *Archiválás*, amely elrejti a tanulót, és megőrzi az előzményeit."
        screen: StudentActionsSheet
        api:
          - { id: sync-push, x: 50, y: 92 }
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Tanulók és kérések (route `/school/{schoolId}/students`, `?tab=requests`) | `app/school/[schoolId]/students/index.tsx`, `src/modules/students/components/StudentsScreen.tsx` |
| A képernyő adatai | `src/modules/students/hooks/useStudentsOverview.ts` |
| Lista sorrendje, állapotjelölés, kérés kora | `src/modules/students/studentList.ts` |
| Új meghívókód (route `…/students/generate-invite`) | `InviteCreateScreen.tsx`, `InviteCodeCard.tsx`, `src/modules/school/services/inviteService.ts` |
| Jóváhagyás / elutasítás | `ApproveJoinRequestSheet.tsx`, `approveJoinRequest`, `rejectJoinRequest` a `services/studentService.ts` fájlban |
| Új / szerkesztett tanuló (routes `…/students/create`, `…/{studentId}/edit`) | `StudentFormScreen.tsx`, `validation/studentSchema.ts`, `createStudent`, `updateStudent` |
| Tanulói kártya (route `…/students/{studentId}`) | `StudentDetailsScreen.tsx`, `StudentRankSheet.tsx`, `StudentPaymentAmountSheet.tsx`, `StudentActionsSheet.tsx` |
| Tagok (helyi adatbázis) | `src/modules/students/repositories/studentRepository.ts` |

Minden előbb a helyi adatbázisba íródik, és a háttérben szinkronizálódik; csak a [Csatlakozás iskolához](./join-school) kódkeresése olvassa közvetlenül a Supabase-t.

## Tagállapotok

| Állapot | Jelentés | A listán |
| --- | --- | --- |
| `active` | Alkalmazásfiókkal rendelkező tag | nincs jelölés |
| `offline` | Az edző vette fel, nincs fiókja | *Nincs fiók* |
| `pending` | Függőben | *Függőben* |
| `rejected` | Elutasítva | *Elutasítva* |
| `archived` | Archivált, előzmények megőrizve | rejtve |

## Megjegyzések

- A tanulói űrlap mezőhibái fordítási kulcsok (`nameTooShort`, `nameTooLong`, `invalidEmail`, `emailTooLong`), megjelenítéskor fordítódnak, a hosszkorlát `{{count}}` értékként kerül beléjük.
- **A kód egyediségét csak az eszköz ellenőrzi.** Két eszköz ugyanazt a kódot sorsolhatja; 36⁶ lehetőség mellett ez valószínűtlen. Ha 5 próbálkozás után sincs szabad kód, a képernyő a *Nem sikerült meghívókódot létrehozni* üzenetet mutatja.
- A Student szerepet az alkalmazás a helyi adatbázisból olvassa; az az eszköz, amely még nem szinkronizálta a szervezet szerepeit, szerep nélkül hozza létre a tagot.

</FeatureView>
