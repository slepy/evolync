---
layout: page
feature: join-school
title: Csatlakozás iskolához
group: school
accent: school
icon: ticket
order: 10
summary: "A tanuló beírja az edzőjétől kapott kódot, és kérést küld. Az edző jóváhagyja, és a tanuló az iskola tagja lesz."
purpose: "A tanulók maguk csatlakoznak, az edzőnek nem kell begépelnie az adataikat. A jóváhagyással az edző dönti el, ki kerül be."
who:
  - role: "Tanuló"
    outcome: "Kérést küld az iskola kódjával"
  - role: "Edző (az iskola tulajdonosa)"
    outcome: "A Tanulók között jóváhagyja vagy elutasítja"
rules:
  - "Közvetlenül a tanuló regisztrációja után indul, a tanulói irányítópult *Csatlakozás iskolához* gombjáról, vagy a kontextusváltó *Csatlakozás másik iskolához* pontjából."
  - "Internet kell hozzá. Offline a képernyő figyelmeztetést mutat, a *Csatlakozás* gomb pedig inaktív."
  - "A kód tetszőleges hosszú betű- és számsor; a kis- és nagybetű mindegy (az alkalmazás nagybetűsre alakítja). Addig érvényes, amíg le nem jár, vagy az edző nem törli."
  - "Iskolánként egy **függő** kérés, és az iskola aktív tagja nem küldhet kérést. Elutasítás után a tanuló új kérést küldhet, amely leváltja az elutasított kártyát."
  - "A tanulói irányítópult *Jóváhagyásra vár* vagy *Elutasítva* állapotban mutatja a kérést; az elutasított kártya bezárható. A jóváhagyás *Kérés elfogadva* értesítésként érkezik az Értesítésekbe és push üzenetként."
  - "Az edző jóváhagyhatja **új tagként**, vagy **összekapcsolhatja egy meglévő taggal**, akit korábban fiók nélkül vett fel, és a tanulót egyúttal befizetési időszakokhoz és eseményekhez adhatja."
messages:
  - situation: "Ismeretlen vagy lejárt kód"
    title: "Ez a kód nem működik"
    message: "Nem létezik, vagy lejárt. Kérj újat az edződtől."
  - situation: "A kérés már el van küldve"
    title: "A kérést már elküldted"
    message: "A csatlakozási kérelmed már folyamatban van. Várd meg az edző jóváhagyását."
  - situation: "Már tag"
    title: "Már tag vagy"
    message: "Már aktív tagja vagy ennek az iskolának."
  - situation: "Offline"
    message: "Az iskolához való csatlakozáshoz internetkapcsolat szükséges."
flows:
  - id: request
    title: "A tanuló kérést küld"
    steps:
      - title: "Még nincs iskola"
        text: "Iskola nélkül a tanulói irányítópult a *Csatlakozás iskolához* lehetőséget kínálja."
        screen: NoSchool
      - title: "A kód megadása"
        text: "Az alkalmazás előbb az eszközön keresi a meghívót; ha nincs ott (az edző másik eszközön hozta létre), a Supabase-től kér érvényes, le nem járt kódot."
        screen: JoinSchoolFilled
        api:
          - { id: school-invites-by-code, x: 80, y: 93 }
      - title: "A kód nem működik"
        text: "Nincs érvényes meghívó: a sáv új kódot kér. A függő kérésnek és az aktív tagságnak saját üzenete van."
        screen: JoinSchoolError
      - title: "Offline"
        text: "Kapcsolat nélkül a figyelmeztetés elmondja, miért, és a *Csatlakozás* inaktív marad."
        screen: JoinSchoolOffline
      - title: "Kérés elküldve"
        text: "A kérés helyben *pending* állapotban mentődik, és a szinkronizálás viszi fel; az alkalmazás az iskolát is lekéri, hogy a nevét mutathassa."
        screen: JoinSchoolSent
        api:
          - { id: sync-push, x: 82, y: 93 }
          - { id: schools-by-id, x: 12, y: 51 }
      - title: "Az edző értesítést kap"
        text: "Egy adatbázis-trigger értesítést hoz létre az iskola tulajdonosának, a `send-push` pedig eljuttatja a telefonjára."
        api:
          - { id: send-push }
    diagram: |
      sequenceDiagram
        actor S as Tanuló
        participant A as Alkalmazás
        participant L as Helyi adatbázis
        participant DB as Supabase adatbázis
        participant Sync as Edge Function sync
        participant P as send-push
        S->>A: Kód, Csatlakozás
        A->>L: Van meghívó ezzel a kóddal?
        alt nincs az eszközön
          A->>DB: school_invites kód alapján (nem lejárt)
        end
        alt nincs érvényes meghívó
          A-->>S: Ez a kód nem működik
        else meghívó megvan
          A->>L: Van már kérés vagy tagság?
          alt igen
            A-->>S: A kérést már elküldted / Már tag vagy
          else nem
            A->>L: Kérés létrehozása (pending)
            A-->>S: Kérés elküldve
            A-)Sync: A kérés feltöltése
            Sync->>DB: Insert school_join_requests
            DB->>DB: Értesítés az iskola tulajdonosának
            DB-)P: Push az edzőnek
            A-)DB: Az iskola lekérése, ha helyben hiányzik
          end
        end
  - id: decision
    title: "Az edző dönt"
    steps:
      - title: "Új csatlakozási kérés"
        text: "Az edző az Értesítésekben (és push üzenetként) látja az *Új csatlakozási kérés* értesítést, és a Tanulók között nyitja meg."
        screen: NotificationsOrg
      - title: "Jóváhagyás vagy elutasítás"
        text: "A jóváhagyás aktív tagot hoz létre Student szereppel, vagy a tanuló fiókjával aktiválja az offline tagot; a tanuló egyúttal befizetési időszakokhoz és eseményekhez adható. Az elutasítás *Elutasítva* állapotba teszi a kérést. A változás mindkét esetben a szinkronizálással megy fel."
        screen: StudentsRequests
        api:
          - { id: sync-push, x: 85, y: 47 }
      - title: "A tanuló irányítópultja"
        text: "A tanuló *Kérés elfogadva: Mostantól tag vagy itt: …* értesítést kap az Értesítésekben és push üzenetként. Az iskola azonnal megjelenik: az alkalmazás figyeli a tanuló saját tagságait a helyi adatbázisban, a szinkronizálás pedig teljes egészében letölti az új iskola adatait."
        screen: Student
        api:
          - { id: send-push }
          - { id: sync-pull, x: 86, y: 10 }
    diagram: |
      flowchart TD
        req[Csatlakozási kérés<br/>Jóváhagyásra vár] --> decide{Edző}
        decide -- Jóváhagyás --> mode{Új vagy meglévő tag?}
        mode -- új --> create[Új aktív tag<br/>Student szereppel]
        mode -- meglévő --> link[Az offline tag aktiválása<br/>a tanuló fiókjával]
        create --> extra[Hozzáadás a kiválasztott<br/>befizetési időszakokhoz és eseményekhez]
        link --> extra
        extra --> del[A kérés törlése]
        decide -- Elutasítás --> rej[A kérés Elutasítva<br/>a tanuló látja]
        del --> sync[Szinkronizálás]
        rej --> sync
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Route `/school/join` (`from=signup`) | `app/school/join.tsx` |
| Képernyők | `src/modules/school/components/JoinSchoolScreen.tsx`, `JoinRequestSent.tsx` |
| Hibaszövegek | `src/modules/school/components/joinSchoolError.ts` |
| Csatlakozási logika | `src/modules/school/services/joinSchoolService.ts`, `hooks/useJoinSchool.ts` |
| Kérések (helyi adatbázis) | `src/modules/school/repositories/schoolJoinRequestRepository.ts` |
| Jóváhagyás / elutasítás | `approveJoinRequest`, `rejectJoinRequest` a `src/modules/students/services/studentService.ts` fájlban, `ApproveJoinRequestSheet.tsx` |
| Kéréskártya a tanulói irányítópulton | `src/modules/dashboard/components/StudentDashboard.tsx` |
| Értesítés a tulajdonosnak (SQL) | `notify_join_request_created` a `supabase/migrations/20261001000000_notifications.sql` fájlban |

## Táblák

| Tábla | Szerep |
| --- | --- |
| `school_invites` | Kódok: `school_id`, `role_id`, `code`, `expires_at` |
| `school_join_requests` | Kérések: `school_id`, `user_id`, `display_name`, `email`, `status` (`pending` / `rejected`) |
| `school_members` | Jóváhagyáskor jön létre vagy aktiválódik |

## Megjegyzések

- **2026.09.28-tól a kérések nem jutottak el a szerverre** a `20261026000200` migrációig: az alkalmazás olyan `status` oszlopot küldött, amely a táblában nem volt, és a szinkronizálás eldobta a kérést. A migráció felveszi az oszlopot, és az egyediséget a függő kérésekre szűkíti; egy egyszeri javítás (`src/database/resendJoinRequests.ts`) minden eszközön újra elküldi az elveszett kéréseket.
- Az ismétlődés-ellenőrzés csak a helyi adatbázison fut. Olyan eszközön, amely még soha nem szinkronizálta a felhasználó rekordjait, a kérés átmegy, és a Supabase egyediségi megkötései jelentik a védelmet.
- A jóváhagyási értesítést (`join_request_approved`) egy trigger hozza létre a tanuló `school_members` során (`20261026000000` migráció); a `useOwnMembershipsWatcher` újbóli bejelentkezés nélkül veszi fel az új iskolát a kontextusváltóba.

</FeatureView>
