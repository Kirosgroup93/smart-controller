-- Koppelt een Exact Online factuurnummer aan een PDF in Supabase Storage
create table if not exists public.factuur_pdf_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  factuurnummer text not null,
  pdf_path text not null,
  created_at timestamptz default now(),
  unique(user_id, factuurnummer, pdf_path)
);

alter table public.factuur_pdf_links enable row level security;

create policy "Eigen links lezen" on public.factuur_pdf_links
  for select using (auth.uid() = user_id);

create policy "Eigen links aanmaken" on public.factuur_pdf_links
  for insert with check (auth.uid() = user_id);
