-- ============================================
-- HACER ADMIN A TU USUARIO ESPECÍFICO
-- ============================================

-- Hacer admin al usuario danielalvarezreyes99@gmail.com
UPDATE users 
SET role = 'admin' 
WHERE email = 'danielalvarezreyes99@gmail.com';

-- Verificar que se aplicó correctamente
SELECT id, email, name, role 
FROM users 
WHERE email = 'danielalvarezreyes99@gmail.com';

-- Si el usuario aún no existe en la tabla users (solo en auth.users),
-- este script lo creará cuando se loguee por primera vez.
-- El AuthContext se encargará de crearlo automáticamente.
