---
layout: page
feature: inventory
title: Produkty
group: organization
accent: products
icon: package
order: 25
summary: "Katalog produktów organizacji do zamówień: każdy produkt ma zdjęcie, nazwę, opis i jeden lub więcej wariantów (rozmiarów) z własną ceną, walutą i stanem."
purpose: "To, co uczniowie i instruktorzy mogą zamówić, w jednym katalogu dla wszystkich szkół."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Dodaje, edytuje i usuwa produkty i ich warianty, aktualizuje stany"
  - role: "Uczeń"
    outcome: "Wybiera z katalogu przy zamawianiu (zob. Zamówienia)"
rules:
  - "Produkt należy do **organizacji** i ma nazwę (do 255 znaków), opcjonalny opis (do 1000) i opcjonalne zdjęcie."
  - "Produkt ma **co najmniej jeden wariant**. *Pojedynczy* pokazuje jedną cenę / walutę / stan; *Wiele* daje każdemu wariantowi nazwę (do 100 znaków)."
  - "Cena musi być **większa od 0**; stan to liczba całkowita, 0 lub więcej (domyślnie 0)."
  - "Każdy wiersz listy pokazuje chip dla każdej waluty: stan / najniższa cena, w kolorze zależnym od stanu."
  - "Stan to informacja dla instruktora; zamówienia go nie zmieniają."
  - "Usunięcie produktu zabiera go z katalogu; **istniejące zamówienia go zachowują** z ich ceną. Potwierdzenie mówi, ile pozycji zamówień się do niego odnosi."
  - "Zdjęcie trafia do Supabase Storage przy zapisie produktu; offline produkt zapisuje się bez zdjęcia."
messages:
  - situation: "Usunięcie produktu użytego w zamówieniach"
    message: "Czy na pewno chcesz usunąć ten produkt? Zniknie z katalogu, ale pozostanie widoczny w istniejących zamówieniach. Ten produkt jest przywołany w 3 pozycjach istniejących zamówień."
  - situation: "Usunięcie wariantu"
    message: "Czy na pewno chcesz usunąć ten wariant?"
  - situation: "Brak wariantu"
    message: "Dodaj co najmniej jeden wariant"
  - situation: "Cena 0 lub mniej"
    message: "Cena musi być większa od 0"
flows:
  - id: products
    title: "Katalog"
    steps:
      - title: "Twoje produkty"
        text: "Z pulpitu organizacji: wiersz na produkt ze zdjęciem lub ikoną paczki i chipem stan / cena dla każdej waluty. *Dodaj* otwiera nowy produkt, wiersz otwiera go do edycji."
        screen: ProductsList
      - title: "Nowy produkt"
        text: "Zdjęcie, NAZWA, OPIS, potem *Pojedynczy* (CENA, WALUTA, ILOŚĆ W MAGAZYNIE) albo *Wiele* wariantów. *Utwórz* wysyła zdjęcie, zapisuje produkt i warianty w jednej transakcji i synchronizuje."
        screen: ProductCreate
        api:
          - { id: storage-upload, x: 50, y: 10 }
          - { id: sync-push, x: 50, y: 95 }
      - title: "Edycja produktu"
        text: "*Zmień zdjęcie* lub je usuń, zmień nazwę, warianty (kosz wariantu pyta najpierw). *Zapisz* czeka na zmianę; kosz w nagłówku usuwa produkt."
        screen: ProductEdit
        api:
          - { id: sync-push, x: 90, y: 9 }
    diagram: |
      sequenceDiagram
        actor I as Instruktor
        participant A as Aplikacja
        participant S as Supabase Storage
        participant L as Lokalna baza
        participant Sync as Edge Function sync
        I->>A: Zdjęcie, nazwa, warianty, Utwórz
        opt zdjęcie i online
          A->>S: Wysłanie do product-images
          S-->>A: Publiczny URL
        end
        A->>L: Produkt + warianty
        A-)Sync: Wypchnij
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Produkty (trasa `/organization/inventory`) | `app/organization/inventory/index.tsx`, `src/modules/inventory/components/ProductsScreen.tsx`, `productRowSummary.ts` |
| Nowy / edycja produktu (trasy `…/inventory/create`, `…/{productId}/edit`) | `ProductFormScreen.tsx`, `productFormState.ts`, `VariantFields.tsx` |
| Tworzenie, zmiana, usuwanie | `src/modules/inventory/services/productService.ts`, `validation/productSchema.ts` |
| Wysyłanie zdjęcia | `src/core/utils/uploadImage.ts` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `products` | `organization_id`, `name`, `description`, `image_url` |
| `product_variants` | `product_id`, `name`, `price`, `currency`, `stock_quantity` |

Pozycje zamówień przechowują własną cenę i walutę (zob. [Zamówienia](./orders)), więc późniejsza zmiana ceny ani usunięcie produktu ich nie zmienia.

</FeatureView>
