---
layout: page
feature: notifications
title: Értesítések
group: account
accent: brand
icon: bell
order: 5
summary: "Postafiók a Riasztások fülön és push üzenetek az eszközön: a tulajdonosok új rendelésekről, csatlakozási kérésekről és eseményjelentkezésekről értesülnek; a tanulók új befizetésekről, eseményhez adásról és jóváhagyott csatlakozási kérésről. Koppintásra megnyílik az érintett hely."
purpose: "Elmondja, mi változott, anélkül hogy minden képernyőt meg kellene nyitni, akkor is, ha az alkalmazás zárva van."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Értesül az új rendelésekről, csatlakozási kérésekről és az eseményekre jelentkező tanulókról"
  - role: "Tanuló"
    outcome: "Értesül az új befizetésekről, az eseményhez adásról és a csatlakozási kérés jóváhagyásáról"
rules:
  - "Az értesítéseket **az adatbázis** írja (triggerek), soha nem az alkalmazás, így a címzetthez jutnak, bármelyik eszköz cselekedett."
  - "Senki nem kap értesítést a saját műveletéről (a magának rendelő tulajdonos, a magát hozzáadó tanuló)."
  - "A postafiók a többi adathoz hasonlóan szinkronizálódik és offline működik; a sorok *Ma*, *Tegnap*, *Korábban* csoportokba rendeződnek az újak számával; az *Összes megjelölése olvasottként* helyben jelöl és szinkronizál."
  - "Egy sort a mellette lévő **kuka gombbal** lehet törölni, a *Törlöd ezt az értesítést?* kérdés után; a fejlécben lévő kuka (*Összes törlése*) a *Törlöd az összes értesítést?* kérdést teszi fel. A törlés puha törlés, amely szinkronizálódik, így az értesítés a személy többi eszközéről is eltűnik; a szerver csak a hívó saját, élő soraira fogadja el."
  - "Koppintásra az értesítés olvasott lesz, és megnyílik: a rendelés, az iskola kérései, az esemény, a tanuló befizetései, a tanuló eseményei vagy a tanulói irányítópult. Ha az elem már nem létezik, a postafiók ezt mutatja: *Ez az elem már nem érhető el.*"
  - "A **push** eszközönként működik: az első irányítópult-látogatáskor egy lap elmagyarázza a rendszerkérdés előtt; a Beállításokban kapcsoló van, amely a felhasználó döntését és a rendszer engedélyét is követi."
  - "A push üzenetek az eszköz nyelvén mennek. Ha valaki 60 másodpercen belül 3-nál több értesítést kap, egyetlen push megy ki."
  - "Az eszköztoken eszközállapot: közvetlenül a Supabase-be kerül a `register_push_token` / `disable_push_token` hívásokkal, és újra regisztrálódik, ha elavult vagy változott a nyelv."
messages:
  - situation: "Üres postafiók"
    title: "Még nincsenek értesítések"
    message: "Az új rendelések, csatlakozási kérések és eseményjelentkezések itt jelennek meg, offline is."
  - situation: "Az elemet törölték"
    message: "Ez az elem már nem érhető el."
  - situation: "A push magyarázata"
    title: "Maradj képben"
    message: "Értesítések ezen az eszközön, akkor is, ha az alkalmazás be van zárva."
  - situation: "A rendszer letiltotta a pusht"
    message: "Az értesítések le vannak tiltva az eszköz beállításaiban."
flows:
  - id: inbox
    title: "Postafiók"
    steps:
      - title: "Riasztások"
        text: "Modulszínű sorok az olvasatlan ponttal és az idővel; *Összes megjelölése olvasottként* és a kuka (*Összes törlése*) a fejlécben; minden sornak saját kuka gombja van."
        screen: NotificationsOrg
        api:
          - { id: sync-pull, x: 50, y: 4 }
      - title: "Tanuló"
        text: "A tanuló postafiókja: új befizetések és események, amelyekhez hozzáadták."
        screen: NotificationsStudent
      - title: "Már nem érhető el"
        text: "Egy törölt dologról szóló értesítés borostyán jelzéssel nyitja meg újra a postafiókot."
        screen: NotificationsUnavailable
      - title: "Üres"
        text: "Az első értesítés előtt."
        screen: NotificationsEmpty
    diagram: |
      sequenceDiagram
        participant DB as Supabase adatbázis
        participant P as Edge Function send-push
        participant E as Expo push
        actor U as Címzett
        participant A as Alkalmazás
        DB->>DB: A trigger notifications sort ír
        DB-)P: pg_net hívás a sorral
        P->>P: A címzett engedélyezett tokenjei, nyelv
        P->>E: Push (vagy egy összefoglaló, ha 60 mp alatt 3-nál több)
        E-->>U: Értesítési sáv
        U->>A: Koppintás
        A->>A: Olvasottnak jelöl, megnyitja a célt
        A-)DB: Az olvasottság szinkronizálása
  - id: push
    title: "Push ezen az eszközön"
    steps:
      - title: "Első alkalom"
        text: "Az első irányítópult-látogatáskor egy lap felsorolja, mit hoz a push ennek a szerepnek; a *Bekapcsolás* megkérdezi a rendszert, a *Most nem* kikapcsolva hagyja."
        screen: NotificationsPushPrompt
        api:
          - { id: register-push-token, x: 50, y: 85 }
      - title: "Beállítások"
        text: "*Push-értesítések* kapcsoló ehhez az eszközhöz."
        screen: NotificationsSettings
        api:
          - { id: disable-push-token, x: 80, y: 13 }
      - title: "Letiltva"
        text: "Ha a rendszer letiltja az értesítéseket, a tipp pirosra vált, és megjelenik az *Eszközbeállítások megnyitása*; a képernyő újra ellenőriz, amikor visszatérsz az alkalmazásba."
        screen: NotificationsSettingsBlocked
      - title: "Kézbesítés"
        text: "Az adatbázis minden új értesítéshez meghívja a `send-push` függvényt."
        screen: NotificationsOrg
        api:
          - { id: send-push, x: 50, y: 20 }
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Riasztások fül (útvonal `/notifications`) | `app/notifications/index.tsx`, `src/modules/notifications/components/NotificationsScreen.tsx`, `NotificationRow.tsx`, `utils/inbox.ts` |
| Az egyes típusok szövegei | `utils/content.ts` |
| Hová vezet a koppintás | `utils/routes.ts`, `utils/target.ts`, `services/notificationNavigation.ts` |
| Push koppintás kezelése | `NotificationResponseHandler.tsx` |
| Push kérdés és beállítás | `PushPermissionPrompt.tsx`, `PushNotificationsSetting.tsx`, `services/pushRegistrationService.ts` |
| Triggerek | `supabase/migrations/20261001000000_notifications.sql` és a későbbi `notify_*` migrációk |
| Küldés | `supabase/functions/send-push/` |

## Típusok

| Típus | Címzett | Megnyitja |
| --- | --- | --- |
| `order_created` | az iskola tulajdonosa | a rendelést |
| `join_request_created` | az iskola tulajdonosa | Tanulók → Kérések |
| `event_rsvp_attending` | a szervezet tulajdonosa | az eseményt |
| `payment_created` | tanuló | Befizetések |
| `event_assigned` | tanuló | a tanuló eseményeit |
| `join_request_approved` | tanuló | a tanulói irányítópultot |

</FeatureView>
