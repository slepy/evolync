---
layout: page
feature: payments
title: Befizetések
group: school
accent: payments
icon: credit-card
order: 12
summary: "Az iskola számlázási időszakai: az oktató megnyit egy hónapot, hetet, évet vagy bármilyen időszakot, minden tanuló kap benne egy befizetést, az oktató pedig jelöli, ki fizetett, hogyan és mennyit. A tanulók a saját befizetéseiket látják."
purpose: "A papíros „ki fizetett ebben a hónapban” listát váltja ki. A befizetéseket kézzel rögzítik (készpénz, átutalás, egyéb); az alkalmazás nem fogad pénzt."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Számlázási időszakokat hoz létre, jelöli a befizetéseket, módosítja az összegeket és módokat, beállítja az iskola alapértelmezett összegét"
  - role: "Tanuló"
    outcome: "*Új befizetés* értesítést kap, és csak olvasásra látja a saját befizetéseit a még fizetendő összeggel"
rules:
  - "A **számlázási időszaknak** kezdete és vége van: *Ez a hónap*, *Ez a hét* (hétfőtől vasárnapig), *Ez az év* vagy **egyéni** időszak. Egy iskolának nem lehet két azonos dátumú időszaka."
  - "Az időszak létrehozása **Függőben** lévő, *Készpénz* módú befizetést ad minden aktív vagy fiók nélküli tanulónak. A függőben lévő és archivált tagok kimaradnak."
  - "Minden befizetés összege: az időszak **saját összege**, ha az *Alapértelmezett összegek használata* ki van kapcsolva, különben a tanuló **saját összege** (a tanuló adatlapján állítható), különben az **iskolai alapérték** az *Iskola beállításai* közül."
  - "A később csatlakozó tanuló **nem** kerül be magától a meglévő időszakokba; az oktató a kérés jóváhagyásakor adja hozzá az aktuális időszakokhoz."
  - "Az állapotgombra koppintás sorban vált: **Függőben → Fizetve → Lemondva**; a névre koppintás megnyitja az összeget, a pénznemet és a módot. Semmi sem mentődik a *Mentés* előtt, amely módosítás után jelenik meg."
  - "A **fizetés dátuma** akkor kerül beállításra, amikor a befizetés *Fizetve* lesz; egy kifizetett befizetés összegének vagy módjának módosítása megtartja a dátumot."
  - "Az időszakok listáján elöl az aktuálisak, utána a legújabbak; a *6/10* chip 80% befizetéstől zöld, 50%-tól borostyán, alatta piros."
  - "Az összegek **pénznemenként** adódnak össze: egy időszakban lehet PLN és EUR is, az összegeket soha nem váltja át."
  - "A tanulók csak a saját befizetéseiket látják. A *… fizetendő* a függőben lévő befizetéseik összege."
messages:
  - situation: "Már van időszak ugyanezekkel a dátumokkal"
    message: "Ilyen időszakra már létezik fizetési ciklus"
  - situation: "Az egyéni időszak a kezdete előtt ér véget"
    message: "A záró dátumnak a kezdő dátum után kell lennie"
  - situation: "Az összeg nem szám (legfeljebb 2 tizedesjegy)"
    message: "Az összegnek számnak kell lennie"
  - situation: "Még nincs időszak"
    message: "Még nincsenek fizetési ciklusok"
  - situation: "Tanuló: új befizetés"
    title: "Új befizetés"
    message: "150 PLN, időszak: okt. 1 – 31"
flows:
  - id: new-period
    title: "Új számlázási időszak"
    steps:
      - title: "Befizetések"
        text: "Az iskola irányítópultja a csempéről nyitja meg a Befizetéseket; a csempe `+` gombja egyből új időszakhoz visz."
        screen: School
      - title: "Számlázási időszakok"
        text: "Fent az aktuális időszakok *AKTUÁLIS* jelöléssel, utána a legújabbak. Minden sor mutatja, hányan fizettek; az *Új hozzáadása* új időszakot nyit."
        screen: PaymentsList
      - title: "Időszak"
        text: "*Ez a hónap*, *Ez a hét* vagy *Ez az év*, mindegyik a saját dátumaival. Alatta az *Összeg* kártya: *Alapértelmezett összegek használata* (a tanuló saját összege vagy az iskolai alapérték), vagy kikapcsolva egy összeg és pénznem mindenkinek ebben az időszakban."
        screen: PaymentCreate
      - title: "Egyéni időszak"
        text: "Az *Egyéni* megmutatja a KEZDET és a VÉGE mezőt; a kezdet előtti vég nem fogadható el."
        screen: PaymentCreateCustom
      - title: "Létrehozás"
        text: "Az időszak és minden aktív vagy fiók nélküli tanuló Függőben lévő befizetése egy tranzakcióban íródik, majd szinkronizálódik. Az alkalmazás megnyitja az új időszakot."
        screen: PaymentDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "A tanulók értesítést kapnak"
        text: "Minden fiókkal rendelkező tanuló befizetéséhez az adatbázis *Új befizetés* értesítést ír, és push üzenetként elküldi."
        screen: NotificationsStudent
        api:
          - { id: send-push, x: 85, y: 22 }
    diagram: |
      sequenceDiagram
        actor I as Oktató
        participant A as Alkalmazás
        participant L as Helyi adatbázis
        participant Sync as Edge Function sync
        participant DB as Supabase adatbázis
        I->>A: Ez a hónap, alapértelmezett összegek, Létrehozás
        A->>L: Van már ilyen dátum?
        A->>L: Az iskola alapértelmezett összege
        A->>L: Aktív és fiók nélküli tagok
        A->>L: Időszak + egy-egy Függőben lévő befizetés
        A-->>I: Az időszak részletei
        A-)Sync: Az időszak és a befizetések feltöltése
        Sync->>DB: Beszúrás (azonos dátumú időszak kimarad)
        DB->>DB: Új befizetés értesítés minden fiókkal rendelkező tanulónak
  - id: collect
    title: "Befizetések jelölése"
    steps:
      - title: "Időszak"
        text: "Az összesítő számolja a Fizetve, Függőben és Lemondva állapotokat. A tanulók név szerint szerepelnek az összeggel és, kifizetés után, a móddal."
        screen: PaymentDetails
      - title: "Állapot"
        text: "A kerek gombra koppintás a következő állapotra lépteti a befizetést: Függőben → Fizetve → Lemondva → Függőben."
        screen: PaymentDetails
      - title: "Összeg és mód"
        text: "A névre koppintás megnyitja a tanuló befizetését: összeg, pénznem és mód (*Készpénz*, *Átutalás*, *Egyéb*). A lapon lévő *Mentés* csak a képernyőn lévő listát módosítja."
        screen: PaymentEditSheet
      - title: "Összegek"
        text: "Az *Összegek* kibontja az állapotonkénti és pénznemenkénti összegeket: beszedve, függőben, lemondva."
        screen: PaymentDetailsAmounts
      - title: "Mentés"
        text: "A lista alatti *Mentés* egy kötegben írja a módosított befizetéseket, beállítja a fizetés dátumát a Fizetve állapotba kerülteknél, és szinkronizál. Az alkalmazás visszalép az időszakokhoz."
        screen: PaymentDetailsAmounts
        api:
          - { id: sync-push, x: 84, y: 9 }
    diagram: |
      flowchart TD
        list[Az időszak részletei] --> tap{Koppintás}
        tap -- állapotgomb --> next[Következő állapot<br/>csak a képernyőn]
        tap -- név --> sheet[Összeg, pénznem, mód<br/>csak a képernyőn]
        next --> changed[Megjelenik a Mentés]
        sheet --> changed
        changed --> save[Mentés: módosított befizetések<br/>egy kötegben]
        save --> date[Fizetés dátuma<br/>az újonnan kifizetetteknél]
        date --> sync[Szinkronizálás]
  - id: amounts
    title: "Alapértelmezett összegek"
    steps:
      - title: "Iskolai alapérték"
        text: "Az *Iskola beállításai* tárolják az alapértelmezett összeget és pénznemet. Az új időszakok ezeket használják; a meglévők megtartják az összegeiket."
        screen: SchoolSettings
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "A tanuló saját összege"
        text: "A tanuló adatlapján az oktató saját összeget állíthat be (pl. gyereknek a felét). Az új időszakok ezt használják az iskolai alapérték helyett."
        screen: StudentDetails
  - id: student
    title: "A tanuló befizetései"
    steps:
      - title: "Értesítés"
        text: "*Új befizetés* az összeggel és az időszakkal; koppintásra megnyílnak a tanuló befizetései."
        screen: NotificationsStudent
      - title: "Befizetéseim"
        text: "A tanulói irányítópultról: a tanuló időszakainak összesítése a még fizetendő összeggel, utána minden időszak az összegével és állapotával. Csak olvasható; a tanuló eszközére csak a saját befizetései kerülnek."
        screen: StudentPayments
        api:
          - { id: sync-pull, x: 84, y: 9 }
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Számlázási időszakok (útvonal `/school/{schoolId}/payments`) | `app/school/[schoolId]/payments/index.tsx`, `src/modules/payments/components/PaymentPeriodsScreen.tsx`, `hooks/usePaymentPeriodList.ts` |
| Új időszak (útvonal `…/payments/create`) | `PaymentPeriodFormScreen.tsx`, `createPaymentCycle` a `services/paymentService.ts` fájlban |
| Az időszak részletei (útvonal `…/payments/{cycleId}`) | `PaymentPeriodScreen.tsx`, `PaymentEditSheet.tsx`, `hooks/usePaymentRecords.ts`, `bulkSavePaymentList` |
| A tanuló befizetései (útvonal `/user/payments`) | `app/user/payments.tsx`, `StudentPaymentsScreen.tsx`, `PaymentRow.tsx`, `hooks/useStudentPayments.ts` |
| Időszakok, összegek, állapotok (tiszta logika) | `src/modules/payments/paymentPeriod.ts` |
| Validáció | `src/modules/payments/validation/paymentSchema.ts` |
| Az iskola alapértelmezett összege | `src/modules/school/components/SchoolSettingsScreen.tsx` |
| Értesítés | `notify_payment_created` a `supabase/migrations/20261001000000_notifications.sql` fájlban |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `payment_cycles` | `school_id`, `period_start`, `period_end`, `notes` |
| `payment_records` | `payment_cycle_id`, `school_member_id`, `amount`, `currency`, `status` (`pending` / `paid` / `cancelled`), `method` (`cash` / `transfer` / `other`), `payment_date` |

Az időszaknak nincs saját összege: a létrehozáskor választott összeg minden befizetésbe beíródik.

## Szinkronizálás

- A szervezet tulajdonosa az iskolái összes időszakát és befizetését feltölti és letölti.
- A tanuló az iskolája időszakait és **csak a saját** befizetéseit tölti le.
- A szerver kihagyja azt a feltöltött időszakot, amelynek iskolája és dátumai egy meglévővel egyeznek, a befizetéseivel együtt. Ha két eszköz offline ugyanazt a hónapot hozza létre, a második csak helyben marad meg.

## Megjegyzések

- Az időszak részletei csak azokat a tanulókat mutatják, akiknek van benne befizetésük; a később felvett tanuló akkor jelenik meg, ha az oktató a kérés jóváhagyásakor hozzáadja.
- Az iskola befizetési képernyőin nincs meg a Tanulók tulajdonosi védelme (`useRequireOrganizationOwner`); az egyetlen bejárat az iskola irányítópultja.

</FeatureView>
