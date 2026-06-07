-- Smart Controller: Supabase database schema
-- Uitvoeren in: Supabase Dashboard > SQL Editor

-- Tabel voor Exact Online OAuth tokens per gebruiker
CREATE TABLE IF NOT EXISTS exact_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  division INTEGER NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabel voor financiële snapshots (historische data)
CREATE TABLE IF NOT EXISTS financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  division INTEGER NOT NULL,
  snapshot_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('balance_sheet', 'profit_loss', 'receivables', 'payables')),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_exact_connections_user_id ON exact_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_snapshots_user_id ON financial_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_snapshots_type_date ON financial_snapshots(user_id, type, snapshot_date DESC);

-- Row Level Security: elke gebruiker ziet alleen eigen data
ALTER TABLE exact_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exact_connections' AND policyname = 'Users can manage own exact connection'
  ) THEN
    CREATE POLICY "Users can manage own exact connection"
      ON exact_connections FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_snapshots' AND policyname = 'Users can manage own snapshots'
  ) THEN
    CREATE POLICY "Users can manage own snapshots"
      ON financial_snapshots FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Automatisch updated_at bijwerken
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_exact_connections_updated_at'
  ) THEN
    CREATE TRIGGER trigger_exact_connections_updated_at
      BEFORE UPDATE ON exact_connections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
