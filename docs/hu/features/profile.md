---
layout: page
feature: profile
title: Profil és beállítások
group: account
accent: brand
icon: sliders
order: 6
summary: "A Profil fül (fotó, teljes név, telefon, a zárolt bejelentkezési e-mail, Kijelentkezés) és a Beállítások fül (push ezen az eszközön, nyelv, Csatlakozás iskolához), minden szerepnek."
purpose: "Az a néhány dolog, amit mindenki saját magáról beállít, ugyanott, szereptől függetlenül."
who:
  - role: "Minden bejelentkezett felhasználó"
    outcome: "Módosítja a fotóját, nevét és telefonszámát, az alkalmazás nyelvét és a pusht, kijelentkezik"
rules:
  - "**Profil**: FOTÓ, TELJES NÉV, TELEFON (opcionális, országhívóval) és a bejelentkezési E-MAIL, amely az alkalmazásban nem módosítható."
  - "Az első módosítás után a *Mentés* váltja fel az alsó sávot. A fotó az `avatars` tárolóba kerül, majd a név, a telefon és a fotó a fiókba mentődik (Supabase Auth). A mentéshez kapcsolat kell."
  - "Az adatbázis a nevet, a fotót és a telefont a felhasználó minden iskolai tagságába átmásolja, így az oktatók a következő szinkronizálás után látják az új adatokat."
  - "A *Kijelentkezés* előbb rákérdez, és csak ezen az eszközön jelentkeztet ki."
  - "**Beállítások**: *Push-értesítések* ehhez az eszközhöz (lásd [Értesítések](./notifications)), a **nyelv** (English, Polski, Magyar; csak az eszközön tárolva, soha nem az adatbázisban) és a *Csatlakozás iskolához*."
messages:
  - situation: "A fotó feltöltése nem sikerült"
    message: "Nem sikerült feltölteni a profilképet. Ellenőrizd a kapcsolatot, és próbáld újra."
  - situation: "Az e-mail alatt"
    message: "A bejelentkezési e-mail-cím nem módosítható az alkalmazásban."
  - situation: "Kijelentkezés"
    title: "Kijelentkezel?"
    message: "Az e-mail-címeddel és jelszavaddal újra bejelentkezhetsz."
flows:
  - id: profile
    title: "Profil"
    steps:
      - title: "Profil"
        text: "Fotó, *Személyes adatok* (teljes név, telefon), *Bejelentkezés* (zárolt e-mail), *Kijelentkezés*."
        screen: Profile
      - title: "Mentés"
        text: "Módosítás után a *Mentés* az alsó sáv helyére kerül: fotófeltöltés, fiókfrissítés, majd szinkronizálás."
        screen: ProfileEdited
        api:
          - { id: storage-upload, x: 50, y: 15 }
          - { id: auth-update-user, x: 50, y: 92 }
  - id: settings
    title: "Beállítások"
    steps:
      - title: "Beállítások"
        text: "Push ehhez az eszközhöz, nyelv (azonnal átállítja az alkalmazást) és *Csatlakozás iskolához*."
        screen: NotificationsSettings
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Profil fül (útvonal `/user/profile`) | `app/user/profile.tsx`, `src/modules/auth/components/ProfileScreen.tsx`, `utils/profileValues.ts`, `validation/profileSchema.ts` |
| Beállítások fül (útvonal `/user/settings`) | `app/user/settings.tsx`, `PushNotificationsSetting`, `LanguageSwitcher` |
| A profil másolása a tagságokba | `sync_user_profile_to_members` trigger (`supabase/migrations/20260219100000_sync_user_profile_to_school_members.sql`, a telefon a `20260302000000` migrációban került bele) |
| Nyelv | `src/core/i18n/` (AsyncStorage) |

## Megjegyzések

- A Beállítások terve *Megjelenés* (Rendszer / Világos / Sötét) beállítást is mutat; az alkalmazásban ilyen nincs, mindig sötét.

</FeatureView>
