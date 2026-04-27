-- Signals table for RADAR Alea
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('boe', 'concursos', 'boletin_urbanistico', 'network', 'architect', 'century21', 'family_office', 'manual')),
  source_url TEXT,
  source_reference TEXT,
  title TEXT NOT NULL,
  asset_type TEXT DEFAULT 'RESIDENTIAL',
  location_hint TEXT,
  address TEXT,
  price NUMERIC,
  price_raw TEXT,
  meters NUMERIC,
  vendor_name TEXT,
  description TEXT,
  alea_score INTEGER DEFAULT 50,
  score_classification TEXT DEFAULT 'medium' CHECK (score_classification IN ('exceptional', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'reviewing', 'contacted', 'qualified', 'rejected', 'converted')),
  raw_data JSONB,
  property_id UUID REFERENCES properties(id),
  investor_id UUID REFERENCES investors(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_source ON signals(source);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_score ON signals(alea_score DESC);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);

-- Signal scan history
CREATE TABLE IF NOT EXISTS radar_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  signals_found INTEGER DEFAULT 0,
  signals_created INTEGER DEFAULT 0,
  errors TEXT[],
  duration_ms INTEGER,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_scan_logs_at ON radar_scan_logs(scanned_at DESC);
