-- 1. Create product_variants table
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    currency TEXT DEFAULT 'PLN',
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for product_variants
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_updated_at ON product_variants(updated_at);
CREATE INDEX idx_product_variants_deleted_at ON product_variants(deleted_at);

-- 2. Migrate existing data (Create a default 'Standard' variant for existing products)
INSERT INTO product_variants (product_id, name, price, currency, stock_quantity, created_at, updated_at, deleted_at)
SELECT id, 'Standard', price, currency, stock_quantity, created_at, updated_at, deleted_at
FROM products;

-- 3. Modify order_items to reference product_variants instead of products
ALTER TABLE order_items ADD COLUMN product_variant_id UUID REFERENCES product_variants(id);

-- Update existing order_items to point to the new variants
-- (Since we created 1 variant per product, this mapping is unique)
UPDATE order_items
SET product_variant_id = pv.id
FROM product_variants pv
WHERE order_items.product_id = pv.product_id;

-- Drop the old foreign key and column
ALTER TABLE order_items DROP CONSTRAINT order_items_product_id_fkey;
ALTER TABLE order_items DROP COLUMN product_id;

-- 4. Clean up products table (remove fields moved to variants)
ALTER TABLE products DROP COLUMN price;
ALTER TABLE products DROP COLUMN currency;
ALTER TABLE products DROP COLUMN stock_quantity;

-- 5. Enable RLS for product_variants (Inherit logic from products mainly)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policy: View variants (Same as products - Organization Owner or School Member)
CREATE POLICY "Variants are viewable by organization owner and school members"
ON product_variants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_variants.product_id
        AND (
            p.organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid())
            OR
            EXISTS (
                SELECT 1 FROM schools s
                JOIN school_members sm ON sm.school_id = s.id
                WHERE s.organization_id = p.organization_id
                AND sm.user_id = auth.uid()
            )
        )
    )
);

-- Policy: Manage variants (Organization Owner only)
CREATE POLICY "Variants are manageable by organization owner"
ON product_variants FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM products p
        JOIN organizations o ON o.id = p.organization_id
        WHERE p.id = product_variants.product_id
        AND o.owner_id = auth.uid()
    )
);
