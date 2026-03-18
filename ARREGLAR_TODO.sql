-- ============================================
-- ARREGLO COMPLETO PARA PROFILES (NO USERS)
-- ============================================

-- 1. AÑADIR COLUMNA ROLE A PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- 2. HACER ADMIN A TU EMAIL
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'danielalvarezreyes99@gmail.com';

-- 3. VERIFICAR QUE SE APLICÓ
SELECT id, email, name, role 
FROM profiles 
WHERE email = 'danielalvarezreyes99@gmail.com';

-- 4. CREAR ÍNDICE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- TABLA DE COMENTARIOS
-- ============================================

-- Eliminar tabla anterior si existe
DROP TABLE IF EXISTS product_comments CASCADE;

-- Crear tabla correcta
CREATE TABLE product_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  images TEXT[],
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_comments_product ON product_comments(product_id);
CREATE INDEX idx_comments_user ON product_comments(user_id);
CREATE INDEX idx_comments_created ON product_comments(created_at DESC);

-- RLS
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver comentarios" ON product_comments;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear comentarios" ON product_comments;
DROP POLICY IF EXISTS "Usuarios pueden editar sus propios comentarios" ON product_comments;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios comentarios" ON product_comments;

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

-- Función para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_comments_updated_at ON product_comments;

CREATE TRIGGER update_product_comments_updated_at 
  BEFORE UPDATE ON product_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo
INSERT INTO product_comments (product_id, user_id, user_name, user_email, rating, comment, images, verified_purchase)
SELECT 
  '1',
  id,
  'Usuario Demo',
  email,
  5,
  '¡Excelente producto! Muy recomendado.',
  ARRAY[]::TEXT[],
  true
FROM auth.users
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICACIONES FINALES
-- ============================================

-- Ver admins
SELECT email, name, role FROM profiles WHERE role = 'admin';

-- Ver si existe tabla comentarios
SELECT COUNT(*) as total_comentarios FROM product_comments;

-- Ver estructura de profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

