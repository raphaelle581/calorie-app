-- Mon Budget Calorique : mise en place de la base Supabase
-- À coller dans Supabase → SQL Editor → New query → Run.
-- Sans danger à relancer : ne crée que ce qui manque et ne supprime aucune donnée.

-- 1. Tables (créées seulement si elles n'existent pas encore)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  sex text,
  weight numeric,
  height numeric,
  age integer,
  activity text,
  goal text
);

create table if not exists public.logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  name text not null,
  kcal numeric not null,
  qty numeric not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists logs_user_date_idx on public.logs (user_id, log_date);

-- 2. Droits d'accès pour les utilisateurs connectés (l'app passe par l'API Supabase)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.logs to authenticated;

-- 3. Row Level Security : chacun ne voit et ne modifie que ses propres données
alter table public.profiles enable row level security;
alter table public.logs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "logs_select_own" on public.logs;
drop policy if exists "logs_insert_own" on public.logs;
drop policy if exists "logs_update_own" on public.logs;
drop policy if exists "logs_delete_own" on public.logs;
create policy "logs_select_own" on public.logs for select to authenticated using (auth.uid() = user_id);
create policy "logs_insert_own" on public.logs for insert to authenticated with check (auth.uid() = user_id);
create policy "logs_update_own" on public.logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "logs_delete_own" on public.logs for delete to authenticated using (auth.uid() = user_id);

-- 4. Demande à l'API Supabase de relire la structure des tables
--    (utile juste après la réactivation d'un projet en pause)
notify pgrst, 'reload schema';
