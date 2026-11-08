---
layout: page
feature: payments
title: Płatności
group: school
accent: payments
icon: credit-card
order: 12
summary: "Okresy rozliczeniowe szkoły: instruktor otwiera miesiąc, tydzień, rok lub dowolny zakres, każdy uczeń dostaje w nim płatność, a instruktor zaznacza, kto zapłacił, jak i ile. Uczniowie widzą swoje płatności."
purpose: "Zastępuje papierową listę „kto zapłacił w tym miesiącu”. Płatności zapisuje się ręcznie (gotówka, przelew, inna); aplikacja nie przyjmuje pieniędzy."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Tworzy okresy rozliczeniowe, zaznacza płatności, zmienia kwoty i metody, ustala domyślną kwotę szkoły"
  - role: "Uczeń"
    outcome: "Dostaje powiadomienie *Nowa płatność* i widzi swoje płatności, tylko do odczytu, z kwotą do zapłaty"
rules:
  - "**Okres rozliczeniowy** ma początek i koniec: *Ten miesiąc*, *Ten tydzień* (od poniedziałku do niedzieli), *Ten rok* lub **własny** zakres. Szkoła nie może mieć dwóch okresów o tych samych datach."
  - "Utworzenie okresu dodaje płatność **Oczekującą**, metoda *Gotówka*, każdemu uczniowi aktywnemu lub bez konta. Oczekujący i zarchiwizowani członkowie są pomijani."
  - "Kwota każdej płatności: **własna kwota okresu**, gdy *Użyj domyślnych kwot* jest wyłączone, inaczej **własna kwota ucznia** (ustawiana na karcie ucznia), inaczej **domyślna kwota szkoły** z *Ustawień szkoły*."
  - "Uczeń, który dołączy później, **nie** trafia sam do istniejących okresów; instruktor dodaje go do bieżących okresów przy akceptacji prośby."
  - "Dotknięcie przycisku statusu zmienia go po kolei: **Oczekujący → Opłacone → Anulowane**; dotknięcie imienia otwiera kwotę, walutę i metodę. Nic nie jest zapisywane przed *Zapisz*, który pojawia się po zmianie."
  - "**Data zapłaty** jest ustawiana, gdy płatność staje się *Opłacona*; zmiana kwoty lub metody opłaconej płatności zachowuje datę."
  - "Lista okresów pokazuje najpierw bieżące, potem najnowsze; chip *6/10* jest zielony od 80% opłaconych, bursztynowy od 50%, czerwony poniżej."
  - "Kwoty są sumowane **osobno dla każdej waluty**: okres może łączyć PLN i EUR, sumy nigdy nie są przeliczane."
  - "Uczniowie widzą tylko swoje płatności. *… do zapłaty* sumuje ich oczekujące płatności."
  - "Dotknięcie, które przeniosłoby płatność **z Opłacone**, najpierw pyta *Zmienić status Opłacone?*; *Anuluj* zostawia wiersz bez zmian. To samo pytanie chroni uczestnika wydarzenia ze statusem *Opłacone* (zobacz [Wydarzenia](./events))."
  - "**Menu ⋮** okresu oferuje *Zablokuj płatności* / *Odblokuj płatności*. Zablokowany okres zamraża każdy status i kwotę: przyciski statusu są przyciemnione, wiersze nie otwierają arkusza edycji, lista okresów pokazuje plakietkę *Zablokowany*, karta ucznia pokazuje kłódkę, a akceptacja prośby o dołączenie nie proponuje tego okresu. *Zablokuj* jest wyłączone, gdy są niezapisane zmiany."
  - "*Usuń okres* jest w tym samym menu i działa tylko, gdy okres jest **odblokowany** i **żadna płatność w nim nie jest Opłacona**; najpierw pyta i usuwa okres razem z płatnościami."
messages:
  - situation: "Istnieje okres o tych samych datach"
    message: "Cykl płatności z tym okresem już istnieje"
  - situation: "Własny okres kończy się przed początkiem"
    message: "Data końcowa musi być po dacie początkowej"
  - situation: "Kwota nie jest liczbą (najwyżej 2 miejsca po przecinku)"
    message: "Kwota musi być liczbą"
  - situation: "Brak okresów"
    message: "Brak cykli płatności"
  - situation: "Płatność traci status Opłacone"
    title: "Zmienić status Opłacone?"
    message: "Anna Kowalska ma status Opłacone. Zmienić status na Anulowane?"
  - situation: "Nie można usunąć okresu"
    message: "6 płatności jest opłaconych, więc nie można usunąć tego okresu."
  - situation: "Uczeń: nowa płatność"
    title: "Nowa płatność"
    message: "150 PLN za 1 – 31 paź"
flows:
  - id: new-period
    title: "Nowy okres rozliczeniowy"
    steps:
      - title: "Płatności"
        text: "Pulpit szkoły otwiera Płatności z kafelka; `+` na kafelku prowadzi od razu do nowego okresu."
        screen: School
      - title: "Okresy rozliczeniowe"
        text: "Bieżące okresy na górze z *BIEŻĄCY*, potem najnowsze. Każdy wiersz pokazuje, ile osób zapłaciło; *Dodaj* otwiera nowy okres."
        screen: PaymentsList
      - title: "Okres"
        text: "*Ten miesiąc*, *Ten tydzień* lub *Ten rok*, każdy ze swoimi datami. Niżej karta *Kwota*: *Użyj domyślnych kwot* (własna kwota ucznia lub domyślna kwota szkoły) albo, po wyłączeniu, jedna kwota i waluta dla wszystkich w tym okresie."
        screen: PaymentCreate
      - title: "Własny zakres"
        text: "*Własny* pokazuje POCZĄTEK i KONIEC; koniec przed początkiem jest odrzucany."
        screen: PaymentCreateCustom
      - title: "Utwórz"
        text: "Okres i płatność Oczekująca dla każdego aktywnego ucznia lub ucznia bez konta są zapisywane w jednej transakcji, a potem synchronizowane. Aplikacja otwiera nowy okres."
        screen: PaymentDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Uczniowie dostają powiadomienie"
        text: "Dla każdej płatności ucznia z kontem baza danych zapisuje powiadomienie *Nowa płatność* i wysyła je jako push."
        screen: NotificationsStudent
        api:
          - { id: send-push, x: 85, y: 22 }
    diagram: |
      sequenceDiagram
        actor I as Instruktor
        participant A as Aplikacja
        participant L as Lokalna baza
        participant Sync as Edge Function sync
        participant DB as Baza Supabase
        I->>A: Ten miesiąc, domyślne kwoty, Utwórz
        A->>L: Te same daty już są?
        A->>L: Domyślna kwota szkoły
        A->>L: Aktywni członkowie i członkowie bez konta
        A->>L: Okres + po jednej płatności Oczekującej
        A-->>I: Szczegóły okresu
        A-)Sync: Wypchnij okres i płatności
        Sync->>DB: Zapis (okres o tych samych datach jest pomijany)
        DB->>DB: Powiadomienie Nowa płatność dla każdego ucznia z kontem
  - id: collect
    title: "Zaznaczanie płatności"
    steps:
      - title: "Okres"
        text: "Podsumowanie liczy Opłacone, Oczekujące i Anulowane. Uczniowie są wymienieni po nazwisku z kwotą i, po opłaceniu, metodą."
        screen: PaymentDetails
      - title: "Status"
        text: "Dotknięcie okrągłego przycisku przestawia płatność na następny status: Oczekujący → Opłacone → Anulowane → Oczekujący."
        screen: PaymentDetails
      - title: "Kwota i metoda"
        text: "Dotknięcie imienia otwiera płatność ucznia: kwota, waluta i metoda (*Gotówka*, *Przelew*, *Inna*). *Zapisz* w arkuszu zmienia tylko listę na ekranie."
        screen: PaymentEditSheet
      - title: "Kwoty"
        text: "*Kwoty* rozwija sumy według statusu i waluty: zebrane, oczekujące, anulowane."
        screen: PaymentDetailsAmounts
      - title: "Zapisz"
        text: "*Zapisz* pod listą zapisuje zmienione płatności w jednej paczce, ustawia datę zapłaty tym, które stały się Opłacone, i synchronizuje. Aplikacja zostaje na okresie; przycisk *Zapisz* znika do następnej zmiany."
        screen: PaymentDetailsAmounts
        api:
          - { id: sync-push, x: 84, y: 9 }
    diagram: |
      flowchart TD
        list[Szczegóły okresu] --> tap{Dotknięcie}
        tap -- przycisk statusu --> next[Następny status<br/>tylko na ekranie]
        tap -- imię --> sheet[Kwota, waluta, metoda<br/>tylko na ekranie]
        next --> changed[Pojawia się Zapisz]
        sheet --> changed
        changed --> save[Zapisz: zmienione płatności<br/>w jednej paczce]
        save --> date[Data zapłaty<br/>dla nowo opłaconych]
        date --> sync[Synchronizacja]
  - id: close
    title: "Blokowanie i usuwanie okresu"
    steps:
      - title: "Status Opłacone"
        text: "Dotknięcie statusu *Opłacone* najpierw pyta; *Zmień* ustawia kolejny status na ekranie, *Anuluj* zostawia Opłacone."
        screen: PaymentPaidConfirm
      - title: "Menu okresu"
        text: "Przycisk ⋮ otwiera *Zablokuj płatności* i *Usuń okres*. *Usuń okres* jest przyciemnione z powodem, gdy płatność jest opłacona albo okres zablokowany."
        screen: PaymentPeriodActions
      - title: "Zablokowany okres"
        text: "Bursztynowa informacja tłumaczy blokadę, przyciski statusu są przyciemnione, a wiersze nie otwierają arkusza edycji. *Odblokuj płatności* w menu to cofa."
        screen: PaymentDetailsLocked
  - id: amounts
    title: "Domyślne kwoty"
    steps:
      - title: "Domyślna kwota szkoły"
        text: "*Ustawienia szkoły* przechowują domyślną kwotę i walutę. Nowe okresy z nich korzystają; istniejące okresy zachowują swoje kwoty."
        screen: SchoolSettings
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Własna kwota ucznia"
        text: "Na karcie ucznia instruktor może ustawić jego własną kwotę (np. połowę dla dziecka). Nowe okresy używają jej zamiast domyślnej kwoty szkoły."
        screen: StudentDetails
  - id: student
    title: "Płatności ucznia"
    steps:
      - title: "Powiadomienie"
        text: "*Nowa płatność* z kwotą i okresem; dotknięcie otwiera płatności ucznia."
        screen: NotificationsStudent
      - title: "Moje płatności"
        text: "Z pulpitu ucznia: podsumowanie jego okresów z kwotą do zapłaty, potem każdy okres z kwotą i statusem. Tylko do odczytu; na urządzenie ucznia trafiają wyłącznie jego płatności."
        screen: StudentPayments
        api:
          - { id: sync-pull, x: 84, y: 9 }
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Okresy rozliczeniowe (trasa `/school/{schoolId}/payments`) | `app/school/[schoolId]/payments/index.tsx`, `src/modules/payments/components/PaymentPeriodsScreen.tsx`, `hooks/usePaymentPeriodList.ts` |
| Nowy okres (trasa `…/payments/create`) | `PaymentPeriodFormScreen.tsx`, `createPaymentCycle` w `services/paymentService.ts` |
| Szczegóły okresu (trasa `…/payments/{cycleId}`) | `PaymentPeriodScreen.tsx`, `PaymentEditSheet.tsx`, `hooks/usePaymentRecords.ts`, `bulkSavePaymentList` |
| Płatności ucznia (trasa `/user/payments`) | `app/user/payments.tsx`, `StudentPaymentsScreen.tsx`, `PaymentRow.tsx`, `hooks/useStudentPayments.ts` |
| Menu okresu, plakietka blokady | `PeriodActionsSheet.tsx`, `LockedBadge.tsx`, `lockPaymentCycle` / `unlockPaymentCycle` / `deletePaymentCycle` w `services/paymentService.ts` |
| Okresy, kwoty, statusy (czysta logika) | `src/modules/payments/paymentPeriod.ts` |
| Walidacja | `src/modules/payments/validation/paymentSchema.ts` |
| Domyślna kwota szkoły | `src/modules/school/components/SchoolSettingsScreen.tsx` |
| Powiadomienie | `notify_payment_created` w `supabase/migrations/20261001000000_notifications.sql` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `payment_cycles` | `school_id`, `period_start`, `period_end`, `notes`, `locked_at` |
| `payment_records` | `payment_cycle_id`, `school_member_id`, `amount`, `currency`, `status` (`pending` / `paid` / `cancelled`), `method` (`cash` / `transfer` / `other`), `payment_date` |

Okres nie ma własnej kwoty: kwota wybrana przy tworzeniu jest zapisywana w każdej płatności.

## Synchronizacja

- Właściciel organizacji wypycha i pobiera wszystkie okresy i płatności swoich szkół.
- Uczeń pobiera okresy swojej szkoły i **tylko swoje** płatności.
- Serwer pomija wypchnięty okres, którego szkoła i daty zgadzają się z istniejącym, razem z jego płatnościami. Gdy dwa urządzenia offline utworzą ten sam miesiąc, drugi zostaje tylko lokalnie.

## Uwagi

- Szczegóły okresu pokazują tylko uczniów, którzy mają w nim płatność; uczeń dodany później pojawia się, gdy instruktor doda go przy akceptacji prośby.
- Ekrany płatności szkoły nie mają strażnika właściciela, który mają Uczniowie (`useRequireOrganizationOwner`); jedynym wejściem jest pulpit szkoły.
- Blokada jest egzekwowana **tylko w aplikacji** (migracja `20261105000000_payment_cycles_locked_at`): urządzenie offline ze starą wersją nadal może zmienić płatności zablokowanego okresu.

</FeatureView>
