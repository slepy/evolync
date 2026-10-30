---
layout: page
feature: inventory
title: Products
group: organization
accent: products
icon: package
order: 25
summary: "The organization's product catalog for orders: each product has a photo, a name, a description and one or more variants (sizes) with their own price, currency and stock."
purpose: "What students and instructors can order, in one catalog for all schools."
who:
  - role: "Instructor (organization owner)"
    outcome: "Adds, edits and deletes products and their variants, keeps stock up to date"
  - role: "Student"
    outcome: "Picks from the catalog when ordering (see Orders)"
rules:
  - "A product belongs to the **organization** and has a name (up to 255 characters), an optional description (up to 1000) and an optional photo."
  - "A product has **at least one variant**. *Single* shows one flat price / currency / stock; *Multiple* gives each variant a name (up to 100 characters)."
  - "Price must be **greater than 0**; stock is a whole number, 0 or more (0 by default)."
  - "Each row of the list shows a chip per currency: stock / lowest price, colored by the stock."
  - "Stock is information for the instructor; orders do not change it."
  - "Deleting a product removes it from the catalog; **existing orders keep it** with their price. The confirmation says how many order items refer to it."
  - "The photo is uploaded to Supabase Storage when the product is saved; offline, the product is saved without a photo."
messages:
  - situation: "Delete a product used in orders"
    message: "Are you sure you want to delete this product? It will no longer appear in the catalog but will remain visible in existing orders. This product is referenced by 3 existing order item(s)."
  - situation: "Remove a variant"
    message: "Are you sure you want to remove this variant?"
  - situation: "No variant"
    message: "Add at least one variant"
  - situation: "Price 0 or less"
    message: "Price must be greater than 0"
flows:
  - id: products
    title: "Catalog"
    steps:
      - title: "Your products"
        text: "From the organization dashboard: one row per product with its photo or a package icon and a stock / price chip per currency. *Add new* opens a new product, a row opens it for editing."
        screen: ProductsList
      - title: "New product"
        text: "Photo, NAME, DESCRIPTION, then *Single* (PRICE, CURRENCY, QUANTITY IN STOCK) or *Multiple* variants. *Create* uploads the photo, writes the product and its variants in one transaction and syncs."
        screen: ProductCreate
        api:
          - { id: storage-upload, x: 50, y: 10 }
          - { id: sync-push, x: 50, y: 95 }
      - title: "Edit product"
        text: "*Change photo* or remove it, rename, change variants (the trash of a variant asks first). *Save* waits for a change; the header trash deletes the product."
        screen: ProductEdit
        api:
          - { id: sync-push, x: 90, y: 9 }
    diagram: |
      sequenceDiagram
        actor I as Instructor
        participant A as App
        participant S as Supabase Storage
        participant L as Local DB
        participant Sync as Edge Function sync
        I->>A: Photo, name, variants, Create
        opt photo and online
          A->>S: Upload to product-images
          S-->>A: Public URL
        end
        A->>L: Product + variants
        A-)Sync: Push
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Products (route `/organization/inventory`) | `app/organization/inventory/index.tsx`, `src/modules/inventory/components/ProductsScreen.tsx`, `productRowSummary.ts` |
| New / edit product (routes `…/inventory/create`, `…/{productId}/edit`) | `ProductFormScreen.tsx`, `productFormState.ts`, `VariantFields.tsx` |
| Create, update, delete | `src/modules/inventory/services/productService.ts`, `validation/productSchema.ts` |
| Photo upload | `src/core/utils/uploadImage.ts` |

## Data

| Table | Columns |
| --- | --- |
| `products` | `organization_id`, `name`, `description`, `image_url` |
| `product_variants` | `product_id`, `name`, `price`, `currency`, `stock_quantity` |

Order items store their own price and currency (see [Orders](./orders)), so a later price change or a deleted product does not change them.

</FeatureView>
