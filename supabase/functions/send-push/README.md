# send-push

Delivers each new row in `public.notifications` as an Expo push message.
The in-app inbox works without any of this; push is an add-on.

## Flow

`notifications` INSERT → `on_notifications_dispatch_push` trigger → `pg_net`
POST (after commit) → `send-push` → Expo Push API → device.

## One-time setup per environment

1. **Function secrets** (Dashboard → Edge Functions → Secrets, or CLI):
   - `SEND_PUSH_SECRET` — a long random string shared with the database.
   - `EXPO_ACCESS_TOKEN` — only if "Enhanced push security" is enabled for the Expo project.
2. **Deploy** — `supabase functions deploy send-push` (JWT verification is off in
   `supabase/config.toml`; the function checks `x-send-push-secret` instead).
3. **Vault secrets** (SQL editor):
   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/send-push', 'send_push_url');
   select vault.create_secret('<SEND_PUSH_SECRET value>', 'send_push_secret');
   ```
   Until both exist the trigger does nothing.
4. **Push credentials** (EAS): FCM v1 service account for Android
   (`eas credentials`, plus `google-services.json` — `app.config.js` picks up the
   `GOOGLE_SERVICES_JSON` EAS file variable, e.g.
   `eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json`,
   or a local `./google-services.json`)
   and an APNs key for iOS. Then build a new dev client / store build — the
   `expo-notifications` native module is not in older builds.

## Behaviour

- Tokens come from `push_tokens` (`enabled`, not deleted) for the recipient.
- Text is rendered per token locale (`en`/`pl`) from `templates.ts`; keep it in
  line with the `notification*` keys in `src/core/i18n/locales`.
- More than 3 notifications for one recipient within 60 s: the 4th sends one
  "You have N+ new notifications" push, later ones in the window are skipped.
- Messages go out with `priority: "high"` on the `notifications` Android channel
  (HIGH importance, created by the app): normal-priority FCM messages are held
  back while the device dozes, and a DEFAULT channel shows no heads-up banner.
- No push for the actor: a payment added by the instructor notifies the
  student, and only a student with an account (`school_members.user_id`).
- Signing out disables the device's token, and the next sign-in moves it to
  the new account. Testing with two accounts on one phone therefore never
  pushes to the signed-out one (it still gets the inbox row): keep the
  recipient signed in on a second device.
- `DeviceNotRegistered` tickets soft-delete the token.
- Any failure is logged and answered with 200 so the webhook never retries.

## Tests

`supabase/functions/run-deno-tests.sh` (Deno, mocked fetch) and
`supabase/tests/run-sql-tests.sh` (trigger dispatch, disposable Postgres).
