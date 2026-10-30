---
layout: page
feature: events
title: Események
group: organization
accent: events
icon: calendar
order: 21
summary: "A szervezet táborai, szemináriumai, vizsgái és versenyei: az oktató eseményt hoz létre a szervezetnek, egy iskolának vagy kiválasztott tanulóknak, követi, ki jön és ki fizetett, megjelöli a vizsgázókat, és vizsgadíjat, övet rendel nekik. A tanulók Részt vesz vagy Hiányzik választ adnak."
purpose: "Eseményenként egy résztvevőlista csevegőszálak helyett: ki jön, ki fizetett, ki vizsgázik."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Eseményeket hoz létre, szerkeszt, mond le és töröl, kezeli a résztvevőket, a vizsgázókat és a rendeléseiket, vezeti az eseménytípusok listáját"
  - role: "Tanuló"
    outcome: "Értesítést kap, ha hozzáadják, és Részt vesz vagy Hiányzik választ ad, amíg az esemény tart és nincs Fizetve jelölése"
rules:
  - "Az eseménynek van neve, **típusa** (Tábor, Szeminárium, Vizsga… a szervezet vezeti), opcionális rövid megjegyzése és helyszíne, kezdő és záró napja, ára és pénzneme, valamint *Vizsgák tervezve* kapcsolója."
  - "**Kinek szól?** Az egész szervezetnek, egy iskolának vagy kiválasztott tagoknak. Az illeszkedő aktív és fiók nélküli tanulók **résztvevők** lesznek, mind *Hiányzik* állapotban."
  - "Az esemény szerkesztése hozzáadja az újonnan illeszkedő tanulókat; résztvevőt soha nem távolít el."
  - "Résztvevői állapot: **Hiányzik → Részt vesz → Fizetve**. Az oktató bármelyiket beállítja és a *Mentés* gombbal menti; a tanuló a Részt vesz / Hiányzik választ azonnal menti, kivéve ha az oktató *Fizetve* állapotba tette, vagy az esemény lemondott vagy véget ért."
  - "*Vizsgák tervezve* esetén minden résztvevőnek van **Vizsgázik** kapcsolója, amely azonnal mentődik. Csak a vizsgázók kaphatnak **eseményrendelést** (pl. vizsgadíj, öv), amelyet a résztvevők képernyőjén vázolnak fel és a *Mentés* tárol el."
  - "**Fizető résztvevőkkel rendelkező esemény nem törölhető**, csak **lemondható**. A lemondott esemény a naptárban marad, és visszaállítható."
  - "Eseményekben használt típus nem törölhető; a lap megmondja, hány esemény használja."
messages:
  - situation: "Esemény lemondása"
    title: "Lemondod: Téli tábor?"
    message: "Az esemény lemondottként a naptárban marad, így a résztvevők is ott látják."
  - situation: "Fizető résztvevőkkel rendelkező esemény törlése"
    title: "A törlés nem lehetséges"
    message: "Ennek az eseménynek 6 fizető résztvevője van, ezért nem törölhető. Mondd le helyette."
  - situation: "Esemény törlése"
    title: "Törlöd: Téli tábor?"
    message: "Az esemény és a résztvevők listája törlődik. Ez nem vonható vissza."
  - situation: "A tanulót eseményhez adták"
    title: "Hozzáadtak egy eseményhez"
    message: "Hozzáadtak ehhez: Téli tábor (dec. 20.)"
flows:
  - id: create
    title: "Új esemény"
    steps:
      - title: "Új esemény"
        text: "Név, típus, rövid megjegyzés, helyszín, kezdet és vég (a napok száma chipként), ár és pénznem, *Vizsgák tervezve* és *Kinek szól?*."
        screen: EventCreate
      - title: "Típus"
        text: "A típuslap a szervezet egyik eseménytípusát választja; az *Új hozzáadása* újat hoz létre, a fejléc ikonja megnyitja a típusok listáját átnevezéshez vagy törléshez."
        screen: EventTypePicker
      - title: "Létrehozás"
        text: "Az esemény és a résztvevői (mindenki, aki illeszkedik a célközönséghez, *Hiányzik* állapotban) íródnak és szinkronizálódnak."
        screen: EventDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "A tanulók értesítést kapnak"
        text: "Minden fiókkal rendelkező résztvevőnek, akit más adott hozzá, az adatbázis *Hozzáadtak egy eseményhez* értesítést ír, és push üzenetként elküldi."
        screen: NotificationsStudent
        api:
          - { id: send-push, x: 85, y: 36 }
    diagram: |
      sequenceDiagram
        actor I as Oktató
        participant A as Alkalmazás
        participant L as Helyi adatbázis
        participant Sync as Edge Function sync
        participant DB as Supabase adatbázis
        I->>A: Esemény, célközönség, Létrehozás
        A->>L: Esemény
        A->>L: A célközönség tagjai
        A->>L: Egy-egy résztvevő, Hiányzik
        A-)Sync: Az esemény és a résztvevők feltöltése
        Sync->>DB: Beszúrás
        DB->>DB: Hozzáadtak egy eseményhez minden fiókkal rendelkező tanulónak
  - id: participants
    title: "Résztvevők és vizsgák"
    steps:
      - title: "Az esemény részletei"
        text: "Név a napok számával, megjegyzés, típus, dátumok, helyszín, ár és a résztvevők összesítője; a *Kezelés* megnyitja a résztvevőket."
        screen: EventDetails
      - title: "Résztvevők"
        text: "A kerek gombra koppintás léptet: Hiányzik → Részt vesz → Fizetve; a *Mentés* egy kötegben tárolja a módosításokat."
        screen: EventParticipants
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Vizsgázók"
        text: "Tervezett vizsgáknál a *Vizsgázik* azonnal mentődik; a vizsgázóknál megjelenik a *Rendelés hozzáadása* és alatta az eseményrendeléseik."
        screen: EventParticipantsExams
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Eseményrendelés"
        text: "A rendelés a rögzített tanulóé és az eseményé; a *Létrehozás* vázlatként visszaadja a résztvevők képernyőjére, és az ottani *Mentés* tárolja (lásd [Rendelések](./orders))."
        screen: OrderCreateEvent
  - id: answer
    title: "A tanuló válasza"
    steps:
      - title: "Értesítés"
        text: "*Hozzáadtak egy eseményhez* a névvel és a kezdéssel; koppintásra megnyílik a tanuló eseménylistája, amelyen az esemény szerepel."
        screen: NotificationsStudent
      - title: "Részt vesz"
        text: "A tanuló eseményrészletei az eseményt és a saját állapotát mutatják; a Részt vesz / Hiányzik azonnal mentődik. Ha a tanuló *Részt vesz* választ ad, a tulajdonos értesítést kap."
        screen: Student
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: cancel
    title: "Lemondás vagy törlés"
    steps:
      - title: "Lemondás vagy törlés"
        text: "A *Lemondás* megerősítést kér; a kuka töröl, kivéve ha valaki már fizetett, ekkor a lap a lemondást ajánlja. A lemondott eseménynél a *Lemondás* helyén *Visszaállítás* áll."
        screen: EventCancelSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Eseménylista és naptárbejegyzés | `src/modules/events/components/EventListView.tsx`, `hooks/useEventList.ts`, [Naptár](./calendar) |
| Új / szerkesztett esemény (útvonalak `/organization/events/create`, `…/{eventId}/edit`) | `EventFormScreen.tsx`, `eventFormState.ts`, `hooks/useCreateEvent.ts`, `hooks/useUpdateEvent.ts` |
| Az esemény részletei (útvonal `/organization/events/{eventId}`) | `EventDetailsScreen.tsx`, `EventCancelSheet.tsx`, `cancelEvent`, `deleteEvent` a `services/eventService.ts` fájlban |
| Résztvevők (útvonal `…/{eventId}/participants`) | `EventParticipantsScreen.tsx`, `participantDrafts.ts`, `bulkSaveParticipantStatuses`, `setParticipantTakesExam`, `commitEventOrderChanges` |
| Eseménytípusok (útvonal `/organization/events/types`) | `EventTypesListScreen.tsx`, `EventTypeSheet.tsx`, `EventTypePickerSheet.tsx`, `services/eventTypeService.ts` |
| A tanuló eseményei (útvonalak `/user/events`, `/user/events/{eventId}`) | `StudentEventsScreen.tsx`, `StudentEventDetailsScreen.tsx`, `studentEvents.ts` |
| Értesítések | `notify_event_participant` a `supabase/migrations/20261001000000_notifications.sql` fájlban |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `event_types` | `organization_id`, `name` |
| `events` | `organization_id`, `school_id`, `name`, `type_id`, `short_note`, `address`, `start_date`, `end_date`, `price`, `currency`, `visibility` (`organization` / `school` / `whitelist`), `status` (`active` / `cancelled`), `exams_planned` |
| `event_participants` | `event_id`, `school_member_id`, `status` (`absent` / `attending` / `paid`), `status_changed_by`, `takes_exam` |

A `status_changed_by` megmondja az adatbázisnak, ki cselekedett: maga a tanuló (a válasza értesíti a tulajdonost) vagy valaki más (a hozzáadás értesíti a tanulót).

</FeatureView>
