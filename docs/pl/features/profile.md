---
layout: page
feature: profile
title: Profil i ustawienia
group: account
accent: brand
icon: sliders
order: 6
summary: "Zakładka Profil (zdjęcie, imię i nazwisko, telefon, zablokowany e-mail logowania, Wyloguj się) i zakładka Ustawienia (push na tym urządzeniu, język, Dołącz do szkoły), dla każdej roli."
purpose: "Tych kilka rzeczy, które każdy ustawia o sobie, w tym samym miejscu niezależnie od roli."
who:
  - role: "Każdy zalogowany użytkownik"
    outcome: "Zmienia zdjęcie, imię i telefon, język aplikacji i push, wylogowuje się"
rules:
  - "**Profil**: ZDJĘCIE, IMIĘ I NAZWISKO, TELEFON (opcjonalny, z prefiksem kraju) i E-MAIL logowania, którego nie można zmienić w aplikacji."
  - "*Zapisz* zastępuje dolny pasek po pierwszej zmianie. Zdjęcie trafia do bucketu `avatars`, potem imię, telefon i zdjęcie są zapisywane w koncie (Supabase Auth). Zapis wymaga połączenia."
  - "Baza kopiuje imię, zdjęcie i telefon do każdego członkostwa użytkownika w szkołach, więc instruktorzy widzą nowe dane po następnej synchronizacji."
  - "*Wyloguj się* najpierw pyta i wylogowuje tylko na tym urządzeniu."
  - "**Ustawienia**: *Powiadomienia push* dla tego urządzenia (zob. [Powiadomienia](./notifications)), **język** (English, Polski, Magyar; zapisany tylko na urządzeniu, nigdy w bazie) i *Dołącz do szkoły*."
messages:
  - situation: "Wysłanie zdjęcia się nie udało"
    message: "Nie udało się przesłać avatara. Sprawdź połączenie i spróbuj ponownie."
  - situation: "Pod e-mailem"
    message: "E-maila do logowania nie można zmienić w aplikacji."
  - situation: "Wylogowanie"
    title: "Wylogować się?"
    message: "Możesz zalogować się ponownie e-mailem i hasłem."
flows:
  - id: profile
    title: "Profil"
    steps:
      - title: "Profil"
        text: "Zdjęcie, *Dane osobowe* (imię i nazwisko, telefon), *Logowanie* (zablokowany e-mail), *Wyloguj się*."
        screen: Profile
      - title: "Zapisz"
        text: "Po zmianie *Zapisz* zajmuje miejsce dolnego paska: wysłanie zdjęcia, aktualizacja konta, potem synchronizacja."
        screen: ProfileEdited
        api:
          - { id: storage-upload, x: 50, y: 15 }
          - { id: auth-update-user, x: 50, y: 92 }
  - id: settings
    title: "Ustawienia"
    steps:
      - title: "Ustawienia"
        text: "Push dla tego urządzenia, język (zmienia aplikację od razu) i *Dołącz do szkoły*."
        screen: NotificationsSettings
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Zakładka Profil (trasa `/user/profile`) | `app/user/profile.tsx`, `src/modules/auth/components/ProfileScreen.tsx`, `utils/profileValues.ts`, `validation/profileSchema.ts` |
| Zakładka Ustawienia (trasa `/user/settings`) | `app/user/settings.tsx`, `PushNotificationsSetting`, `LanguageSwitcher` |
| Kopia profilu do członkostw | wyzwalacz `sync_user_profile_to_members` (`supabase/migrations/20260219100000_sync_user_profile_to_school_members.sql`, telefon dodany w `20260302000000`) |
| Język | `src/core/i18n/` (AsyncStorage) |

## Uwagi

- Plansza Ustawień pokazuje też *Wygląd* (Systemowy / Jasny / Ciemny); aplikacja nie ma takiego ustawienia, zawsze jest ciemna.

</FeatureView>
