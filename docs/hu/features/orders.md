---
layout: page
feature: orders
title: Rendelések
group: school
accent: orders
icon: shopping-bag
order: 14
summary: "Felszerelésrendelések (ruhák, kesztyűk, pólók): az oktató vagy a tanuló a szervezet termékeit rendeli méretben, az oktató minden rendelést a Leadva állapottól a Teljesítve állapotig visz, és bevásárlólistát kap."
purpose: "Összegyűjti, mire van szükségük a tanulóknak, hogy az oktató egyszerre rendelje meg a beszállítótól, és tudja, ki fizetett és ki mit vett át."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Rendel egy tanulónak, látja egy iskola vagy az egész szervezet rendeléseit, módosítja az állapotot és a termékeket, kimásolja a bevásárlólistát"
  - role: "Tanuló"
    outcome: "Magának rendel és követi az állapotot; a rendelést csak *Leadva* állapotban módosíthatja vagy törölheti"
rules:
  - "Egy rendelés egy iskola **egy tanulójáé**, és a szervezet termékeit tartalmazza, mindegyiket **méretben** (változatban) és mennyiségben."
  - "Az ár és a pénznem létrehozáskor **bemásolódik a rendelésbe**; a Termékekben később módosított ár nem változtatja a meglévő rendeléseket. Az összegek pénznemenként adódnak."
  - "Állapot: **Leadva → Fizetve → Feldolgozás alatt → Átvehető → Teljesítve**; csak az oktató módosítja, bármelyikre."
  - "Az oktató bármely állapotban módosíthatja a termékeket; a tanuló csak *Leadva* állapotban. A törlésre ugyanez a szabály vonatkozik."
  - "A készletet a terméklap csak tájékoztatásul mutatja; a rendelés nem változtatja."
  - "A szervezeti listán nincs *Új hozzáadása*: rendelés mindig iskolában (vagy a tanulónál) születik."
  - "A **bevásárlólista** méretenként összeadja a rendelések termékeit: *Megrendelendő* (Leadva és Fizetve), *Feldolgozás alatt*, *Átvehető*. A *Másolás* szövegként a vágólapra teszi."
  - "Eseményhez leadott rendelés az esemény egyik vizsgázójáé (lásd [Események](./events))."
messages:
  - situation: "Rendelés törlése"
    title: "Rendelés törlése"
    message: "Biztosan törlöd ezt a rendelést? Ez a művelet nem vonható vissza."
  - situation: "Még nincs rendelés"
    message: "Még nincsenek rendelések"
  - situation: "Oktató: egy tanuló rendelt"
    title: "Új rendelés"
    message: "Anna Kowalska · 2 tétel"
  - situation: "Eseményrendelés olyannak, aki nem vizsgázik"
    message: "Ez a tanuló nem vizsgázik ezen az eseményen."
flows:
  - id: create
    title: "Új rendelés"
    steps:
      - title: "Rendelések"
        text: "Az állapot-chipek számlálóval szűrik a listát; a sorok a tanulót, a tételek számát, az eseményt és a pénznemenkénti összeget mutatják. Az *Új hozzáadása* új rendelést nyit."
        screen: OrdersOrg
      - title: "Tanuló"
        text: "Iskolában az oktató kiválasztja a TANULÓT (8 tanuló felett kereséssel); a magának rendelő tanulónál nincs ilyen mező."
        screen: OrderStudentSelect
      - title: "Termék hozzáadása"
        text: "A szervezet termékei kereséssel; koppintásra megjelennek a méretek árral és készlettel, a − és + állítja a mennyiséget, a lábléc számolja a tételeket és az összeget."
        screen: OrderProductPicker
      - title: "Létrehozás"
        text: "A *Létrehozás* tanulóval és legalább egy termékkel aktív. A rendelés és a tételei egy tranzakcióban íródnak *Leadva* állapotban, majd szinkronizálódnak."
        screen: OrderCreateFilled
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Az oktató értesítést kap"
        text: "Ha egy tanuló rendel, az adatbázis *Új rendelés* értesítést ír az iskola tulajdonosának, és push üzenetet küld; a magának rendelő tulajdonos nem kap értesítést."
        screen: NotificationsOrg
        api:
          - { id: send-push, x: 85, y: 22 }
    diagram: |
      sequenceDiagram
        actor U as Oktató vagy tanuló
        participant A as Alkalmazás
        participant L as Helyi adatbázis
        participant Sync as Edge Function sync
        participant DB as Supabase adatbázis
        U->>A: Tanuló, termékek, Létrehozás
        A->>L: Rendelés (Leadva) + tételek az ár másolatával
        A-->>U: Vissza a rendelésekhez
        A-)Sync: A rendelés és a tételek feltöltése
        Sync->>DB: Beszúrás
        DB->>DB: Új rendelés értesítés az iskola tulajdonosának
  - id: manage
    title: "Állapot és részletek"
    steps:
      - title: "Rendelés"
        text: "Tanuló, esemény, állapot a *Módosítás* gombbal, létrehozás és módosítás ideje; utána a termékek az összeggel. Egy termékre koppintva módosítható a méret vagy a mennyiség, a kuka eltávolítja; a *Mentés* módosítás után jelenik meg."
        screen: OrderDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Állapot módosítása"
        text: "Öt állapot, mindegyik a jelentésével; a *· aktuális* jelöli a rendelés mostani állapotát. A *Mentés* alkalmazza."
        screen: OrdersStatusSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: shopping
    title: "Bevásárlólista"
    steps:
      - title: "Bevásárlólista"
        text: "A Rendelések második nézete: a kiválasztott rendelések minden terméke méretenkénti mennyiséggel. A *Másolás* a vágólapra teszi a listát, hogy a beszállítónak el lehessen küldeni."
        screen: OrdersShoppingList
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Rendelések és bevásárlólista (útvonalak `/organization/orders`, `/school/{schoolId}/orders`, `/user/orders`) | `src/modules/orders/components/OrdersScreen.tsx`, `hooks/useOrdersList.ts`, `components/orderListState.ts` |
| Új rendelés (útvonalak `…/orders/create`) | `OrderFormScreen.tsx`, `StudentSelectSheet.tsx`, `AddProductSheet.tsx`, `createOrderWithItems` a `services/orderService.ts` fájlban |
| A rendelés részletei (útvonalak `…/orders/{orderId}`) | `OrderDetailsScreen.tsx`, `OrderStatusSheet.tsx`, `updateOrderItems`, `updateOrderStatus`, `deleteOrder` |
| Ki mit tehet | `components/orderAccess.ts` |
| Értesítés | `notify_order_created` a `supabase/migrations/20261001000000_notifications.sql` fájlban |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `orders` | `school_id`, `school_member_id`, `status`, `event_id` |
| `order_items` | `order_id`, `product_variant_id`, `quantity`, `unit_price`, `currency` |

## Szinkronizálás

- A szervezet tulajdonosa az összes iskolája rendeléseit feltölti és letölti.
- A tanuló a saját rendeléseit tölti le és fel; a szerver törli az `event_id` mezőt a tanuló rendeléséből.

</FeatureView>
