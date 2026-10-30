---
layout: page
feature: profile
title: Profile and settings
group: account
accent: brand
icon: sliders
order: 6
summary: "The Profile tab (photo, full name, phone, the locked sign-in email, Log out) and the Settings tab (push on this device, language, Join a school), for every role."
purpose: "The few things every user sets about themselves, in the same place whatever their role."
who:
  - role: "Every signed-in user"
    outcome: "Changes their photo, name and phone, the app language and push, signs out"
rules:
  - "**Profile**: PHOTO, FULL NAME, PHONE (optional, with a country prefix) and the sign-in EMAIL, which cannot be changed in the app."
  - "*Save* replaces the bottom bar after the first change. The photo is uploaded to the `avatars` bucket, then the name, phone and photo are saved in the account (Supabase Auth). Saving needs a connection."
  - "The database copies the name, photo and phone to every school membership of the user, so instructors see the new data after the next sync."
  - "*Log out* asks first and signs out on this device only."
  - "**Settings**: *Push notifications* for this device (see [Notifications](./notifications)), the **language** (English, Polski, Magyar; stored only on the device, never in the database) and *Join a school*."
messages:
  - situation: "Photo upload failed"
    message: "Failed to upload avatar. Please check your connection and try again."
  - situation: "Under the email"
    message: "The sign-in email can't be changed in the app."
  - situation: "Log out"
    title: "Log out?"
    message: "You can sign in again with your email and password."
flows:
  - id: profile
    title: "Profile"
    steps:
      - title: "Profile"
        text: "Photo, *Personal info* (full name, phone), *Sign-in* (locked email), *Log out*."
        screen: Profile
      - title: "Save"
        text: "After a change *Save* takes the place of the bottom bar: photo upload, account update, then a sync."
        screen: ProfileEdited
        api:
          - { id: storage-upload, x: 50, y: 15 }
          - { id: auth-update-user, x: 50, y: 92 }
  - id: settings
    title: "Settings"
    steps:
      - title: "Settings"
        text: "Push for this device, language (changes the app at once), and *Join a school*."
        screen: NotificationsSettings
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Profile tab (route `/user/profile`) | `app/user/profile.tsx`, `src/modules/auth/components/ProfileScreen.tsx`, `utils/profileValues.ts`, `validation/profileSchema.ts` |
| Settings tab (route `/user/settings`) | `app/user/settings.tsx`, `PushNotificationsSetting`, `LanguageSwitcher` |
| Copy of the profile to memberships | trigger `sync_user_profile_to_members` (`supabase/migrations/20260219100000_sync_user_profile_to_school_members.sql`, phone added in `20260302000000`) |
| Language | `src/core/i18n/` (AsyncStorage) |

## Notes

- The Settings board also shows *Appearance* (System / Light / Dark); the app has no such setting, it is always dark.

</FeatureView>
