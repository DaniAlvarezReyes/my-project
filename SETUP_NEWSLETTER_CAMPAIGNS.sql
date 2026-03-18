-- ============================================
-- TABLA OPCIONAL: NEWSLETTER CAMPAIGNS
-- ============================================
-- Para guardar historial de envíos de emails (opcional)

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  recipients TEXT[], -- Array de emails
  sent_at TIMESTAMP DEFAULT NOW(),
  sent_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at 
  ON newsletter_campaigns(created_at DESC);

-- RLS
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver y crear campañas
CREATE POLICY "Admins can view campaigns" ON newsletter_campaigns FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can create campaigns" ON newsletter_campaigns FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Verificar
SELECT * FROM newsletter_campaigns LIMIT 10;
