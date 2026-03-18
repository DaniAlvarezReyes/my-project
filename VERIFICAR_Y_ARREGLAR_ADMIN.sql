-- ============================================
-- SCRIPT PARA VERIFICAR Y ARREGLAR ADMIN
-- ============================================

-- 1. Verificar si la columna role existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';

-- 2. Añadir columna role si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- 3. Verificar usuario actual
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'danielalvarezreyes99@gmail.com';

-- 4. Si el usuario existe, hacer admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'danielalvarezreyes99@gmail.com';

-- 5. Si el usuario NO existe en la tabla users, pero SÍ en auth.users:
-- Necesitamos crear el registro

-- Primero, obtener el user_id de auth.users
-- (Ejecuta esto y copia el ID)
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'danielalvarezreyes99@gmail.com';

-- Luego, inserta manualmente (sustituye 'USER_ID_AQUI' con el ID de arriba):
/*
INSERT INTO users (id, email, name, role, created_at)
VALUES (
  'USER_ID_AQUI',
  'danielalvarezreyes99@gmail.com',
  'Daniel',
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
*/

-- 6. Verificación final
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  au.email as auth_email
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'danielalvarezreyes99@gmail.com'
   OR au.email = 'danielalvarezreyes99@gmail.com';

-- 7. Crear índice si no existe
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- VERIFICACIÓN RÁPIDA
-- ============================================

-- Ver TODOS los usuarios con role
SELECT email, role FROM users ORDER BY created_at DESC;

-- Ver usuarios que son admin
SELECT id, email, name, role FROM users WHERE role = 'admin';
