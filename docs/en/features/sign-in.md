---
layout: page
feature: sign-in
title: Sign in
group: account
accent: brand
icon: log-in
order: 2
summary: "Instructors and students sign in with email and password. After the first sign in the app opens on its own, also offline."
purpose: "Gives a person access to their schools, students and technique notes. One account serves both roles: what the person sees after signing in depends on whether they own an organization."
who:
  - role: "Instructor (organization owner)"
    outcome: "Organization dashboard"
  - role: "Student, or account without a school yet"
    outcome: "Student dashboard"
rules:
  - "The **first** sign in needs an internet connection. Without one the app shows *No internet connection* and does not try."
  - "After that the session stays on the device. When the app starts it signs the person in by itself, **even offline and with an expired token**: data is read from the local database and the session is refreshed once the device is back online."
  - "If the token has expired and cannot be refreshed online, the person signs in again (*Your session has expired*)."
  - "The interface language is picked in the corner of the screen and is kept on the device only."
  - "Google sign in is implemented in the code, but the sign in screen has **no Google button** today."
messages:
  - situation: "Wrong email or password"
    title: "Wrong email or password"
    message: "Check both and try again. Signing in needs an internet connection the first time."
  - situation: "No connection"
    title: "Connection error"
    message: "No internet connection. Connect to a network and try again."
  - situation: "Too many attempts"
    title: "Too many attempts"
    message: "Too many login attempts. Try again in a few minutes."
  - situation: "Session could not be refreshed"
    message: "Your session has expired. Please log in again."
  - situation: "Anything else"
    title: "An error occurred"
    message: "An unexpected error occurred. Try again or contact support."
screens:
  - src: /screens/sign-in/form.png
    caption: "Sign in"
  - src: /screens/sign-in/wrong-credentials.png
    caption: "Wrong email or password"
api: [auth-google]
flows:
  - id: email
    title: "Sign in with email"
    steps:
      - title: "Email and password"
        text: "The person types their email and password. The language picker sits in the corner; *Forgot password?* and *Sign up* lead to the other flows."
        screen: AuthLogin
      - title: "Sign in"
        text: "The app checks the network first: offline it shows *No internet connection* and stops. Online it signs in at Supabase Auth and saves the session in SecureStore."
        screen: AuthLogin
        api:
          - { id: auth-sign-in-password, x: 80, y: 68 }
      - title: "Wrong email or password"
        text: "Supabase answers `invalid_credentials`. The banner says what went wrong and the password field turns red. Too many attempts and network errors get their own message."
        screen: AuthLoginError
        api:
          - { id: auth-sign-in-password, x: 86, y: 43 }
      - title: "Who is signing in"
        text: "Straight from Supabase tables: does the person own an organization, and which schools are they an active member of. Both answers are cached on the device for offline starts."
        api:
          - { id: organizations-owned }
          - { id: school-members-active }
      - title: "Data sync"
        text: "The app pulls the person's data into the local database in the background. The launch screen shows the progress."
        screen: LaunchLoading
        api:
          - { id: sync-pull, x: 72, y: 86 }
      - title: "Dashboard"
        text: "An organization owner lands on the **organization dashboard**, everyone else on the **student dashboard**."
        screen: Main
    diagram: |
      sequenceDiagram
        actor U as User
        participant A as App
        participant Auth as Supabase Auth
        participant DB as Supabase DB
        participant Sync as Edge Function sync
        U->>A: Email + password, Sign in
        A->>A: Network check
        alt offline
          A-->>U: No internet connection
        else online
          A->>Auth: signInWithPassword
          alt wrong credentials
            Auth-->>A: invalid_credentials
            A-->>U: Wrong email or password
          else success
            Auth-->>A: Session (JWT)
            A->>A: Save session on the device
            A->>DB: Owns an organization?
            A->>DB: Active school memberships
            A-)Sync: Pull data (in the background)
            A-->>U: Dashboard
          end
        end
  - id: startup
    title: "App start: automatic sign in"
    steps:
      - title: "Session on the device"
        text: "On every start the app looks for a saved session. Without one it opens the sign in screen."
        screen: LaunchLoading
      - title: "Expired token, online"
        text: "An expired access token is refreshed with the refresh token. If that fails, the saved data is cleared and the person signs in again (*Your session has expired*)."
        api:
          - { id: auth-refresh }
      - title: "Offline"
        text: "Offline the app keeps the saved session, **even an expired one**, and works on the local database. Nothing is sent until the device is back online."
        screen: LaunchLoadingOffline
      - title: "Context and sync"
        text: "Online the app reloads the organization and the memberships, then syncs in the background."
        screen: LaunchLoading
        api:
          - { id: organizations-owned }
          - { id: school-members-active }
          - { id: sync-pull, x: 72, y: 86 }
      - title: "Dashboard"
        text: "The person is on their dashboard without typing anything."
        screen: Student
    diagram: |
      flowchart TD
        start([App starts]) --> stored{Session saved<br/>on the device?}
        stored -- no --> login[Sign in screen]
        stored -- yes --> expired{Token expired?}
        expired -- no --> online1{Online?}
        online1 -- no --> ctx[Load organization and<br/>schools from the device]
        online1 -- yes --> check{Session still valid<br/>at Supabase?}
        check -- no --> clear[Clear saved data] --> login
        check -- yes --> ctx
        expired -- yes --> online2{Online?}
        online2 -- no --> ctx
        online2 -- yes --> refresh{Refresh token}
        refresh -- failed --> expiredMsg[Session expired message] --> login
        refresh -- ok --> ctx
        ctx --> sync[Sync in the background<br/>only when online]
        sync --> route{Owns an organization?}
        route -- yes --> org[Organization dashboard]
        route -- no --> user[Student dashboard]
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Screen (route `/auth/login`) | `app/auth/login.tsx` |
| Form, error banner | `src/modules/auth/components/LoginForm.tsx` |
| Validation | `src/modules/auth/validation/loginSchema.ts` |
| Sign in, auto sign in, sign out | `src/modules/auth/hooks/useAuth.ts` |
| Google return (route `/auth/callback`) | `app/auth/callback.tsx` |
| Choice of dashboard (route `/`) | `app/index.tsx` |
| Session storage | `src/modules/auth/services/secureStorage.ts` |
| Data sync | `src/database/sync.ts` |

While the session is being checked every launch route shows `LaunchScreen`, never a spinner.

## Stored on the device

Native: Expo SecureStore. Web: AsyncStorage.

| Key | Content |
| --- | --- |
| `session` | Supabase session (tokens, user) |
| `organization` | Owned organization `{ id, owner_id, name }` |
| `schoolMemberships` | Active school memberships |
| `activeMembershipId` | School chosen in the context switcher |

## Error mapping

`mapSupabaseError` in `useAuth.ts` turns Supabase errors into `invalid_credentials`, `too_many_requests`, `network_error` or `unknown`; `LoginForm` picks the banner title from that code.

## Notes

- The organization and membership reads go straight to Supabase tables, outside the sync. They run only online and the result is cached for offline starts.
- Signing in with an expired token offline relies on the local database only; nothing is sent until the token is refreshed.
- Google sign in (`useAuth.signInWithGoogle`, `app/auth/callback.tsx`) works in code, but no screen offers it.

</FeatureView>
