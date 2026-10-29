---
layout: page
feature: password-reset
title: Jelszó-visszaállítás
group: account
accent: brand
icon: key
order: 3
summary: "Aki elfelejtette a jelszavát, e-mailben kódot kap, beírja az alkalmazásba az új jelszóval együtt, majd újra bejelentkezik."
purpose: "Visszaadja a hozzáférést anélkül, hogy az edzőhöz vagy az ügyfélszolgálathoz kellene fordulni. Az e-mailben **kód** van, nem link, így semmit nem kell az alkalmazáson kívül megnyitni."
who:
  - role: "Bárki, akinek van fiókja"
    outcome: "Új jelszó, utána újra bejelentkezés"
rules:
  - "Az *Elfelejtetted a jelszavad?* gombbal indul a bejelentkező képernyőn."
  - "Minden lépéshez internet kell."
  - "A kód 6–10 számjegyű, és egyszer használható. Ha hibás vagy lejárt, az *Új kód küldése* elölről kezdi."
  - "Az új jelszóra a regisztráció szabályai érvényesek (8+ karakter, A–Z, a–z, 0–9, szimbólum), és különböznie kell a régitől."
  - "A módosítás után az új jelszóval kell bejelentkezni. A többi eszköz a munkamenet végéig bejelentkezve marad."
messages:
  - situation: "Az e-mail nem ment ki"
    message: "Nem sikerült elküldeni a kódot. Próbáld újra."
  - situation: "Hibás vagy lejárt kód"
    message: "Ez a kód érvénytelen vagy lejárt. Kérj újat."
  - situation: "Túl gyenge jelszó"
    message: "A jelszó túl gyenge. Válassz erősebb jelszót."
  - situation: "Ugyanaz, mint a régi"
    message: "Az új jelszónak különböznie kell a jelenlegitől."
  - situation: "Az új jelszó nem mentődött el"
    message: "Nem sikerült frissíteni a jelszót. Próbáld újra."
  - situation: "Nincs kapcsolat"
    message: "Nincs internetkapcsolat. Csatlakozz egy hálózathoz, és próbáld újra."
screens:
  - src: /screens/password-reset/email.png
    caption: "Elfelejtett jelszó"
  - src: /screens/password-reset/new-password.png
    caption: "Kód és új jelszó"
  - src: /screens/password-reset/done.png
    caption: "Jelszó módosítva"
flows:
  - id: reset
    title: "Visszaállítás kóddal"
    steps:
      - title: "E-mail"
        text: "A felhasználó beírja a regisztrációkor megadott e-mail-címet, és a *Küldés* gombra koppint."
        screen: AuthForgotPassword
        api:
          - { id: auth-recover, x: 82, y: 50 }
      - title: "E-mail a kóddal"
        text: "A Supabase elküldi a visszaállító e-mailt. Az alkalmazás csak a kódot használja; nem küld `redirectTo`-t, így az alkalmazás URL-sémájának nem kell engedélyezve lennie a Supabase-ben."
      - title: "Kód és új jelszó"
        text: "Előbb a kód ellenőrződik, és rövid helyreállítási munkamenetet nyit; utána mentődik az új jelszó. Ha a mentés nem sikerül, a *Mentés* már csak a jelszót próbálja újra: a kód elhasználódott."
        screen: AuthResetPassword
        api:
          - { id: auth-verify-recovery, x: 86, y: 30 }
          - { id: auth-update-user, x: 86, y: 45 }
      - title: "Az új jelszó ellenőrzése"
        text: "Az `updateUser` akkor is 200-at ad, ha semmi nem mentődött, ezért az alkalmazás az új jelszóval bejelentkezve ellenőrzi, majd lezárja a helyreállítási munkamenetet."
        api:
          - { id: auth-sign-in-password }
          - { id: auth-logout }
      - title: "Jelszó módosítva"
        text: "A *Bejelentkezés* visszavisz a bejelentkező képernyőre."
        screen: AuthResetDone
    diagram: |
      sequenceDiagram
        actor U as Felhasználó
        participant A as Alkalmazás
        participant Auth as Supabase Auth
        U->>A: E-mail, Küldés
        A->>Auth: resetPasswordForEmail
        Auth--)U: E-mail a kóddal
        A-->>U: Új jelszó képernyő
        U->>A: Kód + új jelszó kétszer, Mentés
        A->>Auth: verifyOtp (recovery)
        alt hibás kód
          Auth-->>A: otp_expired
          A-->>U: Érvénytelen kód
        else ok
          Auth-->>A: Helyreállítási munkamenet
          A->>Auth: updateUser (jelszó)
          A->>Auth: signInWithPassword (az új jelszó ellenőrzése)
          A->>Auth: signOut (a helyreállítási munkamenet vége)
          A-->>U: Jelszó módosítva, Bejelentkezés
        end
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| E-mail képernyő (route `/auth/forgot-password`) | `app/auth/forgot-password.tsx`, `ForgotPasswordForm.tsx` |
| Kód + jelszó (route `/auth/reset-password?email=…`) | `app/auth/reset-password.tsx`, `ResetPasswordForm.tsx`, `CodeField.tsx` |
| Kész (route `/auth/reset-done`) | `app/auth/reset-done.tsx` |
| Hívások és hibák leképezése | `sendPasswordResetEmail`, `verifyRecoveryOtp`, `updatePassword` a `src/modules/auth/hooks/useAuth.ts` fájlban |
| Validáció, kódhossz | `src/modules/auth/validation/resetPasswordSchema.ts` |

## Megjegyzések

- A visszaállítási kérés nem küld `redirectTo`-t. Így az alkalmazás URL-sémájának nem kell szerepelnie a Supabase engedélyezett átirányításai között (különben a Supabase a `localhost:3000`-re irányít).
- Az `updateUser` akkor is 200-at ad, ha a jelszó nem mentődött el, ezért az alkalmazás a siker jelzése előtt bejelentkezik az új jelszóval.
- Az alkalmazás által elfogadott kódhossznak (6–10) egyeznie kell a Supabase Auth OTP-hosszával.

</FeatureView>
