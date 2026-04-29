-- Create the campaigns table for Ad Spend Optimizer
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ENABLED',
  platform TEXT NOT NULL,
  type TEXT NOT NULL,
  daily_budget NUMERIC NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC NOT NULL DEFAULT 0,
  avg_cpc NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  roas NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disable RLS for simplicity (API routes handle auth via x-api-key)
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
