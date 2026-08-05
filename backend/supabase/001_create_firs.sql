create table if not exists public.firs (
  id uuid primary key default gen_random_uuid(),
  fir_number text not null unique,
  complainant_name text not null,
  complainant_email text not null,
  incident_date date not null,
  location text not null,
  description text not null,
  status text not null default 'Registered' check (status in ('Registered', 'Under Review', 'Investigation Open', 'Evidence Pending', 'Charge Sheet Filed', 'Closed')),
  legal_analysis jsonb not null default '{}'::jsonb,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.firs enable row level security;

-- The backend uses the Supabase service-role key. Do not expose that key to the frontend.
