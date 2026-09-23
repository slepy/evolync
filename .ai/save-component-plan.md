# Plan ujednolicenia przycisku zapisu

## Zasada

Przycisk zapisu pojawia się tylko gdy użytkownik **cokolwiek zmienił** w formularzu.  
`hasChanges` to **flaga jednorazowa** — raz ustawiona na `true`, zostaje `true` aż do zapisu.  
Nie interesuje nas czy użytkownik cofnął zmiany do stanu pierwotnego.

## Krok 1 — nowy hook `useDirtyFlag`

**Plik:** `src/modules/core/hooks/useDirtyFlag.ts`

```ts
export function useDirtyFlag() {
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = useCallback(() => setIsDirty(true), []);
  const reset = useCallback(() => setIsDirty(false), []);
  return { isDirty, markDirty, reset };
}
```

Wyeksportować z `src/modules/core/hooks/index.ts`.

---

## Krok 2 — ekrany z formularzami opartymi na `forwardRef` + RHF

Te ekrany używają komponentów formularza (`EventForm`, `ProfileForm` itd.) przez ref.  
Polling `setInterval` → zastąpić prop `onDirtyChange`.

### Zmiana w komponentach formularza

Dodać prop `onDirtyChange?: (dirty: boolean) => void` i wywołać go gdy `isDirty` z RHF się zmieni:

```ts
// wewnątrz komponentu formularza
const { formState: { isDirty } } = useForm(...)

useEffect(() => {
  onDirtyChange?.(isDirty);
}, [isDirty]);
```

**Dotyczy komponentów:**

- `src/modules/events/components/EventForm.tsx`
- `src/modules/auth/components/ProfileForm.tsx`
- `src/modules/inventory/components/ProductForm.tsx`
- `src/modules/students/components/StudentForm.tsx`
- `src/modules/school/components/SchoolSettingsForm.tsx`

### Zmiana w ekranach

Usunąć `setInterval`, dodać `useDirtyFlag`, podpiąć `onDirtyChange={markDirty}`:

```ts
const { isDirty, markDirty, reset } = useDirtyFlag();

// w JSX formularza:
<EventForm ref={formRef} onDirtyChange={markDirty} ... />

// przycisk:
{isDirty && <SubmitComponent onPress={() => { formRef.current?.submit(); reset(); }} ... />}
```

**Dotyczy ekranów:**

| Ekran                                                 | Problem                                    |
| ----------------------------------------------------- | ------------------------------------------ |
| `app/user/profile.tsx`                                | polling `setInterval` → `onDirtyChange`    |
| `app/organization/events/[eventId]/edit.tsx`          | polling `setInterval` → `onDirtyChange`    |
| `app/organization/inventory/[productId]/edit.tsx`     | przycisk zawsze widoczny → `onDirtyChange` |
| `app/school/[schoolId]/settings.tsx`                  | przycisk zawsze widoczny → `onDirtyChange` |
| `app/school/[schoolId]/students/[studentId]/edit.tsx` | przycisk zawsze widoczny → `onDirtyChange` |

---

## Krok 3 — ekrany z custom `useState`

Tu nie ma RHF. `markDirty()` wywoływać bezpośrednio w handlerach zmiany stanu.

### `app/techniques/notes/[documentId]/index.tsx`

- Dodać `useDirtyFlag()`
- Wywołać `markDirty()` w: `handleDirectionToggle`, `handleDeleteRow`, `handleChangeText`, `handleAddRow`, `setTitle`
- Po `handleSave` wywołać `reset()`
- `<SubmitComponent>` owrapować w `{isDirty && ...}`

### `app/school/[schoolId]/orders/[orderId].tsx`

- Obecne `hasChanges` to dwukierunkowe porównanie — zastąpić `useDirtyFlag()`
- `markDirty()` w: `handleStatusChange`, `handleUpdateProductItems`, `handleRemoveItem`
- Po `handleSaveChanges` wywołać `reset()`

### `app/user/orders/[orderId].tsx`

- Analogicznie jak wyżej
- `markDirty()` w: `handleUpdateProductItems`, `handleRemoveItem`
- Po `handleSaveChanges` wywołać `reset()`

### `app/school/[schoolId]/students/[studentId]/index.tsx`

- Ten ekran agreguje `hasChanges` z wielu hooków (`useStudentEventStatuses` itp.)
- Nie zmieniać hooków — zamiast tego dodać `useDirtyFlag()` na poziomie ekranu
- `markDirty()` wywoływać gdy którykolwiek z hooków zwróci `hasChanges: true` (w `useEffect`)
- Po zapisie `reset()`

---

## Kolejność implementacji

1. `useDirtyFlag` hook
2. `profile.tsx` + `ProfileForm` (najprostszy przypadek)
3. `events/[eventId]/edit.tsx` + `EventForm`
4. `inventory/[productId]/edit.tsx` + `ProductForm`
5. `settings.tsx` + `SchoolSettingsForm`
6. `students/[studentId]/edit.tsx` + `StudentForm`
7. `notes/[documentId]/index.tsx`
8. `orders/[orderId].tsx` (school)
9. `orders/[orderId].tsx` (user)
10. `students/[studentId]/index.tsx`
