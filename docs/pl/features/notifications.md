---
layout: page
feature: notifications
title: Powiadomienia
group: account
accent: brand
icon: bell
order: 5
summary: "Skrzynka na zakładce Alerty i powiadomienia push na urządzeniu: właściciele dowiadują się o nowych zamówieniach, prośbach o dołączenie i zapisach na wydarzenia; uczniowie o nowych płatnościach, dodaniu do wydarzenia i zaakceptowanej prośbie. Dotknięcie otwiera miejsce, którego dotyczy."
purpose: "Mówi, co się zmieniło, bez otwierania każdego ekranu, także gdy aplikacja jest zamknięta."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Dostaje nowe zamówienia, prośby o dołączenie i uczniów, którzy biorą udział w wydarzeniach"
  - role: "Uczeń"
    outcome: "Dostaje nowe płatności, dodanie do wydarzenia i akceptację prośby o dołączenie"
rules:
  - "Powiadomienia zapisuje **baza danych** (wyzwalacze), nigdy aplikacja, więc trafiają do odbiorcy niezależnie od tego, które urządzenie działało."
  - "Nikt nie dostaje powiadomienia o własnym działaniu (właściciel zamawiający dla siebie, uczeń dodany przez siebie)."
  - "Skrzynka synchronizuje się jak inne dane i działa offline; wiersze są pogrupowane *Dziś*, *Wczoraj*, *Wcześniej* z liczbą nowych; *Oznacz wszystkie jako przeczytane* oznacza je lokalnie i synchronizuje."
  - "Wiersz usuwa się **przyciskiem kosza** obok niego, po pytaniu *Usunąć to powiadomienie?*; kosz w nagłówku (*Usuń wszystkie*) pyta *Usunąć wszystkie powiadomienia?*. Usunięcie jest miękkie i synchronizuje się, więc powiadomienie znika też na innych urządzeniach osoby; serwer przyjmuje je tylko dla własnych, żywych wierszy wywołującego."
  - "Dotknięcie oznacza powiadomienie jako przeczytane i otwiera: zamówienie, prośby szkoły, wydarzenie, płatności ucznia, wydarzenia ucznia lub pulpit ucznia. Gdy obiekt już nie istnieje, skrzynka pokazuje *Ten element nie jest już dostępny.*"
  - "**Push** działa per urządzenie: przy pierwszej wizycie na pulpicie arkusz wyjaśnia go przed systemowym pytaniem; Ustawienia mają przełącznik, który uwzględnia wybór użytkownika i zgodę systemu."
  - "Push jest wysyłany w języku urządzenia. Ponad 3 powiadomienia dla jednej osoby w ciągu 60 sekund łączą się w jeden push."
  - "Token urządzenia to stan urządzenia: trafia prosto do Supabase przez `register_push_token` / `disable_push_token` i jest rejestrowany ponownie, gdy jest nieaktualny albo zmienił się język."
messages:
  - situation: "Pusta skrzynka"
    title: "Brak powiadomień"
    message: "Tu pojawią się nowe zamówienia, prośby o dołączenie i zapisy na wydarzenia, także offline."
  - situation: "Obiekt został usunięty"
    message: "Ten element nie jest już dostępny."
  - situation: "Wyjaśnienie push"
    title: "Bądź na bieżąco"
    message: "Alerty na tym urządzeniu, nawet gdy aplikacja jest zamknięta."
  - situation: "Push zablokowany przez system"
    message: "Powiadomienia są zablokowane w ustawieniach urządzenia."
flows:
  - id: inbox
    title: "Skrzynka"
    steps:
      - title: "Alerty"
        text: "Wiersze w kolorach modułów z kropką nieprzeczytanego i czasem; *Oznacz wszystkie jako przeczytane* i kosz (*Usuń wszystkie*) w nagłówku; każdy wiersz ma własny przycisk kosza."
        screen: NotificationsOrg
        api:
          - { id: sync-pull, x: 50, y: 4 }
      - title: "Uczeń"
        text: "Skrzynka ucznia: nowe płatności i wydarzenia, do których go dodano."
        screen: NotificationsStudent
      - title: "Już niedostępne"
        text: "Powiadomienie o czymś usuniętym otwiera z powrotem skrzynkę z bursztynową informacją."
        screen: NotificationsUnavailable
      - title: "Pusto"
        text: "Przed pierwszym powiadomieniem."
        screen: NotificationsEmpty
    diagram: |
      sequenceDiagram
        participant DB as Baza Supabase
        participant P as Edge Function send-push
        participant E as Expo push
        actor U as Odbiorca
        participant A as Aplikacja
        DB->>DB: Wyzwalacz zapisuje wiersz notifications
        DB-)P: Wywołanie pg_net z wierszem
        P->>P: Włączone tokeny odbiorcy, język
        P->>E: Push (albo jedno podsumowanie przy ponad 3 w 60 s)
        E-->>U: Baner
        U->>A: Dotknięcie
        A->>A: Oznacz jako przeczytane, otwórz cel
        A-)DB: Synchronizacja oznaczenia
  - id: push
    title: "Push na tym urządzeniu"
    steps:
      - title: "Pierwszy raz"
        text: "Przy pierwszej wizycie na pulpicie arkusz wymienia, co push daje tej roli; *Włącz* pyta system, *Nie teraz* zostawia wyłączone."
        screen: NotificationsPushPrompt
        api:
          - { id: register-push-token, x: 50, y: 85 }
      - title: "Ustawienia"
        text: "Przełącznik *Powiadomienia push* dla tego urządzenia."
        screen: NotificationsSettings
        api:
          - { id: disable-push-token, x: 80, y: 13 }
      - title: "Zablokowane"
        text: "Gdy system blokuje powiadomienia, podpowiedź robi się czerwona i pojawia się *Otwórz ustawienia urządzenia*; ekran sprawdza ponownie po powrocie do aplikacji."
        screen: NotificationsSettingsBlocked
      - title: "Dostarczenie"
        text: "Baza wywołuje `send-push` dla każdego nowego powiadomienia."
        screen: NotificationsOrg
        api:
          - { id: send-push, x: 50, y: 20 }
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Zakładka Alerty (trasa `/notifications`) | `app/notifications/index.tsx`, `src/modules/notifications/components/NotificationsScreen.tsx`, `NotificationRow.tsx`, `utils/inbox.ts` |
| Teksty każdego typu | `utils/content.ts` |
| Dokąd prowadzi dotknięcie | `utils/routes.ts`, `utils/target.ts`, `services/notificationNavigation.ts` |
| Obsługa dotknięcia push | `NotificationResponseHandler.tsx` |
| Pytanie o push i ustawienie | `PushPermissionPrompt.tsx`, `PushNotificationsSetting.tsx`, `services/pushRegistrationService.ts` |
| Wyzwalacze | `supabase/migrations/20261001000000_notifications.sql` i późniejsze migracje `notify_*` |
| Wysyłanie | `supabase/functions/send-push/` |

## Typy

| Typ | Odbiorca | Otwiera |
| --- | --- | --- |
| `order_created` | właściciel szkoły | zamówienie |
| `join_request_created` | właściciel szkoły | Uczniowie → Prośby |
| `event_rsvp_attending` | właściciel organizacji | wydarzenie |
| `payment_created` | uczeń | Płatności |
| `event_assigned` | uczeń | wydarzenia ucznia |
| `join_request_approved` | uczeń | pulpit ucznia |

</FeatureView>
