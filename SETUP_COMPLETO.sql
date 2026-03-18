
-- ============================================
-- AÑADIR COLUMNA ROLE SI NO EXISTE
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastName VARCHAR(255);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- IMPORTANTE: Hacer admin a tu usuario
-- Cambia el email por el tuyo si es diferente
UPDATE users 
SET role = 'admin' 
WHERE email = 'danielalvarezreyes99@gmail.com';
