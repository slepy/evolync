---
layout: page
feature: orders
title: Zamówienia
group: school
accent: orders
icon: shopping-bag
order: 14
summary: "Zamówienia sprzętu (karategi, rękawice, koszulki): instruktor lub uczeń zamawia produkty organizacji w rozmiarach, instruktor przeprowadza każde zamówienie od Złożonego do Zrealizowanego i dostaje listę zakupów."
purpose: "Zbiera to, czego potrzebują uczniowie, żeby instruktor zamówił to u dostawcy za jednym razem i wiedział, kto zapłacił i co odebrał."
who:
  - role: "Instruktor (właściciel organizacji)"
    outcome: "Zamawia dla ucznia, widzi zamówienia jednej szkoły lub całej organizacji, zmienia status i produkty, kopiuje listę zakupów"
  - role: "Uczeń"
    outcome: "Zamawia dla siebie i śledzi status; zmienia lub usuwa zamówienie tylko, gdy jest *Złożone*"
rules:
  - "Zamówienie należy do **jednego ucznia** jednej szkoły i zawiera produkty organizacji, każdy w **rozmiarze** (wariancie) i ilości."
  - "Cena i waluta są **kopiowane do zamówienia** przy jego tworzeniu; późniejsza zmiana ceny w Produktach nie zmienia istniejących zamówień. Sumy są osobno dla każdej waluty."
  - "Status: **Złożone → Opłacone → W realizacji → Do odbioru → Zrealizowane**; zmienia go tylko instruktor, na dowolny."
  - "Instruktor zmienia produkty w każdym statusie; uczeń tylko, gdy zamówienie jest *Złożone*. Usuwanie podlega tej samej regule."
  - "Stan magazynu jest pokazywany w arkuszu produktów informacyjnie; zamówienie go nie zmienia."
  - "Lista organizacji nie ma *Dodaj*: zamówienie zawsze powstaje w szkole (albo u ucznia)."
  - "**Lista zakupów** sumuje produkty zamówień według rozmiarów: *Do zamówienia* (Złożone i Opłacone), *W realizacji*, *Do odbioru*. *Kopiuj* wkłada ją do schowka jako tekst."
  - "Zamówienie złożone dla wydarzenia należy do jednego z jego zdających egzamin (zob. [Wydarzenia](./events))."
messages:
  - situation: "Usunięcie zamówienia"
    title: "Usuń zamówienie"
    message: "Czy na pewno chcesz usunąć to zamówienie? Tej operacji nie można cofnąć."
  - situation: "Brak zamówień"
    message: "Brak zamówień"
  - situation: "Instruktor: uczeń złożył zamówienie"
    title: "Nowe zamówienie"
    message: "Anna Kowalska · 2 przedmiotów"
  - situation: "Zamówienie wydarzenia dla kogoś, kto nie zdaje egzaminu"
    message: "Ten uczeń nie zdaje egzaminu na tym wydarzeniu."
flows:
  - id: create
    title: "Nowe zamówienie"
    steps:
      - title: "Zamówienia"
        text: "Chipy statusów z licznikami filtrują listę; wiersze pokazują ucznia, liczbę przedmiotów, wydarzenie i sumę w każdej walucie. *Dodaj* otwiera nowe zamówienie."
        screen: OrdersOrg
      - title: "Uczeń"
        text: "W szkole instruktor wybiera UCZNIA (wyszukiwanie powyżej 8 uczniów); uczeń zamawiający dla siebie nie ma tego pola."
        screen: OrderStudentSelect
      - title: "Dodaj produkt"
        text: "Produkty organizacji z wyszukiwaniem; dotknięcie pokazuje rozmiary z ceną i stanem, − i + ustawiają ilość, stopka liczy przedmioty i sumę."
        screen: OrderProductPicker
      - title: "Utwórz"
        text: "*Utwórz* jest aktywne, gdy jest uczeń i co najmniej jeden produkt. Zamówienie i jego pozycje są zapisywane w jednej transakcji, ze statusem *Złożone*, i synchronizowane."
        screen: OrderCreateFilled
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Instruktor dostaje powiadomienie"
        text: "Gdy zamawia uczeń, baza zapisuje *Nowe zamówienie* dla właściciela szkoły i wysyła push; właściciel zamawiający dla siebie nie dostaje powiadomienia."
        screen: NotificationsOrg
        api:
          - { id: send-push, x: 85, y: 22 }
    diagram: |
      sequenceDiagram
        actor U as Instruktor lub uczeń
        participant A as Aplikacja
        participant L as Lokalna baza
        participant Sync as Edge Function sync
        participant DB as Baza Supabase
        U->>A: Uczeń, produkty, Utwórz
        A->>L: Zamówienie (Złożone) + pozycje z kopią ceny
        A-->>U: Powrót do zamówień
        A-)Sync: Wypchnij zamówienie i pozycje
        Sync->>DB: Zapis
        DB->>DB: Powiadomienie Nowe zamówienie dla właściciela szkoły
  - id: manage
    title: "Status i szczegóły"
    steps:
      - title: "Zamówienie"
        text: "Uczeń, wydarzenie, status ze *Zmień*, data utworzenia i zmiany; potem produkty z sumą. Dotknięcie produktu zmienia rozmiar lub ilość, kosz go usuwa; *Zapisz* pojawia się po zmianie."
        screen: OrderDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Zmiana statusu"
        text: "Pięć statusów z opisem każdego; *· bieżący* oznacza status, który zamówienie ma teraz. *Zapisz* go stosuje."
        screen: OrdersStatusSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: shopping
    title: "Lista zakupów"
    steps:
      - title: "Lista zakupów"
        text: "Drugi widok Zamówień: każdy produkt wybranych zamówień z ilością na rozmiar. *Kopiuj* wkłada listę do schowka, żeby wysłać ją dostawcy."
        screen: OrdersShoppingList
---

<FeatureView>

## Kod

| Co | Gdzie |
| --- | --- |
| Zamówienia i lista zakupów (trasy `/organization/orders`, `/school/{schoolId}/orders`, `/user/orders`) | `src/modules/orders/components/OrdersScreen.tsx`, `hooks/useOrdersList.ts`, `components/orderListState.ts` |
| Nowe zamówienie (trasy `…/orders/create`) | `OrderFormScreen.tsx`, `StudentSelectSheet.tsx`, `AddProductSheet.tsx`, `createOrderWithItems` w `services/orderService.ts` |
| Szczegóły zamówienia (trasy `…/orders/{orderId}`) | `OrderDetailsScreen.tsx`, `OrderStatusSheet.tsx`, `updateOrderItems`, `updateOrderStatus`, `deleteOrder` |
| Kto może co zrobić | `components/orderAccess.ts` |
| Powiadomienie | `notify_order_created` w `supabase/migrations/20261001000000_notifications.sql` |

## Dane

| Tabela | Kolumny |
| --- | --- |
| `orders` | `school_id`, `school_member_id`, `status`, `event_id` |
| `order_items` | `order_id`, `product_variant_id`, `quantity`, `unit_price`, `currency` |

## Synchronizacja

- Właściciel organizacji wypycha i pobiera zamówienia wszystkich swoich szkół.
- Uczeń pobiera i wypycha swoje zamówienia; serwer usuwa `event_id` z zamówienia ucznia.

</FeatureView>
