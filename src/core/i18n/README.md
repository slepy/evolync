# i18n - Internationalization

This directory contains the internationalization (i18n) configuration for the Evolync application.

## Supported Languages

- **English (en)** - Default language (always, until the user picks another one)
- **Polish (pl)** - Polski
- **Hungarian (hu)** - Magyar

## Setup

The i18n system is automatically initialized when the app starts in [app/_layout.tsx](../../../app/_layout.tsx). The initialization:

1. Checks for a previously saved language preference in AsyncStorage
2. Falls back to device language if no preference is found
3. Defaults to English if the device language is not supported

## Usage

### Method 1: Global Function `t()` - NO IMPORT NEEDED! ⭐

After app initialization, `t()` is available globally everywhere without any imports:

```typescript
function MyComponent() {
  return (
    <View>
      <Text>{t('appName')}</Text>
      <Text>{t('signIn')}</Text>
      <Button title={t('save')} />
      <Button title={t('cancel')} />
    </View>
  );
}

// Works in utility functions too!
function validateEmail(email: string) {
  if (!email) throw new Error(t('required'));
}

// Works in alerts
Alert.alert(t('error'), t('networkError'));

// With interpolation
<Text>{t('lastSynced', { time: '5 min ago' })}</Text>
```

**Pros:**

- ✅ No imports needed - just use `t()` anywhere
- ✅ Works everywhere (components, utilities, functions)
- ✅ Clean and simple syntax
- ✅ Consistent across entire codebase

**Cons:**

- ⚠️ Components WON'T re-render when language changes
- ⚠️ Only suitable for static text or components that re-render for other reasons

### Method 2: useTranslation Hook (REACTIVE) 🔄

For components that need to update when language changes:

```typescript
import { useTranslation } from '@/core/hooks';

function LanguageAwareComponent() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('appName')}</Text>
      <LanguageSwitcher /> {/* Language switcher in same component */}
    </View>
  );
}
```

**Use this when:**

- Component has a language switcher
- Component must update immediately when language changes
- Building settings or profile screens

### Which Method to Use?

| Scenario | Recommended Method |
|----------|-------------------|
| 90% of all cases | **Global `t()`** (no import) |
| Simple components | **Global `t()`** (no import) |
| Utility functions, validation | **Global `t()`** (no import) |
| Alert/Toast messages | **Global `t()`** (no import) |
| Forms that re-render on input | **Global `t()`** (no import) |
| Settings/Profile with language switcher | **`useTranslation()` hook** |

**Summary:** Use global `t()` everywhere. Only use `useTranslation()` hook in components with language switchers.

### Using Interpolation

Translations support variable interpolation:

```typescript
// Translation key: "Last synced: {{time}}"
<Text>{t('lastSynced', { time: '2 minutes ago' })}</Text>

// Multiple parameters
<Text>{t('welcome', { name: 'John', role: 'Instructor' })}</Text>
```

### Changing Language

```typescript
import { changeLanguage } from '@/core/i18n/config';

// Change to Polish / Hungarian
await changeLanguage('pl');
await changeLanguage('hu');

// Change to English
await changeLanguage('en');
```

### Using the Language Switcher Component

```typescript
import { LanguageSwitcher } from '@/core/components';

// The Language card of the Settings tab (17A): English / Polski / Magyar radio rows.
function SettingsScreen() {
  return (
    <View>
      <LanguageSwitcher />
    </View>
  );
}
```

On the sign in screen the language is picked from the corner pill
(`LanguagePicker`, short code "EN" / "PL" / "HU", sheet with the list):
`<AuthPage corner={<LanguagePicker />}>`.

### Getting Current Language

```typescript
import { getCurrentLanguage, getAvailableLanguages } from '@/core/i18n/config';

const currentLang = getCurrentLanguage(); // 'en', 'pl' or 'hu'
const languages = getAvailableLanguages(); // [{ code: 'en', label: 'English', short: 'EN' }, …]
```

## Translation Files

Translation files are located in `src/core/i18n/locales/`:

- `en.json` - English translations
- `pl.json` - Polish translations
- `hu.json` - Hungarian translations

### Translation Structure

Translations use a **flat structure** - all keys are at the root level:

```json
{
  "appName": "Evolync",
  "save": "Save",
  "email": "Email",
  "password": "Password",
  "errorInvalidCredentialsMessage": "Invalid email or password.",
  "eventsCreateTitle": "New event",
  "language": "Language"
}
```

**Naming Convention:**

- **One key per shared word.** A word or message that reads the same everywhere
  has one simple key used by every module: `save`, `cancel`, `delete`, `edit`,
  `all`, `start`, `end`, `from`, `student`, `organization`, `actions`, `manage`,
  `restore`, `archive`, `yesterday`, `nameRequired`, `titleRequired`,
  `chooseType`, `currencyRequired`, `notesTooLong`, `locationOptional`. Never add
  `ordersSave` / `trainingsActions` copies.
- Module prefix only when the text belongs to that screen: `eventsCreateTitle`,
  `trainingsCancel` ("Cancel" a training — "Odwołaj" in Polish, not "Anuluj").
- If two keys would have the same text in every language, they are one key.
- Keep keys descriptive and self-documenting

## Adding New Translations

1. Search the locales for an existing key with the same text first and reuse it
2. Add the translation key to `en.json`, `pl.json` and `hu.json` (`usedKeys.test.ts` checks all three)
3. Keep translations consistent across languages
4. Test both languages to ensure proper display

### Example

```json
// en.json
{
  "myFeatureTitle": "My Feature",
  "myFeatureDescription": "This is my feature description"
}

// pl.json
{
  "myFeatureTitle": "Moja funkcja",
  "myFeatureDescription": "To jest opis mojej funkcji"
}
```

## Type Safety

TypeScript types are automatically generated from the English translation file. This provides autocomplete and type checking for translation keys:

```typescript
// This will show autocomplete for all available keys
t('save')  // ✅ Valid
t('invalidKey')   // ❌ TypeScript error
```

## Best Practices

1. **Always use translation keys** - Never hardcode user-facing text
2. **Use descriptive keys** - Keys should be self-documenting (e.g., `amountRequired` not `err1`)
3. **Flat structure** - Use simple keys like `save` or prefixed keys like `errorNetworkError`
4. **Keep translations atomic** - Each key should represent a single piece of text
5. **Use interpolation** - For dynamic content, use `{{variable}}` syntax
6. **Test every language** - Ensure UI looks good in English, Polish and Hungarian
7. **Consider text length** - Polish and Hungarian text is often longer than English
8. **Format dates and numbers with `localeTags`** - `intlLocaleTag(language)` / `dateFnsLocale(language)`, never `language === "pl" ? …`

## Offline Support

The chosen language is stored only on the device (AsyncStorage, `@evolync:language`), never in the database. It persists across app restarts and is applied before the splash screen hides (`languageReady`). Without a stored choice the app starts in English, whatever the device language.

## Adding a New Language

To add support for a new language:

1. Create a new translation file: `src/core/i18n/locales/[lang].json`
2. Copy the structure from `en.json` and translate all keys
3. Update `src/core/i18n/config.ts`:
   - Import the new language file
   - Add it to the `resources` object
   - Add it to `LANGUAGES` (code, own-language label, short code)
4. Update the `LanguageCode` type in `src/core/i18n/types.ts`
5. Add it to `src/core/i18n/localeTags.ts` (Intl tag, date-fns locale) and to `usedKeys.test.ts`
6. Push text: `toPushLocale` (notifications), `supabase/functions/send-push/templates.ts`, and the `push_tokens.locale` check + `register_push_token` in a migration
