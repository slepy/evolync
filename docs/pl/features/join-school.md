---
layout: page
feature: join-school
title: Dołączenie do szkoły
group: school
accent: school
icon: ticket
order: 10
summary: "Uczeń wpisuje kod od instruktora i wysyła prośbę. Instruktor ją akceptuje i uczeń zostaje członkiem szkoły."
purpose: "Uczniowie dołączają sami, instruktor nie przepisuje ich danych. Akceptacja zostawia instruktorowi kontrolę nad tym, kto wchodzi do szkoły."
who:
  - role: "Uczeń"
    outcome: "Wysyła prośbę z kodem szkoły"
  - role: "Instruktor (właściciel szkoły)"
    outcome: "Akceptuje albo odrzuca ją w Uczniach"
rules:
  - "Zaczyna się zaraz po rejestracji ucznia, od *Dołącz do szkoły* na dashboardzie ucznia albo od *Dołącz do kolejnej szkoły* w przełączniku kontekstu."
  - "Wymaga internetu. Offline ekran pokazuje komunikat, a *Dołącz* jest nieaktywne."
  - "Kod to litery i cyfry dowolnej długości; wielkość liter nie ma znaczenia (aplikacja zamienia je na wielkie). Działa, dopóki nie wygaśnie albo instruktor go nie usunie."
  - "Jedna **oczekująca** prośba na szkołę, a aktywny członek nie może jej wysłać. Po odrzuceniu uczeń może wysłać nową prośbę, która zastępuje kartę odrzuconej."
  - "Dashboard ucznia pokazuje prośbę jako *Oczekuje na akceptację* albo *Odrzucono*; kartę odrzuconej prośby można zamknąć. Akceptacja przychodzi jako *Prośba zaakceptowana* w Alertach i jako push."
  - "Instruktor może zaakceptować jako **nowego członka** albo **połączyć z istniejącym członkiem** dodanym wcześniej bez konta, i od razu dodać ucznia do okresów płatności i wydarzeń."
messages:
  - situation: "Nieznany lub wygasły kod"
    title: "Ten kod nie działa"
    message: "Nie istnieje albo wygasł. Poproś instruktora o nowy."
  - situation: "Prośba już wysłana"
    title: "Prośba już wysłana"
    message: "Twoja prośba o dołączenie oczekuje na zatwierdzenie przez instruktora."
  - situation: "Już członek"
    title: "Już jesteś członkiem"
    message: "Jesteś już aktywnym członkiem tej szkoły."
  - situation: "Offline"
    message: "Dołączenie do szkoły wymaga połączenia z internetem."
flows:
  - id: request
    title: "Uczeń wysyła prośbę"
    steps:
      - title: "Jeszcze bez szkoły"
        text: "Bez szkoły dashboard ucznia proponuje *Dołącz do szkoły*."
        screen: NoSchool
      - title: "Wpisanie kodu"
        text: "Aplikacja najpierw szuka zaproszenia na urządzeniu; jeśli go nie ma (instruktor utworzył je na innym urządzeniu), pyta Supabase o ważny, niewygasły kod."
        screen: JoinSchoolFilled
        api:
          - { id: school-invites-by-code, x: 80, y: 93 }
      - title: "Kod nie działa"
        text: "Brak ważnego zaproszenia: baner prosi o nowy kod. Oczekująca prośba albo aktywne członkostwo w tej szkole mają własne komunikaty."
        screen: JoinSchoolError
      - title: "Offline"
        text: "Bez połączenia komunikat wyjaśnia dlaczego, a *Dołącz* zostaje nieaktywne."
        screen: JoinSchoolOffline
      - title: "Prośba wysłana"
        text: "Prośba zapisuje się lokalnie jako *pending* i idzie synchronizacją; aplikacja pobiera też szkołę, żeby pokazać jej nazwę."
        screen: JoinSchoolSent
        api:
          - { id: sync-push, x: 82, y: 93 }
          - { id: schools-by-id, x: 12, y: 51 }
      - title: "Powiadomienie instruktora"
        text: "Trigger w bazie tworzy powiadomienie dla właściciela szkoły, a `send-push` dostarcza je na jego telefon."
        api:
          - { id: send-push }
    diagram: |
      sequenceDiagram
        actor S as Uczeń
        participant A as Aplikacja
        participant L as Lokalna baza
        participant DB as Baza Supabase
        participant Sync as Edge Function sync
        participant P as send-push
        S->>A: Kod, Dołącz
        A->>L: Zaproszenie z tym kodem?
        alt brak na urządzeniu
          A->>DB: school_invites po kodzie (niewygasłe)
        end
        alt brak ważnego zaproszenia
          A-->>S: Ten kod nie działa
        else zaproszenie znalezione
          A->>L: Prośba lub członkostwo już jest?
          alt tak
            A-->>S: Prośba już wysłana / Już jesteś członkiem
          else nie
            A->>L: Utworzenie prośby (pending)
            A-->>S: Prośba wysłana
            A-)Sync: Wysłanie prośby
            Sync->>DB: Insert school_join_requests
            DB->>DB: Powiadomienie dla właściciela szkoły
            DB-)P: Push do instruktora
            A-)DB: Pobranie szkoły, jeśli brak lokalnie
          end
        end
  - id: decision
    title: "Instruktor decyduje"
    steps:
      - title: "Nowa prośba o dołączenie"
        text: "Instruktor widzi *Nowa prośba o dołączenie* w Alertach (i jako push) i otwiera ją w Uczniach."
        screen: NotificationsOrg
      - title: "Akceptacja albo odrzucenie"
        text: "Akceptacja tworzy aktywnego członka z rolą Student albo aktywuje członka offline kontem ucznia; ucznia można od razu dodać do okresów płatności i wydarzeń. Odrzucenie oznacza prośbę jako *Odrzucono*. W obu przypadkach zmiana idzie synchronizacją."
        screen: StudentsRequests
        api:
          - { id: sync-push, x: 85, y: 47 }
      - title: "Dashboard ucznia"
        text: "Uczeń dostaje *Prośba zaakceptowana: Należysz teraz do: …* w Alertach i jako push. Szkoła pojawia się od razu: aplikacja obserwuje członkostwa ucznia w lokalnej bazie, a synchronizacja pobiera dane nowej szkoły w całości."
        screen: Student
        api:
          - { id: send-push }
          - { id: sync-pull, x: 86, y: 10 }
    diagram: |
      flowchart TD
        req[Prośba o dołączenie<br/>Oczekuje] --> decide{Instruktor}
        decide -- Akceptuj --> mode{Nowy czy istniejący członek?}
        mode -- nowy --> create[Nowy aktywny członek<br/>z rolą Student]
        mode -- istniejący --> link[Aktywacja członka offline<br/>z kontem ucznia]
        create --> extra[Dodanie do wybranych okresów<br/>płatności i wydarzeń]
        link --> extra
        extra --> del[Usunięcie prośby]
        decide -- Odrzuć --> rej[Prośba oznaczona Odrzucono<br/>widoczna dla ucznia]
        del --> sync[Synchronizacja]
        rej --> sync
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Route `/school/join` (`from=signup`) | `app/school/join.tsx` |
| Ekrany | `src/modules/school/components/JoinSchoolScreen.tsx`, `JoinRequestSent.tsx` |
| Teksty błędów | `src/modules/school/components/joinSchoolError.ts` |
| Logika dołączania | `src/modules/school/services/joinSchoolService.ts`, `hooks/useJoinSchool.ts` |
| Prośby (lokalna baza) | `src/modules/school/repositories/schoolJoinRequestRepository.ts` |
| Akceptacja / odrzucenie | `approveJoinRequest`, `rejectJoinRequest` w `src/modules/students/services/studentService.ts`, `ApproveJoinRequestSheet.tsx` |
| Karta prośby na dashboardzie ucznia | `src/modules/dashboard/components/StudentDashboard.tsx` |
| Powiadomienie właściciela (SQL) | `notify_join_request_created` w `supabase/migrations/20261001000000_notifications.sql` |

## Tabele

| Tabela | Rola |
| --- | --- |
| `school_invites` | Kody: `school_id`, `role_id`, `code`, `expires_at` |
| `school_join_requests` | Prośby: `school_id`, `user_id`, `display_name`, `email`, `status` (`pending` / `rejected`) |
| `school_members` | Tworzony lub aktywowany przy akceptacji |

## Uwagi

- **Prośby nie docierały na serwer od 28.09.2026** aż do migracji `20261026000200`: aplikacja wysyłała kolumnę `status`, której tabela nie miała, a synchronizacja odrzucała prośbę. Migracja dodaje kolumnę i ogranicza unikalność do oczekujących próśb; jednorazowa naprawa (`src/database/resendJoinRequests.ts`) wysyła ponownie prośby zgubione na każdym urządzeniu.
- Sprawdzanie duplikatów działa tylko na lokalnej bazie. Na urządzeniu, które nigdy nie zsynchronizowało rekordów tego użytkownika, prośba przechodzi, a zabezpieczeniem są ograniczenia unikalności w Supabase.
- Powiadomienie o akceptacji (`join_request_approved`) tworzy trigger na wierszu `school_members` ucznia (migracja `20261026000000`); `useOwnMembershipsWatcher` dodaje nową szkołę do przełącznika kontekstu bez ponownego logowania.

</FeatureView>
