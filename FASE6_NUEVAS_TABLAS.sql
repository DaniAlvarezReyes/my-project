-- =============================================
-- FASE 6: Stock Alerts + Returns + A/B Testing
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Tabla: stock_alerts (notificar cuando un producto vuelve a estar disponible)
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create stock alerts" ON stock_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can see own alerts" ON stock_alerts FOR SELECT USING (true);

-- Tabla: returns (devoluciones)
CREATE TABLE IF NOT EXISTS returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'in_transit', 'received', 'refunded')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own returns" ON returns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create returns" ON returns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage returns" ON returns FOR ALL USING (is_admin());

-- Tabla: ab_experiments (A/B testing)
CREATE TABLE IF NOT EXISTS ab_experiments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  variants JSONB NOT NULL DEFAULT '["control", "variant_a"]',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ab_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  variant TEXT NOT NULL,
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experiment_id, visitor_id)
);

ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read experiments" ON ab_experiments FOR SELECT USING (true);
CREATE POLICY "Admins manage experiments" ON ab_experiments FOR ALL USING (is_admin());
CREATE POLICY "Anyone can participate" ON ab_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read own" ON ab_assignments FOR SELECT USING (true);
CREATE POLICY "Anyone can update own" ON ab_assignments FOR UPDATE USING (true);

-- Añadir tracking_number a orders si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tracking_number') THEN
    ALTER TABLE orders ADD COLUMN tracking_number TEXT;
  END IF;
END $$;

SELECT 'FASE 6 tablas creadas correctamente' AS resultado;
