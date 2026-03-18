-- ============================================
-- CREAR TABLA DE CUPONES (si no existe)
-- ============================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Public can read active coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;

CREATE POLICY "Public can read active coupons" 
  ON coupons FOR SELECT 
  TO public 
  USING (active = true);

CREATE POLICY "Admins can manage coupons" 
  ON coupons FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

-- Cupones de ejemplo
INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_uses, active, expires_at)
VALUES 
  ('BIENVENIDO10', 'fixed', 10.00, 0, 999999, true, NULL),
  ('VERANO20', 'percentage', 20, 50.00, 100, true, '2026-08-31 23:59:59'),
  ('PRIMERACOMPRA15', 'percentage', 15, 30.00, 500, true, '2026-12-31 23:59:59')
ON CONFLICT (code) DO NOTHING;

-- Verificación
SELECT 
  code, 
  discount_type, 
  discount_value, 
  min_purchase,
  max_uses,
  uses,
  active,
  expires_at
FROM coupons;
