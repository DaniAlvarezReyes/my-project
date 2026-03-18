-- ============================================
-- SISTEMA DE COLORES Y TALLAS - COMPATIBLE CON TABLA EXISTENTE
-- ============================================

-- 1. AÑADIR COLUMNAS A LA TABLA PRODUCTS EXISTENTE (si no existen)
DO $$ 
BEGIN
  -- Añadir base_price si no existe (ya veo que existe en tu esquema)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'base_price'
  ) THEN
    ALTER TABLE products ADD COLUMN base_price DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Actualizar base_price desde price donde sea NULL
  UPDATE products SET base_price = price WHERE base_price = 0 OR base_price IS NULL;
END $$;

-- 2. CREAR TABLA DE VARIANTES DE COLOR (cada color tiene sus propias imágenes)
CREATE TABLE IF NOT EXISTS product_color_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  color_name VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#000000', -- Código hexadecimal del color
  images TEXT[], -- Array de URLs de imágenes para este color específico
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, color_name)
);

-- 3. CREAR TABLA DE TALLAS POR VARIANTE DE COLOR
CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color_variant_id UUID REFERENCES product_color_variants(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(color_variant_id, size)
);

-- 4. ÍNDICES PARA MEJORAR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_color_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sizes_variant_id ON product_sizes(color_variant_id);

-- 5. POLÍTICAS RLS (Row Level Security)
ALTER TABLE product_color_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Public can read color variants" ON product_color_variants;
DROP POLICY IF EXISTS "Public can read sizes" ON product_sizes;
DROP POLICY IF EXISTS "Admins can manage color variants" ON product_color_variants;
DROP POLICY IF EXISTS "Admins can manage sizes" ON product_sizes;

-- Lectura pública
CREATE POLICY "Public can read color variants" 
  ON product_color_variants FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Public can read sizes" 
  ON product_sizes FOR SELECT 
  TO public 
  USING (true);

-- Solo admins pueden modificar
CREATE POLICY "Admins can manage color variants" 
  ON product_color_variants FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage sizes" 
  ON product_sizes FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
  );

-- ============================================
-- VISTA COMPLETA DE PRODUCTOS CON COLORES Y TALLAS
-- ============================================

CREATE OR REPLACE VIEW products_with_variants AS
SELECT 
  p.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', cv.id,
        'color_name', cv.color_name,
        'color_hex', cv.color_hex,
        'images', cv.images,
        'stock', cv.stock,
        'is_available', cv.is_available,
        'sizes', (
          SELECT json_agg(
            json_build_object(
              'id', ps.id,
              'size', ps.size,
              'stock', ps.stock,
              'is_available', ps.is_available
            )
          )
          FROM product_sizes ps
          WHERE ps.color_variant_id = cv.id
        )
      )
    ) FILTER (WHERE cv.id IS NOT NULL),
    '[]'::json
  ) as color_variants
FROM products p
LEFT JOIN product_color_variants cv ON p.id = cv.product_id
GROUP BY p.id, p.name, p.description, p.price, p.original_price, p.images, 
         p.category, p.subcategory, p.brand, p.rating, p.reviews, p.in_stock, 
         p.stock, p.sizes, p.colors, p.badge, p.created_at, p.base_price;

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para obtener stock total de un producto
CREATE OR REPLACE FUNCTION get_product_total_stock(product_id_param TEXT)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(stock), 0)::INTEGER
  FROM product_color_variants
  WHERE product_id = product_id_param;
$$ LANGUAGE SQL;

-- Función para verificar disponibilidad de un producto
CREATE OR REPLACE FUNCTION is_product_available(product_id_param TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM product_color_variants cv
    WHERE cv.product_id = product_id_param 
      AND cv.is_available = true 
      AND cv.stock > 0
  );
$$ LANGUAGE SQL;

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Verificar si el producto de ejemplo existe
DO $$
BEGIN
  -- Insertar producto de ejemplo si no existe
  IF NOT EXISTS (SELECT 1 FROM products WHERE id = 'nike-pegasus-40-example') THEN
    INSERT INTO products (
      id, 
      name, 
      description, 
      price,
      base_price,
      original_price,
      images, 
      category, 
      brand, 
      badge,
      in_stock,
      stock,
      sizes,
      colors
    )
    VALUES (
      'nike-pegasus-40-example',
      'Nike Air Zoom Pegasus 40',
      'Las Pegasus 40 ofrecen una amortiguación reactiva y duradera para tus entrenamientos diarios.',
      139.99,
      139.99,
      159.99,
      ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop'],
      'running',
      'Nike',
      'POPULAR',
      true,
      80,
      ARRAY['39', '40', '41', '42', '43', '44', '45'],
      ARRAY['Negro', 'Blanco']
    );
  END IF;
END $$;

-- Variante de color: Negro
INSERT INTO product_color_variants (product_id, color_name, color_hex, images, stock, is_available)
VALUES (
  'nike-pegasus-40-example',
  'Negro',
  '#000000',
  ARRAY[
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop'
  ],
  50,
  true
) ON CONFLICT (product_id, color_name) DO UPDATE
  SET images = EXCLUDED.images,
      stock = EXCLUDED.stock,
      color_hex = EXCLUDED.color_hex;

-- Variante de color: Blanco
INSERT INTO product_color_variants (product_id, color_name, color_hex, images, stock, is_available)
VALUES (
  'nike-pegasus-40-example',
  'Blanco',
  '#FFFFFF',
  ARRAY[
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop'
  ],
  30,
  true
) ON CONFLICT (product_id, color_name) DO UPDATE
  SET images = EXCLUDED.images,
      stock = EXCLUDED.stock,
      color_hex = EXCLUDED.color_hex;

-- Tallas para variante Negro
DO $$
DECLARE
  negro_variant_id UUID;
  size_val TEXT;
  stock_val INTEGER;
BEGIN
  SELECT id INTO negro_variant_id 
  FROM product_color_variants 
  WHERE product_id = 'nike-pegasus-40-example' AND color_name = 'Negro'
  LIMIT 1;
  
  IF negro_variant_id IS NOT NULL THEN
    FOREACH size_val IN ARRAY ARRAY['39', '40', '41', '42', '43', '44', '45'] LOOP
      stock_val := CASE 
        WHEN size_val IN ('40', '41') THEN 15
        WHEN size_val IN ('39', '42') THEN 10
        ELSE 8
      END;
      
      INSERT INTO product_sizes (color_variant_id, size, stock, is_available)
      VALUES (negro_variant_id, size_val, stock_val, true)
      ON CONFLICT (color_variant_id, size) DO UPDATE
        SET stock = EXCLUDED.stock;
    END LOOP;
  END IF;
END $$;

-- Tallas para variante Blanco
DO $$
DECLARE
  blanco_variant_id UUID;
  size_val TEXT;
  stock_val INTEGER;
BEGIN
  SELECT id INTO blanco_variant_id 
  FROM product_color_variants 
  WHERE product_id = 'nike-pegasus-40-example' AND color_name = 'Blanco'
  LIMIT 1;
  
  IF blanco_variant_id IS NOT NULL THEN
    FOREACH size_val IN ARRAY ARRAY['39', '40', '41', '42', '43', '44', '45'] LOOP
      stock_val := CASE 
        WHEN size_val IN ('40', '41') THEN 8
        WHEN size_val IN ('39', '42') THEN 5
        ELSE 4
      END;
      
      INSERT INTO product_sizes (color_variant_id, size, stock, is_available)
      VALUES (blanco_variant_id, size_val, stock_val, true)
      ON CONFLICT (color_variant_id, size) DO UPDATE
        SET stock = EXCLUDED.stock;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- VERIFICACIONES
-- ============================================

-- Ver productos con colores y tallas
SELECT * FROM products_with_variants WHERE id = 'nike-pegasus-40-example';

-- Ver colores de un producto
SELECT 
  cv.color_name,
  cv.color_hex,
  array_length(cv.images, 1) as num_imagenes,
  cv.stock as stock_color,
  COUNT(ps.id) as num_tallas
FROM product_color_variants cv
LEFT JOIN product_sizes ps ON ps.color_variant_id = cv.id
WHERE cv.product_id = 'nike-pegasus-40-example'
GROUP BY cv.id, cv.color_name, cv.color_hex, cv.images, cv.stock;

-- Ver tallas de cada color
SELECT 
  cv.color_name,
  ps.size,
  ps.stock,
  ps.is_available
FROM product_color_variants cv
LEFT JOIN product_sizes ps ON ps.color_variant_id = cv.id
WHERE cv.product_id = 'nike-pegasus-40-example'
ORDER BY cv.color_name, ps.size;

-- Ver stock total del producto
SELECT get_product_total_stock('nike-pegasus-40-example') as stock_total;

-- Ver disponibilidad
SELECT is_product_available('nike-pegasus-40-example') as esta_disponible;

-- ============================================
-- RESUMEN
-- ============================================

SELECT 
  'Tablas creadas' as mensaje,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'product_color_variants') as color_variants_existe,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'product_sizes') as sizes_existe,
  (SELECT COUNT(*) FROM product_color_variants WHERE product_id = 'nike-pegasus-40-example') as colores_ejemplo,
  (SELECT COUNT(*) FROM product_sizes WHERE color_variant_id IN (
    SELECT id FROM product_color_variants WHERE product_id = 'nike-pegasus-40-example'
  )) as tallas_ejemplo;
