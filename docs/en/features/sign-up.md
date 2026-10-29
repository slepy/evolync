---
layout: page
feature: sign-up
title: Sign up
group: account
accent: brand
icon: user-plus
order: 1
summary: "A new person creates an account. An instructor gets an organization with the first school at once, a student gets an account and joins a school with a code next."
purpose: "Lets a school owner start using Evolync without any setup by us, and lets a student create an account before they get a code from their instructor."
who:
  - role: "**I run a school**: instructor, owner"
    outcome: "Account + organization + roles + first school, then the organization dashboard"
  - role: "**I train in a school**: student"
    outcome: "Account only, then Join a school (can be skipped)"
rules:
  - "Sign up needs an internet connection."
  - "Email confirmation is turned off: the account is signed in right after it is created."
  - "Password: at least 8 characters with an uppercase letter, a lowercase letter, a digit and one of `@ $ ! % * ? &`; no other characters. Chips under the field show which rules are met. The password is typed twice."
  - "Instructor: full name (2+ characters), organization name and first school name (3+ characters each). More schools can be added later."
  - "Student: full name and phone are optional. Phone is a country prefix plus 4–15 digits."
  - "One email = one account. If the email belongs to an account an older app version left without an organization, the same password completes it with the organization instead of failing."
messages:
  - situation: "Email already registered"
    message: "This email is already registered"
  - situation: "Anything else"
    message: "Registration failed. Please try again."
screens:
  - src: /screens/sign-up/account-type.png
    caption: "Account type"
  - src: /screens/sign-up/organization.png
    caption: "I run a school: new organization"
  - src: /screens/sign-up/student.png
    caption: "I train in a school: new account"
flows:
  - id: instructor
    title: "Instructor: I run a school"
    steps:
      - title: "Account type"
        text: "*Sign up* on the sign in screen opens the choice. The instructor picks **I run a school**."
        screen: AuthRegisterType
      - title: "Account and organization"
        text: "One form: name, email, password twice, organization name and first school. Chips under the password show the rules as they are met."
        screen: AuthRegisterOrganization
      - title: "Account and organization in one go"
        text: "Sign up sends the organization and school names with the account. A database trigger creates the organization, its roles Owner / Instructor / Student and the first school inside the same transaction: if any of it fails, the account is not created either."
        api:
          - { id: auth-sign-up }
      - title: "Read the organization"
        text: "The app reads the new organization's id. When the email was taken by an account without an organization, it signs in with the same password and creates the organization with `setup_instructor_organization` instead."
        api:
          - { id: organizations-owned }
          - { id: setup-instructor-organization }
      - title: "Organization dashboard"
        text: "The session and the organization are saved on the device; the dashboard opens and the first sync runs in the background."
        screen: Main
        api:
          - { id: sync-pull, x: 86, y: 10 }
    diagram: |
      sequenceDiagram
        actor U as Instructor
        participant A as App
        participant Auth as Supabase Auth
        participant DB as Supabase DB
        participant Sync as Edge Function sync
        U->>A: Account + organization + first school, Create
        A->>Auth: signUp (email, password, names of organization and school)
        Note over Auth,DB: trigger in the same transaction:<br/>organization, roles Owner / Instructor / Student,<br/>first school
        Auth-->>A: User + session
        A->>DB: Owned organization
        DB-->>A: organization_id
        A->>A: Save session and organization on the device
        A-->>U: Organization dashboard
        A-)Sync: Pull data (in the background)
  - id: student
    title: "Student: I train in a school"
    steps:
      - title: "Account type"
        text: "The student picks **I train in a school**."
        screen: AuthRegisterType
      - title: "New account"
        text: "Only email and password are required; name and phone are optional. The card at the bottom says the school code comes next."
        screen: AuthRegisterStudent
      - title: "Create the account"
        text: "Supabase Auth creates the user with the name and phone in its metadata; the app syncs in the background."
        api:
          - { id: auth-sign-up }
          - { id: sync-pull }
      - title: "Join a school"
        text: "The app goes straight to [Join a school](./join-school). Back and Done lead to the student dashboard, never back to sign up."
        screen: JoinSchool
    diagram: |
      sequenceDiagram
        actor U as Student
        participant A as App
        participant Auth as Supabase Auth
        participant Sync as Edge Function sync
        U->>A: Email, password (name, phone optional), Create
        A->>Auth: signUp (email, password, full name, phone)
        Auth-->>A: User + session
        A-)Sync: Sync (in the background)
        A-->>U: Join a school
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Account type (route `/auth/register`) | `app/auth/register/index.tsx`, `AccountTypeOption.tsx` |
| Instructor form (route `/auth/register/instructor`) | `src/modules/auth/components/RegisterInstructorForm.tsx` |
| Student form (route `/auth/register/user`) | `src/modules/auth/components/RegisterForm.tsx` |
| Password fields and rule chips | `PasswordFields.tsx`, `PasswordRules.tsx`, `utils/passwordRules.ts` |
| Validation | `src/modules/auth/validation/registerSchema.ts` |
| Instructor sign up | `hooks/useRegisterInstructor.ts`, `services/registerInstructor.ts`, `services/instructorSignUp.ts` |
| Student sign up | `hooks/useRegister.ts`, `services/register.ts` |
| Organization setup (SQL) | trigger `handle_new_user_signup` in `supabase/migrations/20261026000100_instructor_signup_in_one_transaction.sql`; `setup_instructor_organization` for accounts left without one |

## Data

- `full_name` (and `phone_number` for a student; `organization_name`, `school_name` for an instructor) go to the user metadata in Supabase Auth.
- The instructor's organization is saved on the device under `organization`, so the app starts on the organization dashboard also offline.

## Notes

- **One transaction.** The instructor's organization is created by the `on_auth_user_created` trigger in the `auth.users` insert, so sign up either fully succeeds or leaves nothing behind. Accounts left without an organization by older app versions are completed on the next sign up attempt with the same password.
- **Validation messages follow the language.** The schemas are built with `localizedSchema` when the form is shown, and errors already on screen are checked again after a language change.

</FeatureView>
