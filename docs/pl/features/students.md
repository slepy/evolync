---
layout: page
feature: students
title: Uczniowie
group: school
accent: students
icon: users
order: 11
summary: "Lista uczniów szkoły w rękach instruktora: kody zaproszeń, prośby o dołączenie, uczniowie dodani bez konta i karta każdego ucznia ze stopniem, kwotą, płatnościami, obecnościami, zamówieniami i wydarzeniami."
purpose: "Jedno miejsce, w którym instruktor prowadzi ludzi szkoły: wpuszcza uczniów kodem, dodaje tych, którzy nigdy nie zainstalują aplikacji, i widzi oraz zmienia wszystko o jednym uczniu."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Tylko właściciel otwiera Uczniów; pozostali są cofani"
  - role: "Uczeń"
    outcome: "Pojawia się na liście po akceptacji albo zostaje dodany przez instruktora bez konta"
rules:
  - "Na liście najpierw są członkowie z kontem, potem oczekujący, potem uczniowie bez konta, w każdej grupie alfabetycznie. Uczniowie **zarchiwizowani** są ukryci. Wyszukiwanie sprawdza imię i e-mail, bez względu na wielkość liter i polskie znaki."
  - "Szkoła ma **jeden aktywny kod zaproszenia**. Nowy kod od razu zastępuje stary. Kod ma 6 liter i cyfr i jest ważny 1, 7 albo 30 dni."
  - "Zakładka *Prośby* pokazuje oczekujące prośby z licznikiem; powiadomienie o nowej prośbie otwiera właśnie tę zakładkę."
  - "Przy akceptacji instruktor może połączyć prośbę z uczniem **dodanym wcześniej bez konta**, żeby historia (płatności, obecności) została przy jednej osobie, i od razu dodać ucznia do bieżących okresów płatności i nadchodzących wydarzeń."
  - "Uczeń **bez konta** jest gotowy od razu, także offline, ma oznaczenie *Bez konta* i można mu zaznaczać obecności i płatności."
  - "Edytować można tylko uczniów bez konta; osoby z kontem same zarządzają imieniem, e-mailem i telefonem."
  - "**Archiwizacja** ukrywa ucznia na listach i zachowuje całą historię."
  - "Uczeń może mieć **własną kwotę płatności** (np. połowę dla dziecka) dla nowych okresów płatności; istniejące płatności zachowują swoje kwoty."
  - "Stopień oraz statusy płatności, obecności i wydarzeń zmienia się dotknięciem, a zapisuje przyciskiem *Zapisz*."
messages:
  - situation: "Skopiowany kod"
    title: "Skopiowano"
    message: "Kod K7M42Q skopiowany do schowka"
  - situation: "Nie udało się utworzyć kodu"
    message: "Nie udało się wygenerować kodu zaproszenia. Spróbuj ponownie."
  - situation: "Odrzucenie prośby"
    title: "Odrzuć prośbę"
    message: "Uczeń zobaczy prośbę jako odrzuconą i będzie mógł wysłać nową z kodem."
  - situation: "Akceptacja jako istniejący uczeń bez wyboru ucznia"
    message: "Proszę wybrać istniejącego ucznia."
  - situation: "Brak ucznia bez konta do połączenia"
    message: "Brak uczniów offline w tej szkole."
  - situation: "Archiwizacja ucznia"
    title: "Archiwizuj ucznia"
    message: "Uczeń zostanie zarchiwizowany i usunięty z aktywnej listy uczniów. Historia zostanie zachowana."
flows:
  - id: invite
    title: "Kod zaproszenia"
    steps:
      - title: "Uczniowie"
        text: "Dashboard szkoły otwiera Uczniów z kafelka."
        screen: School
      - title: "Aktywny kod"
        text: "Karta na górze pokazuje aktywny kod szkoły i datę ważności. *Kopiuj* wkłada go do schowka, żeby wysłać uczniom."
        screen: StudentsList
      - title: "Nowy kod"
        text: "Kwadratowy przycisk obok *Dodaj* otwiera nowy kod."
        screen: StudentsList
      - title: "Ważny 1, 7 albo 30 dni"
        text: "Kod jest losowany na urządzeniu (6 znaków, A–Z i 0–9) i sprawdzany z kodami w lokalnej bazie. Poprzedni kod szkoły zostaje unieważniony, nowy zapisuje się lokalnie i idzie synchronizacją."
        screen: StudentInviteCreate
        api:
          - { id: sync-push, x: 82, y: 77 }
      - title: "Uczeń go używa"
        text: "Uczeń wpisuje kod w [Dołączeniu do szkoły](./join-school); kod utworzony na innym urządzeniu jest szukany w Supabase."
        screen: JoinSchoolFilled
        api:
          - { id: school-invites-by-code, x: 80, y: 93 }
    diagram: |
      sequenceDiagram
        actor I as Instruktor
        participant A as Aplikacja
        participant L as Lokalna baza
        participant Sync as Edge Function sync
        actor S as Uczeń
        I->>A: Nowy kod zaproszenia, ważny 7 dni
        A->>A: Losowanie kodu z 6 znaków
        A->>L: Kod już użyty?
        A->>L: Unieważnienie aktywnego kodu szkoły
        A->>L: Zapis nowego kodu
        A-)Sync: Wysłanie kodu
        I-->>S: Wysyła kod
        S->>A: Dołącz do szkoły z kodem
  - id: requests
    title: "Prośby o dołączenie"
    steps:
      - title: "Prośby"
        text: "Zakładka *Prośby* pokazuje oczekujące prośby z czasem ich wysłania; plakietka podaje ich liczbę."
        screen: StudentsRequests
      - title: "Zatwierdź"
        text: "Zatwierdzenie otwiera arkusz: **nowy uczeń** albo **istniejący uczeń** (dodany bez konta), okresy płatności trwające dziś i nadchodzące wydarzenia. Nowy członek dostaje rolę Student; istniejący zostaje aktywowany kontem ucznia. Płatności dostają kwotę ucznia albo domyślną kwotę szkoły; w wydarzeniach uczeń startuje jako nieobecny. Prośba jest usuwana, wszystko idzie synchronizacją, a uczeń dostaje *Prośba zaakceptowana*."
        screen: StudentsRequests
        api:
          - { id: sync-push, x: 85, y: 47 }
      - title: "Odrzuć"
        text: "Po potwierdzeniu prośba zostaje oznaczona jako *Odrzucono*; uczeń widzi to na swoim dashboardzie i może wysłać kodem nową prośbę, która zastępuje odrzuconą."
        screen: StudentsRequests
        api:
          - { id: sync-push, x: 70, y: 47 }
    diagram: |
      flowchart TD
        req[Prośba o dołączenie] --> act{Instruktor}
        act -- Zatwierdź --> type{Nowy czy istniejący uczeń?}
        type -- nowy --> create[Aktywny członek<br/>z rolą Student]
        type -- istniejący --> link[Uczeń bez konta<br/>dostaje konto i staje się aktywny]
        create --> extra[Wybrane okresy płatności<br/>i nadchodzące wydarzenia]
        link --> extra
        extra --> done[Prośba usunięta]
        act -- Odrzuć --> rej[Prośba oznaczona Odrzucono]
        done --> sync[Synchronizacja]
        rej --> sync
  - id: offline
    title: "Uczeń bez konta"
    steps:
      - title: "Dodaj"
        text: "*Dodaj* na liście otwiera formularz."
        screen: StudentsList
      - title: "Nowy uczeń"
        text: "Wymagane jest imię i nazwisko (2–100 znaków); e-mail i telefon są opcjonalne. Notka wyjaśnia, że uczeń od razu pojawi się jako *Bez konta*."
        screen: StudentCreate
        api:
          - { id: sync-push, x: 82, y: 83 }
      - title: "Na liście"
        text: "Uczeń jest na liście z oznaczeniem *Bez konta* i można mu zaznaczać obecności i płatności. Gdy później dołączy kodem, instruktor łączy go przy akceptacji."
        screen: StudentsList
    diagram: |
      sequenceDiagram
        actor I as Instruktor
        participant A as Aplikacja
        participant L as Lokalna baza
        participant Sync as Edge Function sync
        I->>A: Imię, e-mail, telefon, Utwórz
        A->>L: Rola Student organizacji
        A->>L: Członek ze statusem offline (Bez konta)
        A-->>I: Powrót do listy
        A-)Sync: Wysłanie członka
  - id: card
    title: "Karta ucznia"
    steps:
      - title: "Uczeń"
        text: "Kontakt, stopień, kwota płatności ucznia i cztery zakładki: płatności, obecności, zamówienia i wydarzenia. Dotknięcie statusu przełącza go na następny; *Zapisz* pojawia się, gdy coś się zmieniło."
        screen: StudentDetails
        api:
          - { id: sync-push, x: 86, y: 82 }
      - title: "Stopień"
        text: "Arkusz stopnia pokazuje stopnie organizacji w kolorach pasów; wybór zapisuje się przyciskiem *Zapisz*."
        screen: StudentRankSheet
      - title: "Edycja albo archiwizacja"
        text: "Menu ⋯: *Edytuj* (tylko uczniowie bez konta) i *Archiwizuj*, które ukrywa ucznia i zachowuje historię."
        screen: StudentActionsSheet
        api:
          - { id: sync-push, x: 50, y: 92 }
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Uczniowie i prośby (route `/school/{schoolId}/students`, `?tab=requests`) | `app/school/[schoolId]/students/index.tsx`, `src/modules/students/components/StudentsScreen.tsx` |
| Dane ekranu | `src/modules/students/hooks/useStudentsOverview.ts` |
| Kolejność listy, oznaczenie statusu, wiek prośby | `src/modules/students/studentList.ts` |
| Nowy kod zaproszenia (route `…/students/generate-invite`) | `InviteCreateScreen.tsx`, `InviteCodeCard.tsx`, `src/modules/school/services/inviteService.ts` |
| Zatwierdzenie / odrzucenie | `ApproveJoinRequestSheet.tsx`, `approveJoinRequest`, `rejectJoinRequest` w `services/studentService.ts` |
| Nowy / edycja ucznia (routes `…/students/create`, `…/{studentId}/edit`) | `StudentFormScreen.tsx`, `validation/studentSchema.ts`, `createStudent`, `updateStudent` |
| Karta ucznia (route `…/students/{studentId}`) | `StudentDetailsScreen.tsx`, `StudentRankSheet.tsx`, `StudentPaymentAmountSheet.tsx`, `StudentActionsSheet.tsx` |
| Członkowie (lokalna baza) | `src/modules/students/repositories/studentRepository.ts` |

Wszystko zapisuje się najpierw w lokalnej bazie i synchronizuje w tle; tylko wyszukiwanie kodu w [Dołączeniu do szkoły](./join-school) czyta Supabase bezpośrednio.

## Statusy członka

| Status | Znaczenie | Na liście |
| --- | --- | --- |
| `active` | Członek z kontem w aplikacji | bez oznaczenia |
| `offline` | Dodany przez instruktora, bez konta | *Bez konta* |
| `pending` | Oczekuje | *Oczekujący* |
| `rejected` | Odrzucony | *Odrzucony* |
| `archived` | Zarchiwizowany, historia zachowana | ukryty |

## Uwagi

- Błędy pól formularza ucznia to klucze tłumaczeń (`nameTooShort`, `nameTooLong`, `invalidEmail`, `emailTooLong`), tłumaczone przy wyświetlaniu, z limitem długości jako `{{count}}`.
- **Unikalność kodu sprawdzana jest tylko na urządzeniu.** Dwa urządzenia mogą wylosować ten sam kod; przy 36⁶ możliwościach to mało prawdopodobne. Jeśli po 5 próbach nie ma wolnego kodu, ekran pokazuje *Nie udało się wygenerować kodu zaproszenia*.
- Rola Student jest czytana z lokalnej bazy; urządzenie, które jeszcze nie zsynchronizowało ról organizacji, tworzy członka bez roli.

</FeatureView>
