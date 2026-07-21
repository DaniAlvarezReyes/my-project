-- ============================================================================
-- SCHEMA-EXTRA.SQL — Completa el esquema que el código ya utiliza
-- Ejecutar DESPUÉS de schema.sql en: Supabase Dashboard > SQL Editor
-- Idempotente: puede ejecutarse varias veces sin romper nada.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES: columna `role` (el panel /admin depende de ella)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
  CHECK (role IN ('customer', 'admin'));

-- Función auxiliar: ¿es admin el usuario actual? (SECURITY DEFINER evita
-- recursión infinita en las políticas RLS de profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Los admins pueden ver y gestionar todos los perfiles (panel /admin/usuarios)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ORDERS: permitir checkout de invitados (el código inserta user_id NULL)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS "Guests can insert orders" ON orders;
CREATE POLICY "Guests can insert orders" ON orders FOR INSERT
  WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Guests can insert order items" ON order_items;
CREATE POLICY "Guests can insert order items" ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL))
  );

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (public.is_admin());

-- Los admins pueden gestionar productos (panel /admin/productos)
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (public.is_admin());

-- handle_new_user: incluir last_name (el registro lo envía en metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Canje de puntos de fidelidad: se persiste en el pedido para poder descontarlos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_discount DECIMAL(10,2) NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. CART_ITEMS (CartContext sincroniza el carrito aquí)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_size TEXT,
  selected_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
-- El upsert usa onConflict(user_id,product_id,selected_size,selected_color):
-- con NULLs se necesita un índice único sobre COALESCE
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_items_combo
  ON cart_items (user_id, product_id, COALESCE(selected_size, ''), COALESCE(selected_color, ''));

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own cart" ON cart_items;
CREATE POLICY "Users manage own cart" ON cart_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. COUPONS + RPC increment_coupon_uses (checkout los usa)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active coupons" ON coupons;
CREATE POLICY "Anyone can read active coupons" ON coupons FOR SELECT USING (active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage coupons" ON coupons;
CREATE POLICY "Admins manage coupons" ON coupons FOR ALL USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.increment_coupon_uses(coupon_id UUID)
RETURNS VOID AS $$
  UPDATE coupons SET uses = uses + 1 WHERE id = coupon_id AND uses < max_uses;
$$ LANGUAGE sql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. FAVORITES (FavoritesContext)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, product_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own favorites" ON favorites;
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. REVIEWS (ReviewSection) — reseñas con título
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT 'Usuario',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are public" ON reviews;
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert reviews" ON reviews;
CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- El voto "útil" se hace vía RPC (no se permite UPDATE directo a cualquiera)
DROP POLICY IF EXISTS "Anyone can mark helpful" ON reviews;
CREATE OR REPLACE FUNCTION public.increment_helpful(review_id UUID)
RETURNS VOID AS $$
  UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = review_id;
$$ LANGUAGE sql SECURITY DEFINER;
DROP POLICY IF EXISTS "Admins manage reviews" ON reviews;
CREATE POLICY "Admins manage reviews" ON reviews FOR ALL USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 7. PRODUCT_COMMENTS (comentarios con fotos de la comunidad)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT 'Usuario',
  user_email TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  images TEXT[],
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments are public" ON product_comments;
CREATE POLICY "Comments are public" ON product_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert comments" ON product_comments;
CREATE POLICY "Users can insert comments" ON product_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins manage comments" ON product_comments;
CREATE POLICY "Admins manage comments" ON product_comments FOR ALL USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 8. VARIANTES DE COLOR Y TALLAS (ficha de producto avanzada)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_color_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT,
  images TEXT[],
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  color_variant_id UUID REFERENCES product_color_variants(id) ON DELETE CASCADE NOT NULL,
  size TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE product_color_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Variants are public" ON product_color_variants;
CREATE POLICY "Variants are public" ON product_color_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage variants" ON product_color_variants;
CREATE POLICY "Admins manage variants" ON product_color_variants FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Sizes are public" ON product_sizes;
CREATE POLICY "Sizes are public" ON product_sizes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage sizes" ON product_sizes;
CREATE POLICY "Admins manage sizes" ON product_sizes FOR ALL USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 9. RETURNS / DEVOLUCIONES (cuenta + admin)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'approved', 'rejected', 'received', 'refunded')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own returns" ON returns;
CREATE POLICY "Users manage own returns" ON returns FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 10. NOTIFICATIONS (campana de notificaciones + admin)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins manage notifications" ON notifications;
CREATE POLICY "Admins manage notifications" ON notifications FOR ALL USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 11. NEWSLETTER (suscriptores + campañas del admin)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  message TEXT,
  recipients TEXT[],
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins manage subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins manage subscribers" ON newsletter_subscribers FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage campaigns" ON newsletter_campaigns;
CREATE POLICY "Admins manage campaigns" ON newsletter_campaigns FOR ALL USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 12. ALERTAS: precio y stock (PriceAlert / StockAlert)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  target_price DECIMAL(10,2),
  current_price DECIMAL(10,2),
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (product_id, email)
);
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (product_id, email)
);
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create price alerts" ON price_alerts;
CREATE POLICY "Anyone can create price alerts" ON price_alerts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can create stock alerts" ON stock_alerts;
CREATE POLICY "Anyone can create stock alerts" ON stock_alerts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins manage price alerts" ON price_alerts;
CREATE POLICY "Admins manage price alerts" ON price_alerts FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage stock alerts" ON stock_alerts;
CREATE POLICY "Admins manage stock alerts" ON stock_alerts FOR ALL USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 13. CONTACT_MESSAGES (formulario de contacto)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can send contact messages" ON contact_messages;
CREATE POLICY "Anyone can send contact messages" ON contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read contact messages" ON contact_messages;
CREATE POLICY "Admins read contact messages" ON contact_messages FOR ALL USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 14. A/B TESTING (lib/abTesting.tsx)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ab_experiments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  variants TEXT[] NOT NULL DEFAULT ARRAY['A','B'],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS ab_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE NOT NULL,
  visitor_id TEXT NOT NULL,
  variant TEXT NOT NULL,
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (experiment_id, visitor_id)
);
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Experiments are public" ON ab_experiments;
CREATE POLICY "Experiments are public" ON ab_experiments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can be assigned" ON ab_assignments;
CREATE POLICY "Anyone can be assigned" ON ab_assignments FOR ALL USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- 15. TRIGGERS DE STOCK (el código comenta que existen — aquí están de verdad)
-- ────────────────────────────────────────────────────────────────────────────
-- Descuenta stock al insertar items de pedido
CREATE OR REPLACE FUNCTION public.fn_decrement_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - NEW.quantity),
      in_stock = (GREATEST(0, stock - NEW.quantity) > 0)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_decrement_stock ON order_items;
CREATE TRIGGER trigger_decrement_stock
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_decrement_product_stock();

-- Restaura stock si un pedido pasa a 'cancelled'
CREATE OR REPLACE FUNCTION public.fn_restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE products p
    SET stock = p.stock + oi.quantity,
        in_stock = true
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_restore_stock_on_cancel ON orders;
CREATE TRIGGER trigger_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.fn_restore_stock_on_cancel();

-- ────────────────────────────────────────────────────────────────────────────
-- 16. STORAGE: bucket para imágenes de comentarios/productos (ImageUploader)
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Authenticated upload product images" ON storage.objects;
CREATE POLICY "Authenticated upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- ────────────────────────────────────────────────────────────────────────────
-- 17. ÍNDICES adicionales
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_comments_product ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_user ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_color_variants(product_id);

-- Cupón de ejemplo para probar el checkout
INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_uses, active)
VALUES ('BIENVENIDA10', 'percentage', 10, 30, 1000, true)
ON CONFLICT (code) DO NOTHING;
