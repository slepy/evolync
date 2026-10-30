---
layout: page
feature: attendance
title: Jelenlét
group: school
accent: attendance
icon: calendar-check
order: 13
summary: "Edzésnaponként egy edzés: az oktató megnyitja a mai edzést, mindenki jelenként indul, és csak a hiányzókat és igazoltakat jelöli. A tanulók a saját jelenlétüket látják."
purpose: "Gyors névsorolvasás az óra elején, offline is, és előzmény arról, ki milyen gyakran edz."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Felveszi a mai jelenlétet, javítja a korábbi edzéseket, töröl edzést"
  - role: "Tanuló"
    outcome: "Csak olvasásra látja a saját edzéseit és a jelenléti arányát"
rules:
  - "Egy iskolának **naponta egy edzése** van. Az *Új hozzáadása* a mai edzést nyitja meg, ha az már létezik."
  - "Az új edzés minden aktív vagy fiók nélküli tanulót felsorol; **mindenki Jelen állapotban indul**."
  - "Az állapotgombra koppintás sorban vált: **Jelen → Hiányzik → Igazolt**. Semmi sem mentődik a *Létrehozás* vagy a *Mentés* előtt."
  - "Az edzés megtartja azokat a tanulókat, akikkel felvették. A később felvett tanuló nem jelenik meg a régebbi edzésekben; az **archivált** tanuló megtartja az állapotát, szürkén, és nem módosítható."
  - "Az edzések hónapok szerint csoportosulnak, a legújabb elöl; mindegyik mutatja a *10 főből 7 jelen* adatot és az arány chipet (80%-tól zöld, 50%-tól borostyán, alatta piros)."
  - "Az edzés törlése megerősítés után a jelenléti adatait is törli."
  - "Az edzés időpontja a létrehozás pillanata; a tanuló az iskola neve mellett látja."
messages:
  - situation: "Edzés törlése"
    title: "Edzés törlése"
    message: "Biztosan törlöd ezt az edzést és a jelenléti adatait? Ez a művelet nem vonható vissza."
  - situation: "Még nincs edzés"
    message: "Még nincsenek edzések"
  - situation: "A törlés nem sikerült"
    message: "A törlés nem sikerült"
flows:
  - id: take
    title: "Mai jelenlét"
    steps:
      - title: "Jelenlét"
        text: "Az iskola irányítópultja a csempéről nyitja meg a Jelenlétet."
        screen: School
      - title: "Edzések"
        text: "Edzések hónapok szerint, a jelenlévők számával. Az *Új hozzáadása* a mai edzést nyitja meg, vagy újat, ha még nincs."
        screen: AttendanceList
      - title: "Ma"
        text: "Minden tanuló Jelen állapotban indul. A koppintások a kivételeket módosítják; az összesítő közben számol."
        screen: AttendanceCreate
      - title: "Létrehozás"
        text: "Az edzés és a felsorolt tanulók jelenléte egy tranzakcióban íródik és szinkronizálódik; az alkalmazás visszalép az edzésekhez."
        screen: AttendanceCreate
        api:
          - { id: sync-push, x: 84, y: 9 }
    diagram: |
      sequenceDiagram
        actor I as Oktató
        participant A as Alkalmazás
        participant L as Helyi adatbázis
        participant Sync as Edge Function sync
        I->>A: Új hozzáadása
        A->>L: Van már mai edzés?
        alt létezik
          A-->>I: A mai edzés megnyitása
        else nincs
          A->>L: Aktív és fiók nélküli tagok
          A-->>I: Mindenki Jelen
          I->>A: Hiányzók jelölése, Létrehozás
          A->>L: Edzés + tanulónként egy bejegyzés
          A-)Sync: Feltöltés
        end
  - id: correct
    title: "Edzés javítása"
    steps:
      - title: "Edzés"
        text: "Egy korábbi edzés a tanulóit az állapotukkal mutatja; a *Mentés* módosítás után jelenik meg, és egy kötegben írja a módosított listát."
        screen: AttendanceDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Törlés"
        text: "A kuka gomb megerősítés után törli az edzést és a jelenléti adatait (soft delete, szinkronizálva)."
        screen: AttendanceDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: student
    title: "A tanuló jelenléte"
    steps:
      - title: "Tanulói adatlap"
        text: "Az oktató egy tanuló jelenlétét az adatlapján látja, és ott is módosíthatja."
        screen: StudentDetailsAttendance
      - title: "Jelenlétem"
        text: "A tanulói irányítópultról: az edzések száma és a jelenléti arány, utána az edzések hónapok szerint az iskolával, az időponttal és az állapottal. A tanuló eszközére csak a saját jelenléte kerül."
        screen: StudentAttendance
        api:
          - { id: sync-pull, x: 84, y: 9 }
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Edzések (útvonal `/school/{schoolId}/attendance`) | `app/school/[schoolId]/attendance/index.tsx`, `src/modules/attendance/components/AttendanceSessionsScreen.tsx`, `hooks/useAttendanceSessionList.ts` |
| Mai edzés (útvonal `…/attendance/create`) | `AttendanceCreateScreen.tsx`, `createSessionWithAttendance` a `services/attendanceService.ts` fájlban |
| Az edzés részletei (útvonal `…/attendance/{sessionId}`) | `AttendanceSessionScreen.tsx`, `AttendanceSessionBody.tsx`, `hooks/useAttendance.ts`, `bulkSaveAttendanceList`, `deleteTrainingSession` |
| A tanuló jelenléte (útvonal `/user/attendance`) | `app/user/attendance.tsx`, `StudentAttendanceScreen.tsx`, `hooks/useStudentAttendance.ts` |
| Csoportosítás, számlálók, dátumok (tiszta logika) | `src/modules/attendance/sessionList.ts` |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `training_sessions` | `school_id`, `session_date`, `notes` |
| `attendance_records` | `training_session_id`, `school_member_id`, `status` (`present` / `absent` / `excused`) |

A jelenléti napló edzése nem azonos a [tervezett edzéssel](./trainings): a tervezett edzés a menetrend, a napló edzése az, ami megtörtént.

## Szinkronizálás

- A szervezet tulajdonosa az iskolái összes edzését és jelenlétét feltölti és letölti.
- A tanuló az iskolája edzéseit és **csak a saját** jelenlétét tölti le.
- A `20261029000000_resync_payments_attendance` migráció egyszer megérinti az összes élő edzést és bejegyzést, hogy azok a tanulók, akiknél kimaradtak, újra letöltsék őket.

## Megjegyzések

- A *naponta egy edzést* az eszköz ellenőrzi, az élő edzéseknél pedig a szerver egyedi indexe is (`school_id`, `date`). Ha két eszköz offline ugyanarra a napra vesz fel jelenlétet, a szerver elutasítja a második edzést; az és a jelenléti adatai csak azon az eszközön maradnak.
- A jelenlét nem küld értesítést.

</FeatureView>
