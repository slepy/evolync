## Plan: Opisowy Notatnik Technik

Nowy moduł `techniques` zastąpi obecny moduł `threed` jako punkt wejścia do notatnika technik. Wewnątrz modułu `techniques` znajdą się dwa submoduły: `threed` (przeniesiony z obecnego `src/modules/threed` i `app/threed`) oraz `notes` (nowy moduł opisowych notatek). Użytkownik po wejściu wybiera tryb `3D` albo `opisowo`. Moduł opisowy jest prywatny, user-owned i niezależny od modułu 3D.

**Steps**

1. Faza 1 — Ustalenie struktury modułu i routingu. Utworzyć nowy moduł `src/modules/techniques` jako rodzic dla submodułów `threed` i `notes`. Przenieść obecny `src/modules/threed` do `src/modules/techniques/threed` (lub pozostawić jako alias z re-eksportem). Zmienić routing: `app/threed/` staje się `app/techniques/`, a nowy plik `app/techniques/index.tsx` staje się ekranem wyboru trybu. Zaktualizować wszystkie importy i nawigację z dashboardu (`app/user/dashboard.tsx`). Ta faza blokuje dalsze prace ekranowe.
2. Faza 2 — Zdefiniować nowy byt domenowy dla opisowych dokumentów notatek jako osobny, prywatny rekord user-owned. Nowy model: `technique_note_documents` z polami `user_id`, `title`, `description` (opcjonalne), `created_at`, `updated_at`, `deleted_at`. Bez pola `mode` — moduł jest dedykowany wyłącznie trybowi opisowemu. Nie wiązać z `techniques` ani `sequences`.
3. Faza 3 — Dodać model wiersza dokumentu opisowego: `technique_note_rows` z polami `document_id` (indexed), `order_index`, `person_1_text`, `person_2_text`, `attack_direction` (string: `"1->2"` albo `"2->1"`), `separator_before` (boolean, opcjonalne — steruje wizualnym odstępem nad wierszem), `created_at`, `updated_at`, `deleted_at`. Pole `deleted_at` wymagane do soft delete analogicznie do reszty codebase — zawsze filtrować `Q.where("deleted_at", null)`. Ta faza zależy od kroku 2.
4. Faza 4 — Dodać WatermelonDB schema, model(e), migracje lokalne i migrację Supabase dla nowych tabel. Wymagane miejsca do aktualizacji: (a) `src/modules/techniques/notes/database/schema.ts` — definicja tabel modułu, (b) `src/database/schema.ts` — centralna agregacja schematów, dodać nowe tabele, (c) `src/database/migrations.ts` — inkrementacja `toVersion` z krokami `createTable` dla obu tabel, (d) `supabase/migrations/` — nowa migracja SQL dla Supabase. Po dodaniu tabel zaktualizować funkcję `sync()` jeśli wymaga rejestracji nowych tabel. Repozytoria robią CRUD i `observe`, serwisy wywołują `sync().catch(console.error)` po mutacjach. Ta faza zależy od kroków 2-3.
5. Faza 5 — Utworzyć nowy moduł `src/modules/techniques/notes` zgodnie z konwencją: `components`, `hooks`, `repositories`, `services`, `types`, `validation`, `database`, `index.ts`. Logika opisowego notatnika jest całkowicie oddzielona od logiki 3D. Ta faza może ruszyć równolegle z końcówką kroku 4 po ustaleniu nazw tabel i DTO.
6. Faza 6 — Zbudować ekran startowy notatnika technik `app/techniques/index.tsx` z wyborem trybu `3D` albo `opisowo`. Dla `3D` przekierowanie do `app/techniques/threed/` (obecny flow po przeniesieniu). Dla `opisowo` przejście do `app/techniques/notes/`. Ta faza zależy od kroku 1 i może być prowadzona równolegle z krokiem 5.
7. Faza 7 — Zbudować listę dokumentów opisowych `app/techniques/notes/index.tsx`: pusty stan, lista rekordów z użyciem `BaseCard` z `@/modules/core/components` dla każdej pozycji listy, przycisk dodania, wejście w detal dokumentu. Przy tworzeniu nowego dokumentu pokazać formularz z tytułem (opcjonalnie opisem), po zapisie automatycznie utworzyć pusty pierwszy wiersz i przejść do edytora. Ta faza zależy od kroków 4-6.
8. Faza 8 — Zbudować edytor dokumentu opisowego `app/techniques/notes/[documentId]/index.tsx`. Każdy wiersz ma 2 kolumny `Osoba 1` i `Osoba 2`, pośrodku strzałkę kierunku ataku (`1 -> 2` albo `2 -> 1`) z przyciskiem odwrócenia, oraz mały przycisk `+` na końcu listy do dodania kolejnego wiersza. Nowe wiersze dopisywane na końcu z `separator_before: true`. Na MVP bez drag-and-drop i bez ręcznej zmiany kolejności. Ta faza zależy od kroków 3-7.
9. Faza 9 — Dopracować zachowanie separatora. Wiersz z `separator_before: true` renderuje zwiększony odstęp lub cienką linię powyżej. Separator jest wyłącznie wizualny — bez semantyki biznesowej. Ta faza zależy od kroku 8.
10. Faza 10 — Dodać tłumaczenia, puste stany, walidację i podstawową obsługę błędów. Przed dodaniem nowych kluczy sprawdzić duplikaty w `en.json` i `pl.json`. Dodać klucze do obu plików jednocześnie. Ta faza jest równoległa z krokami 7-9 po ustaleniu copy.
11. Faza 11 — Zaktualizować integrację z dashboardem. Kafel w `app/user/dashboard.tsx` kieruje do `app/techniques/` zamiast `app/threed/`. Weryfikacja: obecna ścieżka 3D działa bez regresji po zmianie routingu.

**Relevant files**

- `/Users/andrzejziemba/projects/evolync/app/threed/index.tsx` — obecny ekran wejściowy; do przeniesienia do `app/techniques/threed/` i zastąpienia nowym ekranem wyboru trybu.
- `/Users/andrzejziemba/projects/evolync/src/modules/threed/` — cały obecny moduł 3D; do przeniesienia lub re-eksportu jako `src/modules/techniques/threed`.
- `/Users/andrzejziemba/projects/evolync/src/modules/threed/hooks/useThreeDScreen.ts` — logika zakładek 3D; nie mieszać z logiką opisowego notatnika.
- `/Users/andrzejziemba/projects/evolync/src/modules/threed/database/schema.ts` — wzorzec tabel modułu 3D; punkt odniesienia dla nowego schematu.
- `/Users/andrzejziemba/projects/evolync/src/modules/grading/components/GradingConfigScreen.tsx` — wzorzec listy edytowalnych rekordów.
- `/Users/andrzejziemba/projects/evolync/src/modules/inventory/components/ProductForm.tsx` — wzorzec wielopolowych wierszy formularza, praca z `useFieldArray`.
- `/Users/andrzejziemba/projects/evolync/src/core/i18n/locales/en.json` — tłumaczenia; sprawdzić duplikaty przed dodaniem.
- `/Users/andrzejziemba/projects/evolync/src/core/i18n/locales/pl.json` — tłumaczenia; utrzymać parzystość z EN.
- `/Users/andrzejziemba/projects/evolync/app/user/dashboard.tsx` — kafel notatnika do aktualizacji (route `app/techniques/`).
- `/Users/andrzejziemba/projects/evolync/src/database/schema.ts` — centralna agregacja schematów WatermelonDB; wymagana aktualizacja w Fazie 4.
- `/Users/andrzejziemba/projects/evolync/src/database/migrations.ts` — lokalne migracje; wymagana inkrementacja `toVersion` w Fazie 4.
- `/Users/andrzejziemba/projects/evolync/supabase/migrations/` — migracje backendowe; nowy plik SQL w Fazie 4.

**Verification**

1. Zweryfikować routing: kafel na dashboardzie prowadzi do `app/techniques/`, ekran wyboru trybu pokazuje `3D` albo `opisowo`, oba kierunki działają bez regresji istniejącego flow 3D.
2. Zweryfikować CRUD dokumentu opisowego offline: utworzenie dokumentu, zapis pierwszego wiersza, dodanie kolejnego wiersza, zamknięcie i ponowne otwarcie bez utraty danych.
3. Zweryfikować kierunek ataku: przełączanie `Osoba 1 -> Osoba 2` i `Osoba 2 -> Osoba 1` aktualizuje UI i persistuje w rekordzie wiersza.
4. Zweryfikować separator: wiersz z `separator_before: true` renderuje wizualne oddzielenie; brak dodatkowej semantyki biznesowej.
5. Zweryfikować prywatność danych: dokumenty filtrowane po `user_id`, niewidoczne dla innych użytkowników.
6. Sprawdzić `deleted_at` soft delete: usunięte wiersze i dokumenty nie pojawiają się w UI (filtr `Q.where("deleted_at", null)`).
7. Sprawdzić `src/database/schema.ts` i `src/database/migrations.ts` — obie nowe tabele zarejestrowane, `toVersion` zinkrementowane.
8. Sprawdzić błędy typów/lintu dla wszystkich nowych plików oraz brak regresji w module 3D.
9. Ręcznie przetestować puste stany, walidację tytułu i zachowanie po synchronizacji online/offline.

**Decisions**

- Nowy moduł nadrzędny `techniques` zastępuje bezpośrednie wejście do `threed`; obecny moduł 3D jest submodułem `techniques/threed`.
- Routing zmienia się z `app/threed/` na `app/techniques/`; kafel dashboardu zaktualizowany.
- Ekran wejścia `app/techniques/index.tsx` umożliwia wybór `3D` albo `opisowo`.
- Moduł opisowy `techniques/notes` jest prywatny dla autora, user-owned.
- Bez pola `mode` w tabeli dokumentów — moduł jest dedykowany trybowi opisowemu.
- `technique_note_rows` zawiera `deleted_at` (soft delete), analogicznie do wszystkich modeli w codebase.
- Lista dokumentów używa `BaseCard` z `@/modules/core/components` dla każdej pozycji.
- Dokumenty opisowe są listą niezależnych rekordów, niepowiązanych z technikami 3D.
- Kolumny mają stałe nazwy `Osoba 1` i `Osoba 2`.
- Każdy wiersz ma 2 pola tekstowe, centralną strzałkę kierunku ataku i przycisk odwrócenia.
- Dodawanie nowego wiersza przez przycisk `+` na końcu listy; nowy wiersz dostaje `separator_before: true`.
- Na MVP bez drag-and-drop i bez ręcznej zmiany kolejności.
- Separator między wierszami jest wyłącznie wizualny (pole `separator_before`).
- Tworzenie dokumentu: formularz z tytułem → zapis → automatyczny pusty pierwszy wiersz → edytor.
- Migracja wymaga aktualizacji: `src/database/schema.ts`, `src/database/migrations.ts`, `supabase/migrations/`.

**Further Considerations**

1. Jeśli w przyszłości opisowe notatki mają być łączone z technikami 3D, zrobić to przez opcjonalne referencje z wiersza lub dokumentu do rekordu techniki 3D, nie przez scalanie modułów.
2. Jeśli kiedyś wróci temat `kombinacja/kontra/kontynuacja`, dodać wtedy semantyczny typ wiersza zamiast polegać tylko na separatorze wizualnym.
3. Przeniesienie `src/modules/threed` może wymagać aktualizacji importów w całym projekcie — przed Fazą 1 warto sprawdzić skalę zależności (`grep -r "modules/threed"`) i zdecydować między fizycznym przeniesieniem a re-eksportem przez `src/modules/techniques/threed/index.ts`.
