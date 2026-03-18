# 🪣 CREAR BUCKET EN SUPABASE - PASO A PASO

## 📋 OPCIÓN 1: CREAR BUCKET DESDE LA INTERFAZ

### Paso 1: Ir a Storage
```
1. Abre tu proyecto en Supabase Dashboard
2. Click en "Storage" en el menú lateral
3. Click en "Create a new bucket"
```

### Paso 2: Configurar bucket
```
Nombre del bucket: product-images
Public bucket: ✅ SÍ (activar)
File size limit: 5 MB
Allowed MIME types: image/*
```

### Paso 3: Click "Create bucket"

---

## 📋 OPCIÓN 2: CREAR BUCKET CON SQL

Si la opción 1 no funciona, ejecuta este SQL en Supabase:

```sql
-- Crear bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Políticas para subida (usuarios autenticados)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Política para actualizar (solo el usuario que subió)
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() = owner);

-- Política para eliminar (solo el usuario que subió)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() = owner);
```

---

## ✅ VERIFICAR QUE FUNCIONA

```sql
-- Ver todos los buckets
SELECT * FROM storage.buckets;

-- Debe aparecer 'product-images' con public = true
```

---

## 🔧 SI QUIERES USAR BUCKET ALTERNATIVO

Si no puedes crear el bucket, puedes usar el bucket público por defecto:

### Modificar ProductComments.tsx:

```typescript
// Buscar esta línea (aprox línea 92):
const { data: data1, error: error1 } = await supabase.storage
  .from('product-images')  // ← Cambiar por el nombre de tu bucket
  .upload(filePath, file);
```

**Buckets comunes:**
- `product-images` (recomendado)
- `public` (genérico)
- `avatars` (si existe)
- `media` (si existe)

---

## 🎯 CONFIGURACIÓN RECOMENDADA

```
Bucket: product-images
├── Public: ✅ YES
├── File size limit: 5 MB
├── Allowed MIME: image/jpeg, image/png, image/webp
└── Estructura:
    └── comments/
        ├── 1234567890_abc.jpg
        ├── 1234567891_def.png
        └── ...
```

---

## 🐛 TROUBLESHOOTING

### Error: "Bucket not found"
**Solución:** El bucket no existe. Crear con OPCIÓN 1 o 2.

### Error: "Access denied"
**Solución:** Bucket no es público. Ejecutar:
```sql
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';
```

### Error: "Policy violation"
**Solución:** Faltan políticas. Ejecutar políticas de OPCIÓN 2.

---

## ✅ VERIFICACIÓN FINAL

```bash
# En tu app, abre la consola del navegador
# Intenta subir una imagen en un comentario
# Si funciona verás:
✅ Imagen subida correctamente
✅ URL pública generada

# Si falla verás:
❌ "Bucket not found"
❌ "Policy violation"
```

---

**Tiempo estimado:** 2-3 minutos  
**Dificultad:** Fácil ⭐
