---
layout: page
feature: events
title: Wydarzenia
group: organization
accent: events
icon: calendar
order: 21
summary: "Obozy, seminaria, egzaminy i turnieje organizacji: instruktor tworzy wydarzenie dla całej organizacji, jednej szkoły lub wybranych uczniów, śledzi, kto przyjdzie i kto zapłacił, oznacza zdających egzamin i zamawia dla nich opłaty i pasy. Uczniowie odpowiadają Biorę udział lub Nieobecny."
purpose: "Jedna lista uczestników na wydarzenie zamiast wątków na czacie: kto przyjdzie, kto zapłacił, kto zdaje egzamin."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Tworzy, edytuje, anuluje i usuwa wydarzenia, zarządza uczestnikami, zdającymi i ich zamówieniami, prowadzi listę typów wydarzeń"
  - role: "Uczeń"
    outcome: "Dostaje powiadomienie o dodaniu, odpowiada Biorę udział lub Nieobecny, dopóki wydarzenie trwa i nie jest oznaczony jako Opłacone"
rules:
  - "Wydarzenie ma nazwę, **typ** (Obóz, Seminarium, Egzamin… prowadzone przez organizację), opcjonalną krótką notatkę i miejsce, dzień początku i końca, cenę i walutę oraz *Planowane egzaminy*."
  - "**Dla kogo?** Cała organizacja, jedna szkoła albo wybrani członkowie. Pasujący uczniowie aktywni i bez konta stają się **uczestnikami**, wszyscy jako *Nieobecni*."
  - "Edycja wydarzenia dodaje uczniów, którzy teraz pasują; nigdy nie usuwa uczestników."
  - "Status uczestnika: **Nieobecny → Biorę udział → Opłacone**. Instruktor ustawia dowolny i zapisuje *Zapisz*; uczeń odpowiada Biorę udział / Nieobecny od razu, chyba że instruktor oznaczył go *Opłacone* albo wydarzenie jest anulowane lub zakończone."
  - "Przy *Planowanych egzaminach* każdy uczestnik ma przełącznik **Zdaje egzamin**, zapisywany od razu. Tylko zdający mogą dostać **zamówienie na wydarzenie** (np. opłata egzaminacyjna, pas), przygotowane na ekranie uczestników i zapisywane przez *Zapisz*."
  - "Wydarzenia z **opłaconymi uczestnikami nie można usunąć**: można je tylko **anulować**. Anulowane wydarzenie zostaje w kalendarzu i można je przywrócić."
  - "Typu używanego przez wydarzenia nie można usunąć; arkusz mówi, ile wydarzeń go używa."
messages:
  - situation: "Anulowanie wydarzenia"
    title: "Anulować Obóz zimowy?"
    message: "Wydarzenie zostanie w kalendarzu jako anulowane i tak zobaczą je uczestnicy."
  - situation: "Usunięcie wydarzenia z opłaconymi uczestnikami"
    title: "Nie można usunąć"
    message: "To wydarzenie ma 6 opłaconych uczestników i nie może zostać usunięte. Anuluj je."
  - situation: "Usunięcie wydarzenia"
    title: "Usunąć Obóz zimowy?"
    message: "Wydarzenie i lista uczestników zostaną usunięte. Tej operacji nie można cofnąć."
  - situation: "Uczeń dodany do wydarzenia"
    title: "Dodano Cię do wydarzenia"
    message: "Dodano Cię do: Obóz zimowy (20 gru)"
flows:
  - id: create
    title: "Nowe wydarzenie"
    steps:
      - title: "Nowe wydarzenie"
        text: "Nazwa, typ, krótka notatka, miejsce, początek i koniec (liczba dni jako chip), cena i waluta, *Planowane egzaminy* oraz *Dla kogo?*."
        screen: EventCreate
      - title: "Typ"
        text: "Arkusz typów wybiera jeden z typów wydarzeń organizacji; *Dodaj* tworzy nowy, ikona w nagłówku otwiera listę typów do zmiany nazwy lub usunięcia."
        screen: EventTypePicker
      - title: "Utwórz"
        text: "Wydarzenie i jego uczestnicy (każdy, kto pasuje do odbiorców, *Nieobecny*) są zapisywani i synchronizowani."
        screen: EventDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Uczniowie dostają powiadomienie"
        text: "Dla każdego uczestnika z kontem, dodanego przez kogoś innego, baza zapisuje *Dodano Cię do wydarzenia* i wysyła je jako push."
        screen: NotificationsStudent
        api:
          - { id: send-push, x: 85, y: 36 }
    diagram: |
      sequenceDiagram
        actor I as Instruktor
        participant A as Aplikacja
        participant L as Lokalna baza
        participant Sync as Edge Function sync
        participant DB as Baza Supabase
        I->>A: Wydarzenie, odbiorcy, Utwórz
        A->>L: Wydarzenie
        A->>L: Członkowie z grupy odbiorców
        A->>L: Po jednym uczestniku, Nieobecny
        A-)Sync: Wypchnij wydarzenie i uczestników
        Sync->>DB: Zapis
        DB->>DB: Dodano Cię do wydarzenia dla każdego ucznia z kontem
  - id: participants
    title: "Uczestnicy i egzaminy"
    steps:
      - title: "Szczegóły wydarzenia"
        text: "Nazwa z liczbą dni, notatka, typ, daty, miejsce, cena i podsumowanie uczestników; *Zarządzaj* otwiera uczestników."
        screen: EventDetails
      - title: "Uczestnicy"
        text: "Dotknięcie okrągłego przycisku zmienia status: Nieobecny → Biorę udział → Opłacone; *Zapisz* zapisuje zmiany w jednej paczce."
        screen: EventParticipants
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Zdający egzamin"
        text: "Przy planowanych egzaminach *Zdaje egzamin* zapisuje się od razu; zdający dostają *Dodaj zamówienie* i swoje zamówienia na wydarzenie poniżej."
        screen: EventParticipantsExams
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Zamówienie na wydarzenie"
        text: "Zamówienie jest dla zablokowanego ucznia i wydarzenia; *Utwórz* oddaje je na ekran uczestników jako szkic, a *Zapisz* tam je zapisuje (zob. [Zamówienia](./orders))."
        screen: OrderCreateEvent
  - id: answer
    title: "Odpowiedź ucznia"
    steps:
      - title: "Powiadomienie"
        text: "*Dodano Cię do wydarzenia* z nazwą i początkiem; dotknięcie otwiera listę wydarzeń ucznia, na której jest to wydarzenie."
        screen: NotificationsStudent
      - title: "Biorę udział"
        text: "Szczegóły wydarzenia ucznia pokazują wydarzenie i jego własny status; Biorę udział / Nieobecny zapisuje się od razu. Gdy uczeń odpowie *Biorę udział*, właściciel dostaje powiadomienie."
        screen: Student
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: cancel
    title: "Anulowanie lub usunięcie"
    steps:
      - title: "Anuluj lub usuń"
        text: "*Anuluj* prosi o potwierdzenie; kosz usuwa, chyba że ktoś zapłacił, wtedy arkusz proponuje anulowanie. Anulowane wydarzenie pokazuje *Przywróć* zamiast *Anuluj*."
        screen: EventCancelSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Lista wydarzeń i wpis w kalendarzu | `src/modules/events/components/EventListView.tsx`, `hooks/useEventList.ts`, [Kalendarz](./calendar) |
| Nowe / edycja wydarzenia (trasy `/organization/events/create`, `…/{eventId}/edit`) | `EventFormScreen.tsx`, `eventFormState.ts`, `hooks/useCreateEvent.ts`, `hooks/useUpdateEvent.ts` |
| Szczegóły wydarzenia (trasa `/organization/events/{eventId}`) | `EventDetailsScreen.tsx`, `EventCancelSheet.tsx`, `cancelEvent`, `deleteEvent` w `services/eventService.ts` |
| Uczestnicy (trasa `…/{eventId}/participants`) | `EventParticipantsScreen.tsx`, `participantDrafts.ts`, `bulkSaveParticipantStatuses`, `setParticipantTakesExam`, `commitEventOrderChanges` |
| Typy wydarzeń (trasa `/organization/events/types`) | `EventTypesListScreen.tsx`, `EventTypeSheet.tsx`, `EventTypePickerSheet.tsx`, `services/eventTypeService.ts` |
| Wydarzenia ucznia (trasy `/user/events`, `/user/events/{eventId}`) | `StudentEventsScreen.tsx`, `StudentEventDetailsScreen.tsx`, `studentEvents.ts` |
| Powiadomienia | `notify_event_participant` w `supabase/migrations/20261001000000_notifications.sql` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `event_types` | `organization_id`, `name` |
| `events` | `organization_id`, `school_id`, `name`, `type_id`, `short_note`, `address`, `start_date`, `end_date`, `price`, `currency`, `visibility` (`organization` / `school` / `whitelist`), `status` (`active` / `cancelled`), `exams_planned` |
| `event_participants` | `event_id`, `school_member_id`, `status` (`absent` / `attending` / `paid`), `status_changed_by`, `takes_exam` |

`status_changed_by` mówi bazie, kto działał: sam uczeń (odpowiedź powiadamia właściciela) czy ktoś inny (dodanie powiadamia ucznia).

</FeatureView>
