# i18n - Internationalization

This directory contains the internationalization (i18n) configuration for the Evolync application.

## Supported Languages

- **English (en)** - Default language
- **Polish (pl)** - Polski

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
  if (!email) throw new Error(t('emailRequired'));
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
import { useTranslation } from '@/modules/core';

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
import { changeLanguage } from '@/core/i18n';

// Change to Polish
await changeLanguage('pl');

// Change to English
await changeLanguage('en');
```

### Using the Language Switcher Component

```typescript
import { LanguageSwitcher } from '@/core/i18n';

function SettingsScreen() {
  return (
    <View>
      {/* Horizontal buttons */}
      <LanguageSwitcher variant="buttons" />

      {/* Vertical list */}
      <LanguageSwitcher variant="list" />
    </View>
  );
}
```

### Getting Current Language

```typescript
import { getCurrentLanguage, getAvailableLanguages } from '@/core/i18n';

const currentLang = getCurrentLanguage(); // 'en' or 'pl'
const languages = getAvailableLanguages(); // [{ code: 'en', label: 'English' }, { code: 'pl', label: 'Polski' }]
```

## Translation Files

Translation files are located in `src/core/i18n/locales/`:

- `en.json` - English translations
- `pl.json` - Polish translations

### Translation Structure

Translations use a **flat structure** - all keys are at the root level:

```json
{
  "appName": "Evolync",
  "save": "Save",
  "signIn": "Sign In",
  "email": "Email",
  "password": "Password",
  "errorInvalidCredentials": "Invalid login credentials",
  "tabOne": "Tab One",
  "language": "Language"
}
```

**Naming Convention:**

- Simple keys for common words: `save`, `cancel`, `email`
- Prefixed keys for specific contexts: `errorInvalidCredentials`, `tabOne`
- Keep keys descriptive and self-documenting

## Adding New Translations

1. Add the translation key to both `en.json` and `pl.json`
2. Use descriptive, hierarchical keys (e.g., `feature.action` or `feature.element`)
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
2. **Use descriptive keys** - Keys should be self-documenting (e.g., `emailRequired` not `err1`)
3. **Flat structure** - Use simple keys like `save` or prefixed keys like `errorNetworkError`
4. **Keep translations atomic** - Each key should represent a single piece of text
5. **Use interpolation** - For dynamic content, use `{{variable}}` syntax
6. **Test both languages** - Ensure UI looks good in both English and Polish
7. **Consider text length** - Polish text is often longer than English

## Offline Support

Language preferences are stored locally using AsyncStorage and work offline. The selected language persists across app restarts.

## Adding a New Language

To add support for a new language:

1. Create a new translation file: `src/core/i18n/locales/[lang].json`
2. Copy the structure from `en.json` and translate all keys
3. Update `src/core/i18n/config.ts`:
   - Import the new language file
   - Add it to the `resources` object
   - Update `getDeviceLanguage()` if needed
   - Update `getAvailableLanguages()` to include the new language
4. Update the `LanguageCode` type in `src/core/i18n/types.ts`
5. Update the `changeLanguage` function signature if needed
