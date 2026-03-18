-- ============================================
-- TABLA DE COMENTARIOS CON FOTOS
-- ============================================

CREATE TABLE IF NOT EXISTS product_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  images TEXT[], -- Array de URLs de imágenes
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_comments_product ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON product_comments(created_at DESC);

-- RLS (Row Level Security) - todos pueden leer, solo el usuario puede crear/editar
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver comentarios"
  ON product_comments FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear comentarios"
  ON product_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden editar sus propios comentarios"
  ON product_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios comentarios"
  ON product_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

INSERT INTO product_comments (product_id, user_id, user_name, user_email, rating, comment, images, verified_purchase)
VALUES 
  ('1', gen_random_uuid(), 'María García', 'maria@email.com', 5, '¡Increíbles zapatillas! Muy cómodas y el diseño es espectacular. Las uso todos los días.', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'], true),
  ('1', gen_random_uuid(), 'Juan Pérez', 'juan@email.com', 4, 'Muy buena calidad, aunque un poco caras. Pero valen la pena.', ARRAY[]::TEXT[], true),
  ('2', gen_random_uuid(), 'Ana Martínez', 'ana@email.com', 5, 'Las mejores zapatillas que he tenido. Super recomendadas!', ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'], true),
  ('3', gen_random_uuid(), 'Carlos López', 'carlos@email.com', 5, 'Para correr son perfectas. Muy ligeras y con buen soporte.', ARRAY[]::TEXT[], true)
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_comments_updated_at BEFORE UPDATE
  ON product_comments FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
