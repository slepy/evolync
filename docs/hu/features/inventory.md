---
layout: page
feature: inventory
title: Termékek
group: organization
accent: products
icon: package
order: 25
summary: "A szervezet rendelhető termékeinek katalógusa: minden terméknek van fotója, neve, leírása és egy vagy több változata (mérete) saját árral, pénznemmel és készlettel."
purpose: "Amit a tanulók és az oktatók rendelhetnek, egy katalógusban az összes iskolának."
who:
  - role: "Oktató (a szervezet tulajdonosa)"
    outcome: "Termékeket és változatokat ad hozzá, szerkeszt és töröl, frissen tartja a készletet"
  - role: "Tanuló"
    outcome: "Rendeléskor a katalógusból választ (lásd Rendelések)"
rules:
  - "A termék a **szervezeté**, és van neve (legfeljebb 255 karakter), opcionális leírása (legfeljebb 1000) és opcionális fotója."
  - "Egy terméknek **legalább egy változata** van. Az *Egy* egyetlen árat / pénznemet / készletet mutat; a *Több* minden változatnak nevet ad (legfeljebb 100 karakter)."
  - "Az árnak **0-nál nagyobbnak** kell lennie; a készlet egész szám, 0 vagy több (alapból 0)."
  - "A lista minden sora pénznemenként egy chipet mutat: készlet / legalacsonyabb ár, a készlet szerint színezve."
  - "A készlet tájékoztatás az oktatónak; a rendelések nem változtatják."
  - "A termék törlése eltávolítja a katalógusból; **a meglévő rendelések megtartják** az árukkal együtt. A megerősítés megmondja, hány rendelési tétel hivatkozik rá."
  - "A fotó a termék mentésekor kerül a Supabase Storage-ba; offline a termék fotó nélkül mentődik."
messages:
  - situation: "Rendelésekben használt termék törlése"
    message: "Biztosan törlöd ezt a terméket? Nem jelenik meg többé a katalógusban, de a meglévő rendelésekben látható marad. A termék 3 meglévő rendelési tételben szerepel."
  - situation: "Változat eltávolítása"
    message: "Biztosan eltávolítod ezt a változatot?"
  - situation: "Nincs változat"
    message: "Adj hozzá legalább egy változatot"
  - situation: "Az ár 0 vagy kevesebb"
    message: "Az árnak 0-nál nagyobbnak kell lennie"
flows:
  - id: products
    title: "Katalógus"
    steps:
      - title: "Termékeid"
        text: "A szervezet irányítópultjáról: termékenként egy sor a fotóval vagy csomag ikonnal és pénznemenként egy készlet / ár chippel. Az *Új hozzáadása* új terméket nyit, egy sor szerkesztésre nyitja meg."
        screen: ProductsList
      - title: "Új termék"
        text: "Fotó, NÉV, LEÍRÁS, majd *Egy* (ÁR, PÉNZNEM, KÉSZLETEN) vagy *Több* változat. A *Létrehozás* feltölti a fotót, egy tranzakcióban írja a terméket és a változatait, és szinkronizál."
        screen: ProductCreate
        api:
          - { id: storage-upload, x: 50, y: 10 }
          - { id: sync-push, x: 50, y: 95 }
      - title: "Termék szerkesztése"
        text: "*Fotó cseréje* vagy eltávolítása, átnevezés, változatok módosítása (a változat kukája előbb rákérdez). A *Mentés* módosításra vár; a fejléc kukája törli a terméket."
        screen: ProductEdit
        api:
          - { id: sync-push, x: 90, y: 9 }
    diagram: |
      sequenceDiagram
        actor I as Oktató
        participant A as Alkalmazás
        participant S as Supabase Storage
        participant L as Helyi adatbázis
        participant Sync as Edge Function sync
        I->>A: Fotó, név, változatok, Létrehozás
        opt fotó és online
          A->>S: Feltöltés a product-images tárolóba
          S-->>A: Nyilvános URL
        end
        A->>L: Termék + változatok
        A-)Sync: Feltöltés
---

<FeatureView>

## Kód

| Mi | Hol |
| --- | --- |
| Termékek (útvonal `/organization/inventory`) | `app/organization/inventory/index.tsx`, `src/modules/inventory/components/ProductsScreen.tsx`, `productRowSummary.ts` |
| Új / szerkesztett termék (útvonalak `…/inventory/create`, `…/{productId}/edit`) | `ProductFormScreen.tsx`, `productFormState.ts`, `VariantFields.tsx` |
| Létrehozás, módosítás, törlés | `src/modules/inventory/services/productService.ts`, `validation/productSchema.ts` |
| Fotófeltöltés | `src/core/utils/uploadImage.ts` |

## Adatok

| Tábla | Oszlopok |
| --- | --- |
| `products` | `organization_id`, `name`, `description`, `image_url` |
| `product_variants` | `product_id`, `name`, `price`, `currency`, `stock_quantity` |

A rendelési tételek saját árat és pénznemet tárolnak (lásd [Rendelések](./orders)), így egy későbbi árváltozás vagy egy törölt termék nem módosítja őket.

</FeatureView>
