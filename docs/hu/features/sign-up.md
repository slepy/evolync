---
layout: page
feature: sign-up
title: Regisztráció
group: account
accent: brand
icon: user-plus
order: 1
summary: "Egy új felhasználó fiókot hoz létre. Az edző azonnal kap egy szervezetet az első iskolával, a tanuló fiókot kap, és a következő lépésben kóddal csatlakozik egy iskolához."
purpose: "Az iskola tulajdonosa a mi közreműködésünk nélkül kezdheti használni az Evolyncot, a tanuló pedig már azelőtt létrehozhatja a fiókját, hogy megkapná a kódot az edzőjétől."
who:
  - role: "**Iskolát vezetek**: edző, tulajdonos"
    outcome: "Fiók + szervezet + szerepek + első iskola, utána a szervezeti irányítópult"
  - role: "**Egy iskolában edzek**: tanuló"
    outcome: "Csak fiók, utána Csatlakozás iskolához (kihagyható)"
rules:
  - "A regisztrációhoz internet kell."
  - "Az e-mail-megerősítés ki van kapcsolva: a fiók létrehozás után azonnal be van jelentkezve."
  - "Jelszó: legalább 8 karakter, nagybetű, kisbetű, számjegy és a `@ $ ! % * ? &` egyike; más karakter nem megengedett. A mező alatti chipek mutatják, mely szabályok teljesülnek. A jelszót kétszer kell beírni."
  - "Edző: teljes név (legalább 2 karakter), a szervezet és az első iskola neve (egyenként legalább 3 karakter). További iskolák később adhatók hozzá."
  - "Tanuló: a név és a telefonszám nem kötelező. A telefonszám országelőtag és 4–15 számjegy."
  - "Egy e-mail-cím = egy fiók. Ha az e-mail-cím egy olyan fiókhoz tartozik, amelyet egy régebbi alkalmazásverzió szervezet nélkül hagyott, ugyanazzal a jelszóval az alkalmazás befejezi a szervezettel, hiba helyett."
messages:
  - situation: "Az e-mail-cím már regisztrálva van"
    message: "Ez az e-mail-cím már regisztrálva van"
  - situation: "Egyéb hiba"
    message: "A regisztráció nem sikerült. Próbáld újra."
screens:
  - src: /screens/sign-up/account-type.png
    caption: "Fióktípus"
  - src: /screens/sign-up/organization.png
    caption: "Iskolát vezetek: új szervezet"
  - src: /screens/sign-up/student.png
    caption: "Egy iskolában edzek: új fiók"
flows:
  - id: instructor
    title: "Edző: Iskolát vezetek"
    steps:
      - title: "Fióktípus"
        text: "A bejelentkező képernyő *Regisztráció* gombja megnyitja a választást. Az edző az **Iskolát vezetek** lehetőséget választja."
        screen: AuthRegisterType
      - title: "Fiók és szervezet"
        text: "Egy űrlap: név, e-mail, jelszó kétszer, a szervezet és az első iskola neve. A jelszó alatti chipek kigyulladnak, ahogy a szabályok teljesülnek."
        screen: AuthRegisterOrganization
      - title: "Fiók és szervezet egyszerre"
        text: "A regisztráció a fiókkal együtt elküldi a szervezet és az iskola nevét. Egy adatbázis-trigger ugyanabban a tranzakcióban létrehozza a szervezetet, az Owner / Instructor / Student szerepeket és az első iskolát: ha bármi hibára fut, a fiók sem jön létre."
        api:
          - { id: auth-sign-up }
      - title: "A szervezet beolvasása"
        text: "Az alkalmazás beolvassa az új szervezet azonosítóját. Ha az e-mail-címet egy szervezet nélküli fiók foglalta, ugyanazzal a jelszóval bejelentkezik, és a `setup_instructor_organization` hozza létre a szervezetet."
        api:
          - { id: organizations-owned }
          - { id: setup-instructor-organization }
      - title: "Szervezeti irányítópult"
        text: "A munkamenet és a szervezet az eszközre mentődik; megnyílik az irányítópult, az első szinkronizálás pedig a háttérben fut."
        screen: Main
        api:
          - { id: sync-pull, x: 86, y: 10 }
    diagram: |
      sequenceDiagram
        actor U as Edző
        participant A as Alkalmazás
        participant Auth as Supabase Auth
        participant DB as Supabase adatbázis
        participant Sync as Edge Function sync
        U->>A: Fiók + szervezet + első iskola, Létrehozás
        A->>Auth: signUp (e-mail, jelszó, szervezet és iskola neve)
        Note over Auth,DB: trigger ugyanabban a tranzakcióban:<br/>szervezet, Owner / Instructor / Student szerepek,<br/>első iskola
        Auth-->>A: Felhasználó + munkamenet
        A->>DB: Saját szervezet
        DB-->>A: organization_id
        A->>A: Munkamenet és szervezet mentése az eszközre
        A-->>U: Szervezeti irányítópult
        A-)Sync: Adatok letöltése (háttérben)
  - id: student
    title: "Tanuló: Egy iskolában edzek"
    steps:
      - title: "Fióktípus"
        text: "A tanuló az **Egy iskolában edzek** lehetőséget választja."
        screen: AuthRegisterType
      - title: "Új fiók"
        text: "Csak az e-mail és a jelszó kötelező; a név és a telefon nem. Az alsó kártya jelzi, hogy a következő lépés az iskola kódja."
        screen: AuthRegisterStudent
      - title: "A fiók létrehozása"
        text: "A Supabase Auth létrehozza a felhasználót a névvel és a telefonnal a metaadatokban; az alkalmazás a háttérben szinkronizál."
        api:
          - { id: auth-sign-up }
          - { id: sync-pull }
      - title: "Csatlakozás iskolához"
        text: "Az alkalmazás egyenesen a [Csatlakozás iskolához](./join-school) képernyőre lép. Az ottani Vissza és Kész a tanulói irányítópultra visz, soha nem vissza a regisztrációhoz."
        screen: JoinSchool
    diagram: |
      sequenceDiagram
        actor U as Tanuló
        participant A as Alkalmazás
        participant Auth as Supabase Auth
        participant Sync as Edge Function sync
        U->>A: E-mail, jelszó (név, telefon nem kötelező), Létrehozás
        A->>Auth: signUp (e-mail, jelszó, teljes név, telefon)
        Auth-->>A: Felhasználó + munkamenet
        A-)Sync: Szinkronizálás (háttérben)
        A-->>U: Csatlakozás iskolához
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Fióktípus (route `/auth/register`) | `app/auth/register/index.tsx`, `AccountTypeOption.tsx` |
| Edzői űrlap (route `/auth/register/instructor`) | `src/modules/auth/components/RegisterInstructorForm.tsx` |
| Tanulói űrlap (route `/auth/register/user`) | `src/modules/auth/components/RegisterForm.tsx` |
| Jelszómezők és szabálychipek | `PasswordFields.tsx`, `PasswordRules.tsx`, `utils/passwordRules.ts` |
| Validáció | `src/modules/auth/validation/registerSchema.ts` |
| Edző regisztrációja | `hooks/useRegisterInstructor.ts`, `services/registerInstructor.ts`, `services/instructorSignUp.ts` |
| Tanuló regisztrációja | `hooks/useRegister.ts`, `services/register.ts` |
| Szervezet létrehozása (SQL) | `handle_new_user_signup` trigger a `supabase/migrations/20261026000100_instructor_signup_in_one_transaction.sql` fájlban; `setup_instructor_organization` a szervezet nélküli fiókokhoz |

## Adatok

- A `full_name` (tanulónál a `phone_number`, edzőnél az `organization_name` és a `school_name` is) a Supabase Auth felhasználói metaadataiba kerül.
- Az edző szervezete az eszközön az `organization` kulcs alatt tárolódik, így az alkalmazás offline is a szervezeti irányítópulton indul.

## Megjegyzések

- **Egy tranzakció.** Az edző szervezetét az `on_auth_user_created` trigger hozza létre az `auth.users` beszúrásakor, így a regisztráció vagy teljesen sikerül, vagy semmi nem marad utána. A régebbi alkalmazásverziók által szervezet nélkül hagyott fiókokat a következő regisztráció ugyanazzal a jelszóval befejezi.
- **A validációs üzenetek követik a nyelvet.** A sémákat a `localizedSchema` építi fel az űrlap megjelenésekor, a képernyőn lévő hibákat pedig nyelvváltás után újra ellenőrzi az alkalmazás.

</FeatureView>
