-- ============================================
-- ARREGLAR STORAGE Y POLÍTICAS COMPLETO
-- ============================================

-- 1. ELIMINAR POLÍTICAS ANTERIORES
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 2. VERIFICAR QUE EL BUCKET EXISTE
SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';

-- 3. SI NO EXISTE, CREARLO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880;

-- 4. POLÍTICAS DE LECTURA PÚBLICA (MUY IMPORTANTE)
CREATE POLICY "Anyone can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 5. POLÍTICAS DE SUBIDA (AUTENTICADOS)
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = 'comments'
);

-- 6. POLÍTICAS DE ACTUALIZACIÓN (SOLO PROPIETARIO)
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.uid() = owner
);

-- 7. POLÍTICAS DE ELIMINACIÓN (SOLO PROPIETARIO)
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.uid() = owner
);

-- ============================================
-- VERIFICACIONES
-- ============================================

-- Ver bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'product-images';

-- Ver políticas
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- ============================================
-- TEST RÁPIDO
-- ============================================

-- Ver si hay objetos en el bucket
SELECT 
  name,
  created_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'product-images'
ORDER BY created_at DESC
LIMIT 5;

