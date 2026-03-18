-- ============================================
-- SISTEMA COMPLETO DE PRODUCTOS CON COLORES
-- ============================================

-- 1. TABLA DE PRODUCTOS PRINCIPAL
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  brand VARCHAR(255),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  base_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  total_stock INTEGER DEFAULT 0,
  badge VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABLA DE VARIANTES DE COLOR (cada color tiene sus propias imágenes)
CREATE TABLE IF NOT EXISTS product_color_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(255) REFERENCES products(id) ON DELETE CASCADE,
  color_name VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7), -- Código hexadecimal del color
  images TEXT[], -- Array de URLs de imágenes
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, color_name)
);

-- 3. TABLA DE TALLAS DISPONIBLES POR VARIANTE DE COLOR
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
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_color_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sizes_variant_id ON product_sizes(color_variant_id);

-- 5. FUNCIÓN PARA ACTUALIZAR timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. TRIGGER PARA AUTO-ACTUALIZAR updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. POLÍTICAS RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_color_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "Public can read products" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Public can read color variants" ON product_color_variants FOR SELECT TO public USING (true);
CREATE POLICY "Public can read sizes" ON product_sizes FOR SELECT TO public USING (true);

-- Solo admins pueden modificar
CREATE POLICY "Admins can manage products" ON products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can manage color variants" ON product_color_variants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can manage sizes" ON product_sizes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista completa de productos con todos sus colores y tallas
CREATE OR REPLACE VIEW products_complete AS
SELECT 
  p.*,
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
  ) FILTER (WHERE cv.id IS NOT NULL) as color_variants
FROM products p
LEFT JOIN product_color_variants cv ON p.id = cv.product_id
GROUP BY p.id;

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para obtener stock total de un producto
CREATE OR REPLACE FUNCTION get_product_total_stock(product_id_param VARCHAR)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(stock), 0)::INTEGER
  FROM product_color_variants
  WHERE product_id = product_id_param;
$$ LANGUAGE SQL;

-- Función para verificar disponibilidad de un producto
CREATE OR REPLACE FUNCTION is_product_available(product_id_param VARCHAR)
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
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Producto de ejemplo
INSERT INTO products (id, name, description, brand, category, base_price, badge)
VALUES (
  'nike-pegasus-40',
  'Nike Air Zoom Pegasus 40',
  'Las Pegasus 40 ofrecen una amortiguación reactiva y duradera para tus entrenamientos diarios.',
  'Nike',
  'running',
  139.99,
  'POPULAR'
) ON CONFLICT (id) DO NOTHING;

-- Variante de color: Negro
INSERT INTO product_color_variants (product_id, color_name, color_hex, images, stock)
VALUES (
  'nike-pegasus-40',
  'Negro',
  '#000000',
  ARRAY[
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop'
  ],
  50
) ON CONFLICT (product_id, color_name) DO NOTHING;

-- Variante de color: Blanco
INSERT INTO product_color_variants (product_id, color_name, color_hex, images, stock)
VALUES (
  'nike-pegasus-40',
  'Blanco',
  '#FFFFFF',
  ARRAY[
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop'
  ],
  30
) ON CONFLICT (product_id, color_name) DO NOTHING;

-- Tallas para variante Negro
WITH negro_variant AS (
  SELECT id FROM product_color_variants 
  WHERE product_id = 'nike-pegasus-40' AND color_name = 'Negro'
  LIMIT 1
)
INSERT INTO product_sizes (color_variant_id, size, stock)
SELECT id, size, 10
FROM negro_variant, unnest(ARRAY['39', '40', '41', '42', '43', '44', '45']) AS size
ON CONFLICT (color_variant_id, size) DO NOTHING;

-- Tallas para variante Blanco
WITH blanco_variant AS (
  SELECT id FROM product_color_variants 
  WHERE product_id = 'nike-pegasus-40' AND color_name = 'Blanco'
  LIMIT 1
)
INSERT INTO product_sizes (color_variant_id, size, stock)
SELECT id, size, 5
FROM blanco_variant, unnest(ARRAY['39', '40', '41', '42', '43', '44', '45']) AS size
ON CONFLICT (color_variant_id, size) DO NOTHING;

-- ============================================
-- VERIFICACIONES
-- ============================================

-- Ver productos con colores
SELECT * FROM products_complete;

-- Ver stock total de un producto
SELECT get_product_total_stock('nike-pegasus-40');

-- Ver disponibilidad
SELECT is_product_available('nike-pegasus-40');

-- Ver estructura
SELECT 
  p.name as producto,
  cv.color_name as color,
  array_length(cv.images, 1) as num_imagenes,
  cv.stock as stock_color,
  COUNT(ps.id) as num_tallas
FROM products p
JOIN product_color_variants cv ON p.id = cv.product_id
LEFT JOIN product_sizes ps ON ps.color_variant_id = cv.id
GROUP BY p.id, p.name, cv.color_name, cv.images, cv.stock;
