---
layout: page
feature: sign-in
title: Bejelentkezés
group: account
accent: brand
icon: log-in
order: 2
summary: "Az edzők és a tanulók e-maillel és jelszóval jelentkeznek be. Az első bejelentkezés után az alkalmazás magától nyílik meg, offline is."
purpose: "Hozzáférést ad a saját iskolákhoz, tanulókhoz és technikai jegyzetekhez. Egy fiók mindkét szerepet kiszolgálja: hogy bejelentkezés után mit lát a felhasználó, attól függ, tulajdonol-e szervezetet."
who:
  - role: "Edző (szervezet tulajdonosa)"
    outcome: "Szervezeti irányítópult"
  - role: "Tanuló, vagy még iskola nélküli fiók"
    outcome: "Tanulói irányítópult"
rules:
  - "Az **első** bejelentkezéshez internet kell. Kapcsolat nélkül az alkalmazás a *Nincs internetkapcsolat* üzenetet mutatja, és meg sem próbálja."
  - "Utána a munkamenet az eszközön marad. Induláskor az alkalmazás magától bejelentkeztet, **offline és lejárt tokennel is**: az adatok a helyi adatbázisból jönnek, a munkamenet pedig frissül, amint az eszköz újra online."
  - "Ha a token lejárt és online sem frissíthető, újra be kell jelentkezni (*A munkameneted lejárt*)."
  - "A felület nyelve a képernyő sarkában választható, és csak az eszközön tárolódik."
  - "A Google-bejelentkezés a kódban meg van valósítva, de a bejelentkező képernyőn **nincs Google gomb**."
messages:
  - situation: "Hibás e-mail vagy jelszó"
    title: "Hibás e-mail-cím vagy jelszó"
    message: "Ellenőrizd mindkettőt, és próbáld újra. Az első bejelentkezéshez internetkapcsolat szükséges."
  - situation: "Nincs kapcsolat"
    title: "Kapcsolódási hiba"
    message: "Nincs internetkapcsolat. Csatlakozz egy hálózathoz, és próbáld újra."
  - situation: "Túl sok próbálkozás"
    title: "Túl sok próbálkozás"
    message: "Túl sok bejelentkezési kísérlet. Próbáld újra néhány perc múlva."
  - situation: "A munkamenet nem frissíthető"
    message: "A munkameneted lejárt. Jelentkezz be újra."
  - situation: "Egyéb hiba"
    title: "Hiba történt"
    message: "Váratlan hiba történt. Próbáld újra, vagy fordulj az ügyfélszolgálathoz."
screens:
  - src: /screens/sign-in/form.png
    caption: "Bejelentkezés"
  - src: /screens/sign-in/wrong-credentials.png
    caption: "Hibás e-mail-cím vagy jelszó"
api: [auth-google]
flows:
  - id: email
    title: "Bejelentkezés e-maillel"
    steps:
      - title: "E-mail és jelszó"
        text: "A felhasználó beírja az e-mail-címét és a jelszavát. A sarokban van a nyelvválasztó; az *Elfelejtetted a jelszavad?* és a *Regisztráció* a többi folyamathoz vezet."
        screen: AuthLogin
      - title: "Bejelentkezés"
        text: "Az alkalmazás előbb a hálózatot ellenőrzi: offline a *Nincs internetkapcsolat* üzenetet mutatja, és leáll. Online bejelentkezik a Supabase Auth-ba, és a munkamenetet a SecureStore-ba menti."
        screen: AuthLogin
        api:
          - { id: auth-sign-in-password, x: 80, y: 68 }
      - title: "Hibás e-mail vagy jelszó"
        text: "A Supabase `invalid_credentials` választ ad. A sáv elmondja, mi a baj, a jelszómező pedig piros lesz. A túl sok próbálkozásnak és a hálózati hibának saját üzenete van."
        screen: AuthLoginError
        api:
          - { id: auth-sign-in-password, x: 86, y: 43 }
      - title: "Ki jelentkezik be"
        text: "Közvetlenül a Supabase táblákból: van-e saját szervezete, és mely iskoláknak aktív tagja. Mindkét eredményt az eszköz tárolja az offline indításhoz."
        api:
          - { id: organizations-owned }
          - { id: school-members-active }
      - title: "Adatszinkronizálás"
        text: "Az alkalmazás a háttérben letölti a felhasználó adatait a helyi adatbázisba. Az indítóképernyő mutatja a haladást."
        screen: LaunchLoading
        api:
          - { id: sync-pull, x: 72, y: 86 }
      - title: "Irányítópult"
        text: "A szervezet tulajdonosa a **szervezeti irányítópultra** kerül, mindenki más a **tanulói irányítópultra**."
        screen: Main
    diagram: |
      sequenceDiagram
        actor U as Felhasználó
        participant A as Alkalmazás
        participant Auth as Supabase Auth
        participant DB as Supabase adatbázis
        participant Sync as Edge Function sync
        U->>A: E-mail + jelszó, Bejelentkezés
        A->>A: Hálózat ellenőrzése
        alt offline
          A-->>U: Nincs internetkapcsolat
        else online
          A->>Auth: signInWithPassword
          alt hibás adatok
            Auth-->>A: invalid_credentials
            A-->>U: Hibás e-mail-cím vagy jelszó
          else siker
            Auth-->>A: Munkamenet (JWT)
            A->>A: Munkamenet mentése az eszközre
            A->>DB: Van saját szervezete?
            A->>DB: Aktív iskolai tagságok
            A-)Sync: Adatok letöltése (háttérben)
            A-->>U: Irányítópult
          end
        end
  - id: startup
    title: "Indítás: automatikus bejelentkezés"
    steps:
      - title: "Munkamenet az eszközön"
        text: "Minden indításkor az alkalmazás mentett munkamenetet keres. Ha nincs, a bejelentkező képernyőt nyitja meg."
        screen: LaunchLoading
      - title: "Lejárt token, online"
        text: "A lejárt access tokent a refresh token frissíti. Ha ez nem sikerül, a mentett adatok törlődnek, és újra be kell jelentkezni (*A munkameneted lejárt*)."
        api:
          - { id: auth-refresh }
      - title: "Offline"
        text: "Offline az alkalmazás megtartja a mentett munkamenetet, **akkor is, ha lejárt**, és a helyi adatbázison dolgozik. Semmi nem megy ki, amíg az eszköz nem online."
        screen: LaunchLoadingOffline
      - title: "Kontextus és szinkronizálás"
        text: "Online az alkalmazás újra betölti a szervezetet és a tagságokat, majd a háttérben szinkronizál."
        screen: LaunchLoading
        api:
          - { id: organizations-owned }
          - { id: school-members-active }
          - { id: sync-pull, x: 72, y: 86 }
      - title: "Irányítópult"
        text: "A felhasználó gépelés nélkül az irányítópultján van."
        screen: Student
    diagram: |
      flowchart TD
        start([Alkalmazás indul]) --> stored{Van mentett<br/>munkamenet?}
        stored -- nem --> login[Bejelentkező képernyő]
        stored -- igen --> expired{Lejárt a token?}
        expired -- nem --> online1{Online?}
        online1 -- nem --> ctx[Szervezet és iskolák<br/>az eszközről]
        online1 -- igen --> check{Érvényes a munkamenet<br/>a Supabase-ben?}
        check -- nem --> clear[Mentett adatok törlése] --> login
        check -- igen --> ctx
        expired -- igen --> online2{Online?}
        online2 -- nem --> ctx
        online2 -- igen --> refresh{Token frissítése}
        refresh -- hiba --> expiredMsg[Üzenet: lejárt munkamenet] --> login
        refresh -- ok --> ctx
        ctx --> sync[Szinkronizálás a háttérben<br/>csak online]
        sync --> route{Van saját szervezete?}
        route -- igen --> org[Szervezeti irányítópult]
        route -- nem --> user[Tanulói irányítópult]
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Képernyő (route `/auth/login`) | `app/auth/login.tsx` |
| Űrlap, hibasáv | `src/modules/auth/components/LoginForm.tsx` |
| Validáció | `src/modules/auth/validation/loginSchema.ts` |
| Bejelentkezés, automatikus bejelentkezés, kijelentkezés | `src/modules/auth/hooks/useAuth.ts` |
| Visszatérés a Google-től (route `/auth/callback`) | `app/auth/callback.tsx` |
| Irányítópult kiválasztása (route `/`) | `app/index.tsx` |
| Munkamenet tárolása | `src/modules/auth/services/secureStorage.ts` |
| Adatszinkronizálás | `src/database/sync.ts` |

A munkamenet ellenőrzése alatt minden indító route a `LaunchScreen`-t mutatja, soha nem spinnert.

## Az eszközön tárolt adatok

Natív: Expo SecureStore. Web: AsyncStorage.

| Kulcs | Tartalom |
| --- | --- |
| `session` | Supabase munkamenet (tokenek, felhasználó) |
| `organization` | Saját szervezet `{ id, owner_id, name }` |
| `schoolMemberships` | Aktív iskolai tagságok |
| `activeMembershipId` | A kontextusváltóban kiválasztott iskola |

## Hibák leképezése

A `useAuth.ts` `mapSupabaseError` függvénye a Supabase-hibákat `invalid_credentials`, `too_many_requests`, `network_error` vagy `unknown` kódra alakítja; a `LoginForm` ez alapján választja a hibasáv címét.

## Megjegyzések

- A szervezet és a tagságok lekérdezése közvetlenül a Supabase táblákhoz megy, a szinkronizáláson kívül. Csak online fut, az eredményt az offline indításhoz tároljuk.
- Lejárt tokennel offline csak a helyi adatbázis használható; semmi nem megy ki, amíg a token nem frissül.
- A Google-bejelentkezés (`useAuth.signInWithGoogle`, `app/auth/callback.tsx`) a kódban működik, de egyetlen képernyő sem kínálja.

</FeatureView>
