---
name: dirty-flag
description: Guide for implementing the one-way dirty flag pattern — showing the save PrimaryButton only when the user has made changes. Use when adding or editing edit screens with a conditional save button.
---

# Dirty Flag — warunkowy przycisk zapisu

## Zasada

`PrimaryButton` zapisu (w `footer` `SubScreenPage`) na ekranach **edit** pojawia się **tylko gdy użytkownik coś zmienił**.  
Flaga jest **jednorazowa** — raz ustawiona na `true` zostaje `true` aż do zapisu, nawet jeśli użytkownik cofnął zmiany.

Ekrany **create** — przycisk zawsze widoczny (lub gdy formularz jest poprawnie wypełniony).

---

## Hook `useDirtyFlag`

Lokalizacja: `src/core/hooks/useDirtyFlag.ts`  
Eksport: `src/core/hooks/index.ts`

```ts
import { useState, useCallback } from "react";

export function useDirtyFlag() {
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = useCallback(() => setIsDirty(true), []);
  const reset = useCallback(() => setIsDirty(false), []);
  return { isDirty, markDirty, reset };
}
```

---

## Przypadek A — ekran z komponentem formularza (`forwardRef` + RHF)

Używany gdy formularz jest wydzielonym komponentem (`EventForm`, `ProfileForm`, `ProductForm`, `StudentForm`, `SchoolSettingsForm`).

### W komponencie formularza — dodać prop `onDirtyChange`

```ts
interface Props {
  onDirtyChange?: (dirty: boolean) => void;
  // ...reszta propsów
}

export const EventForm = forwardRef<EventFormHandle, Props>(
  ({ onDirtyChange, ... }, ref) => {
    const { formState: { isDirty } } = useForm(...)

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty]);

    // ...
  }
);
```

### W ekranie-rodzicu

```ts
import { useDirtyFlag } from "@/core/hooks";

const { isDirty, markDirty, reset } = useDirtyFlag();

// JSX (w `SubScreenPage`):
<EventForm
  ref={formRef}
  onDirtyChange={(dirty) => { if (dirty) markDirty(); }}
  ...
/>

// prop `SubScreenPage`:
footer={
  isDirty ? (
    <PrimaryButton
      label={t("save")}
      onPress={() => { formRef.current?.submit(); reset(); }}
      loading={isLoading}
    />
  ) : undefined
}
```

> `onDirtyChange` z RHF jest **dwukierunkowe** (wraca do `false` gdy user cofa zmiany).  
> Dlatego w ekranie używamy `if (dirty) markDirty()` — ignorujemy sygnał `false`, flaga zostaje `true`.

---

## Przypadek B — ekran z custom `useState` (bez RHF)

Używany gdy ekran sam zarządza stanem (`localRows`, `cartItems`, `title` itp.).

```ts
const { isDirty, markDirty, reset } = useDirtyFlag();

// Wywołać markDirty() w każdym handlerze zmiany stanu:
const handleChangeText = (id: string, field: string, value: string) => {
  markDirty();
  setLocalRows((prev) => prev.map(...));
};

const handleAddRow = async () => {
  markDirty();
  // ...
};

const handleSave = async () => {
  await saveEverything();
  reset(); // chowa przycisk po zapisie
};

// JSX (prop `SubScreenPage`):
footer={
  isDirty ? <PrimaryButton label={t("save")} onPress={handleSave} loading={isSaving} /> : undefined
}
```

---

## Ekrany które stosują ten wzorzec

| Ekran | Przypadek |
| --- | --- |
| `app/user/profile.tsx` | A — `ProfileForm` |
| `app/organization/events/[eventId]/edit.tsx` | A — `EventForm` |
| `app/organization/inventory/[productId]/edit.tsx` | A — `ProductForm` |
| `app/school/[schoolId]/settings.tsx` | A — `SchoolSettingsForm` |
| `app/school/[schoolId]/students/[studentId]/edit.tsx` | A — `StudentForm` |
| `app/techniques/notes/[documentId]/index.tsx` | B — custom useState |
| `app/school/[schoolId]/orders/[orderId].tsx` | B — custom useState |
| `app/user/orders/[orderId].tsx` | B — custom useState |
| `app/school/[schoolId]/students/[studentId]/index.tsx` | B — custom useState |

---

## Czego NIE robić

- ❌ `setInterval` polling `formRef.current.isDirty` — nieefektywne, dwukierunkowe
- ❌ `useMemo` porównujący aktualny stan z pierwotnym — dwukierunkowe (chowa przycisk gdy user cofnie zmiany)
- ❌ przycisk zapisu zawsze widoczny na ekranach edit
