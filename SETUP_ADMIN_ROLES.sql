-- 1. Añadir columna role a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- 2. Hacer admin al primer usuario (o el que quieras)
-- IMPORTANTE: Cambia el email por el tuyo
UPDATE users SET role = 'admin' WHERE email = 'demo@sneakerspro.com';

-- También puedes hacer admin por ID
-- UPDATE users SET role = 'admin' WHERE id = 'tu-user-id-aqui';

-- 3. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. Ver usuarios admin
SELECT id, email, name, role FROM users WHERE role = 'admin';

-- ============================================
-- TABLA DE CUPONES
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' o 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);

-- Datos de ejemplo
INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_uses) 
VALUES 
  ('BIENVENIDA10', 'percentage', 10, 0, 1000),
  ('VERANO2026', 'percentage', 20, 50, 500),
  ('ENVIOGRATIS', 'fixed', 5.99, 30, 1000)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- AÑADIR TRACKING A PEDIDOS
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);

-- ============================================
-- CAMPOS ADICIONALES EN ORDERS
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_coupon ON orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- ============================================
-- TABLA DE REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,
  user_name VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Datos de ejemplo
INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment, verified_purchase) 
VALUES 
  ('1', gen_random_uuid(), 'María García', 5, '¡Increíbles!', 'Muy cómodas y perfectas para correr. Las recomiendo totalmente.', true),
  ('1', gen_random_uuid(), 'Juan Pérez', 4, 'Buena calidad', 'Me gustan mucho, aunque un poco caras.', true),
  ('2', gen_random_uuid(), 'Ana Martínez', 5, 'Perfectas', 'Las mejores zapatillas que he tenido.', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- TABLA DE NEWSLETTER
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(active);

-- ============================================
-- TABLA DE NOTIFICACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'order_update', 'promotion', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
