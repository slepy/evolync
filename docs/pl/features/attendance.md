---
layout: page
feature: attendance
title: Obecności
group: school
accent: attendance
icon: calendar-check
order: 13
summary: "Jedne zajęcia na dzień treningowy: instruktor otwiera dzisiejsze zajęcia, wszyscy startują jako obecni, a on zaznacza nieobecnych i usprawiedliwionych. Uczniowie widzą swoje obecności."
purpose: "Szybka lista obecności na początku zajęć, także offline, oraz historia tego, kto jak często trenuje."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Sprawdza obecność na dziś, poprawia wcześniejsze zajęcia, usuwa zajęcia"
  - role: "Uczeń"
    outcome: "Widzi swoje zajęcia i odsetek obecności, tylko do odczytu"
rules:
  - "Szkoła ma **jedne zajęcia dziennie**. *Dodaj* zawsze otwiera ekran *Nowe zajęcia*; gdy wybrany dzień ma już zajęcia, przycisk brzmi *Otwórz* i pokazuje je."
  - "Wybór **Dnia** to *Dziś* lub *Wcześniejsza data*. Wcześniejszą datę wybiera się polem daty, które kończy się na dziś; zajęcia zapisują się o północy czasu lokalnego, a dni przyszłych nie można wybrać."
  - "Nowe zajęcia wymieniają każdego ucznia aktywnego lub bez konta; **wszyscy startują jako Obecni**."
  - "Dotknięcie przycisku statusu zmienia go po kolei: **Obecny → Nieobecny → Usprawiedliwiony**. Nic nie jest zapisywane przed *Utwórz* lub *Zapisz*."
  - "Zajęcia zachowują uczniów, z którymi je utworzono. Uczeń dodany później nie pojawia się w starszych zajęciach; **zarchiwizowany** uczeń zachowuje swój status, wyszarzony, bez możliwości zmiany."
  - "Zajęcia są pogrupowane po miesiącach, od najnowszych; każde pokazuje *Obecni: 7 z 10* i chip z odsetkiem (zielony od 80%, bursztynowy od 50%, czerwony poniżej)."
  - "Usunięcie zajęć usuwa też ich obecności, po potwierdzeniu."
  - "Godzina zajęć to chwila ich utworzenia; uczeń widzi ją obok nazwy szkoły."
messages:
  - situation: "Usunięcie zajęć"
    title: "Usuń zajęcia"
    message: "Czy na pewno chcesz usunąć te zajęcia razem z obecnościami? Tej operacji nie można cofnąć."
  - situation: "Brak zajęć"
    message: "Brak sesji treningowych"
  - situation: "Usunięcie się nie udało"
    message: "Nie udało się usunąć"
flows:
  - id: take
    title: "Dzisiejsza obecność"
    steps:
      - title: "Obecności"
        text: "Pulpit szkoły otwiera Obecności z kafelka."
        screen: School
      - title: "Zajęcia"
        text: "Zajęcia po miesiącach z liczbą obecnych. *Dodaj* otwiera ekran nowych zajęć, także gdy dziś już są zajęcia, więc można dodać wcześniejszy dzień."
        screen: AttendanceList
      - title: "Dziś"
        text: "Każdy uczeń startuje jako Obecny. Dotknięcia zmieniają wyjątki; podsumowanie liczy na bieżąco."
        screen: AttendanceCreate
      - title: "Wcześniejsza data"
        text: "*Wcześniejsza data* pokazuje pole DATA, które kończy się na dziś. Gdy ten dzień ma już zajęcia, przycisk brzmi *Otwórz* i otwiera istniejące zajęcia zamiast duplikatu."
        screen: AttendanceCreatePastDate
      - title: "Utwórz"
        text: "Zajęcia i obecność każdego ucznia z listy są zapisywane w jednej transakcji i synchronizowane; aplikacja wraca do listy zajęć."
        screen: AttendanceCreate
        api:
          - { id: sync-push, x: 84, y: 9 }
    diagram: |
      sequenceDiagram
        actor I as Instruktor
        participant A as Aplikacja
        participant L as Lokalna baza
        participant Sync as Edge Function sync
        I->>A: Dodaj
        A->>L: Dzisiejsze zajęcia już są?
        alt istnieją
          A-->>I: Otwórz dzisiejsze zajęcia
        else brak
          A->>L: Aktywni członkowie i członkowie bez konta
          A-->>I: Wszyscy Obecni
          I->>A: Zaznacz nieobecnych, Utwórz
          A->>L: Zajęcia + po jednym wpisie na ucznia
          A-)Sync: Wypchnij
        end
  - id: correct
    title: "Poprawianie zajęć"
    steps:
      - title: "Zajęcia"
        text: "Wcześniejsze zajęcia pokazują uczniów z ich statusami; *Zapisz* pojawia się po zmianie i zapisuje zmienioną listę w jednej paczce; po *Zapisz* lub *Usuń* aplikacja wraca do listy zajęć. Nieudany *Zapisz* zachowuje zmienione statusy."
        screen: AttendanceDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Usuń"
        text: "Kosz usuwa zajęcia i ich obecności po potwierdzeniu (miękkie usunięcie, synchronizowane)."
        screen: AttendanceDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: student
    title: "Obecności ucznia"
    steps:
      - title: "Karta ucznia"
        text: "Instruktor widzi obecności jednego ucznia na jego karcie i może je tam też zmieniać."
        screen: StudentDetailsAttendance
      - title: "Moje obecności"
        text: "Z pulpitu ucznia: liczba zajęć i odsetek obecności, potem zajęcia po miesiącach ze szkołą, godziną i statusem. Na urządzenie ucznia trafiają wyłącznie jego obecności."
        screen: StudentAttendance
        api:
          - { id: sync-pull, x: 84, y: 9 }
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Zajęcia (trasa `/school/{schoolId}/attendance`) | `app/school/[schoolId]/attendance/index.tsx`, `src/modules/attendance/components/AttendanceSessionsScreen.tsx`, `hooks/useAttendanceSessionList.ts` |
| Dzisiejsze zajęcia (trasa `…/attendance/create`) | `AttendanceCreateScreen.tsx`, `createSessionWithAttendance` w `services/attendanceService.ts` |
| Szczegóły zajęć (trasa `…/attendance/{sessionId}`) | `AttendanceSessionScreen.tsx`, `AttendanceSessionBody.tsx`, `hooks/useAttendance.ts`, `bulkSaveAttendanceList`, `deleteTrainingSession` |
| Obecności ucznia (trasa `/user/attendance`) | `app/user/attendance.tsx`, `StudentAttendanceScreen.tsx`, `hooks/useStudentAttendance.ts` |
| Grupowanie, liczniki, daty (czysta logika) | `src/modules/attendance/sessionList.ts` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `training_sessions` | `school_id`, `session_date`, `notes` |
| `attendance_records` | `training_session_id`, `school_member_id`, `status` (`present` / `absent` / `excused`) |

Zajęcia z listy obecności to nie [zaplanowany trening](./trainings): treningi to plan, zajęcia to to, co się odbyło.

## Synchronizacja

- Właściciel organizacji wypycha i pobiera wszystkie zajęcia i obecności swoich szkół.
- Uczeń pobiera zajęcia swojej szkoły i **tylko swoje** obecności.
- Migracja `20261029000000_resync_payments_attendance` jednorazowo dotyka wszystkich żywych zajęć i wpisów, żeby uczniowie, którzy je przegapili, pobrali je ponownie.

## Uwagi

- *Jedne zajęcia dziennie* sprawdza urządzenie, a dla żywych zajęć także unikalny indeks na serwerze (`school_id`, `date`). Gdy dwa urządzenia offline sprawdzą obecność tego samego dnia, serwer odrzuca drugie zajęcia; one i ich obecności zostają tylko na tamtym urządzeniu.
- Obecności nie wysyłają powiadomień.

</FeatureView>
