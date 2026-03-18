-- ============================================
-- ARREGLAR POLÍTICAS RLS DE STORAGE
-- ============================================

-- 1. ELIMINAR POLÍTICAS ANTIGUAS CONFLICTIVAS
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- 2. VERIFICAR QUE EL BUCKET EXISTE Y ES PÚBLICO
DO $$
BEGIN
  -- Actualizar bucket para que sea público
  UPDATE storage.buckets 
  SET public = true 
  WHERE id = 'product-images';
  
  -- Si no existe, crearlo
  IF NOT FOUND THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'product-images',
      'product-images',
      true,
      10485760, -- 10MB
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
    );
  END IF;
END $$;

-- 3. CREAR POLÍTICAS CORRECTAS PARA LECTURA PÚBLICA
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 4. CREAR POLÍTICAS PARA SUBIDA DE USUARIOS AUTENTICADOS
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
);

-- 5. CREAR POLÍTICAS PARA ACTUALIZAR (opcional)
CREATE POLICY "Users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- 6. CREAR POLÍTICAS PARA ELIMINAR (opcional)
CREATE POLICY "Users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- ============================================
-- VERIFICACIONES
-- ============================================

-- Ver configuración del bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'product-images';

-- Ver políticas activas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%product%';

-- Test: Intentar ver objetos (debe funcionar)
SELECT 
  name,
  created_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'product-images'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- INFORMACIÓN
-- ============================================

/*
IMPORTANTE:

1. El bucket DEBE ser público (public = true)
   - Esto permite que las URLs públicas funcionen
   - Sin esto, las imágenes no se verán en el frontend

2. Las políticas RLS permiten:
   - SELECT (público): Cualquiera puede VER las imágenes
   - INSERT (autenticado): Usuarios autenticados pueden SUBIR
   - UPDATE (autenticado): Usuarios autenticados pueden ACTUALIZAR
   - DELETE (autenticado): Usuarios autenticados pueden ELIMINAR

3. Si sigues teniendo errores:
   - Verifica que estás autenticado (user?.id existe)
   - Verifica que el bucket es público en Dashboard
   - Verifica que las políticas están activas

4. Para probar la subida:
   - Abre consola del navegador (F12)
   - Intenta subir una imagen
   - Verifica los logs en la consola
   - Debe mostrar: "✅ Archivo subido: ..."

5. Si aún falla con "RLS policy":
   - Ve a Supabase Dashboard → Storage
   - Click en product-images
   - Pestaña "Policies"
   - Verifica que estén las 4 políticas
   - Verifica que "Public" esté en ON
*/
