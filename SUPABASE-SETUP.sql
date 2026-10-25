-- Run once in the Supabase SQL Editor for the target project.
-- This creates new tables only; it does not drop or reset existing tables.
CREATE TABLE IF NOT EXISTS public.app_users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  cnic CHAR(13) NOT NULL UNIQUE CHECK (cnic ~ '^[0-9]{13}$'),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_state (
  key TEXT PRIMARY KEY CHECK (key IN (
    'districtMedicineHospitals',
    'districtMedicineMedicines',
    'districtMedicineOutflows'
  )),
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The application server uses the PostgreSQL connection string; never put it in frontend JS.
-- Do not enable public table access. These tables should not be exposed through the Supabase Data API.
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.app_users FROM anon, authenticated;
REVOKE ALL ON TABLE public.app_state FROM anon, authenticated;
