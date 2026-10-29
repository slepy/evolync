---
layout: page
feature: password-reset
title: Reset hasła
group: account
accent: brand
icon: key
order: 3
summary: "Osoba, która zapomniała hasła, dostaje kod e-mailem, wpisuje go w aplikacji razem z nowym hasłem i loguje się ponownie."
purpose: "Przywraca dostęp bez kontaktu z instruktorem czy pomocą techniczną. W e-mailu jest **kod**, nie link, więc nic nie trzeba otwierać poza aplikacją."
who:
  - role: "Każdy, kto ma konto"
    outcome: "Nowe hasło, potem ponowne logowanie"
rules:
  - "Zaczyna się od *Nie pamiętasz hasła?* na ekranie logowania."
  - "Każdy krok wymaga internetu."
  - "Kod ma 6–10 cyfr i działa jeden raz. Jeśli jest zły albo wygasł, *Wyślij nowy kod* zaczyna od początku."
  - "Nowe hasło spełnia te same zasady co przy rejestracji (8+ znaków, A–Z, a–z, 0–9, symbol) i musi się różnić od starego."
  - "Po zmianie trzeba zalogować się nowym hasłem. Inne urządzenia pozostają zalogowane do końca swojej sesji."
messages:
  - situation: "Nie udało się wysłać e-maila"
    message: "Nie udało się wysłać kodu. Spróbuj ponownie."
  - situation: "Zły lub wygasły kod"
    message: "Ten kod jest nieprawidłowy lub wygasł. Poproś o nowy."
  - situation: "Za słabe hasło"
    message: "Hasło jest zbyt słabe. Wybierz silniejsze hasło."
  - situation: "Takie samo jak stare"
    message: "Nowe hasło musi różnić się od obecnego hasła."
  - situation: "Nowe hasło się nie zapisało"
    message: "Nie udało się zaktualizować hasła. Spróbuj ponownie."
  - situation: "Brak połączenia"
    message: "Brak połączenia z internetem. Połącz się z siecią i spróbuj ponownie."
screens:
  - src: /screens/password-reset/email.png
    caption: "Nie pamiętasz hasła"
  - src: /screens/password-reset/new-password.png
    caption: "Kod i nowe hasło"
  - src: /screens/password-reset/done.png
    caption: "Hasło zmienione"
flows:
  - id: reset
    title: "Reset kodem"
    steps:
      - title: "E-mail"
        text: "Użytkownik wpisuje e-mail podany przy rejestracji i stuka *Wyślij*."
        screen: AuthForgotPassword
        api:
          - { id: auth-recover, x: 82, y: 50 }
      - title: "E-mail z kodem"
        text: "Supabase wysyła e-mail resetujący. Aplikacja korzysta tylko z kodu; nie wysyła `redirectTo`, więc schemat URL aplikacji nie musi być dozwolony w Supabase."
      - title: "Kod i nowe hasło"
        text: "Najpierw sprawdzany jest kod, który otwiera krótką sesję odzyskiwania; potem zapisuje się nowe hasło. Jeśli zapis się nie uda, *Zapisz* ponawia tylko hasło: kod jest już zużyty."
        screen: AuthResetPassword
        api:
          - { id: auth-verify-recovery, x: 86, y: 30 }
          - { id: auth-update-user, x: 86, y: 45 }
      - title: "Sprawdzenie nowego hasła"
        text: "`updateUser` zwraca 200 nawet wtedy, gdy nic się nie zapisało, dlatego aplikacja loguje się nowym hasłem, żeby to potwierdzić, a potem kończy sesję odzyskiwania."
        api:
          - { id: auth-sign-in-password }
          - { id: auth-logout }
      - title: "Hasło zmienione"
        text: "*Zaloguj się* prowadzi z powrotem do ekranu logowania."
        screen: AuthResetDone
    diagram: |
      sequenceDiagram
        actor U as Użytkownik
        participant A as Aplikacja
        participant Auth as Supabase Auth
        U->>A: E-mail, Wyślij
        A->>Auth: resetPasswordForEmail
        Auth--)U: E-mail z kodem
        A-->>U: Ekran nowego hasła
        U->>A: Kod + nowe hasło dwa razy, Zapisz
        A->>Auth: verifyOtp (recovery)
        alt zły kod
          Auth-->>A: otp_expired
          A-->>U: Nieprawidłowy kod
        else ok
          Auth-->>A: Sesja odzyskiwania
          A->>Auth: updateUser (hasło)
          A->>Auth: signInWithPassword (sprawdzenie nowego hasła)
          A->>Auth: signOut (koniec sesji odzyskiwania)
          A-->>U: Hasło zmienione, Zaloguj się
        end
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Ekran e-maila (route `/auth/forgot-password`) | `app/auth/forgot-password.tsx`, `ForgotPasswordForm.tsx` |
| Kod + hasło (route `/auth/reset-password?email=…`) | `app/auth/reset-password.tsx`, `ResetPasswordForm.tsx`, `CodeField.tsx` |
| Gotowe (route `/auth/reset-done`) | `app/auth/reset-done.tsx` |
| Wywołania i mapowanie błędów | `sendPasswordResetEmail`, `verifyRecoveryOtp`, `updatePassword` w `src/modules/auth/hooks/useAuth.ts` |
| Walidacja, długość kodu | `src/modules/auth/validation/resetPasswordSchema.ts` |

## Uwagi

- Żądanie resetu nie wysyła `redirectTo`. Dzięki temu schemat URL aplikacji nie musi być na liście dozwolonych przekierowań w Supabase (inaczej Supabase przekierowuje na `localhost:3000`).
- `updateUser` zwraca 200 nawet wtedy, gdy hasło się nie zapisało, dlatego aplikacja loguje się nowym hasłem, zanim pokaże sukces.
- Długość kodu akceptowana przez aplikację (6–10) musi zgadzać się z długością OTP ustawioną w Supabase Auth.

</FeatureView>
