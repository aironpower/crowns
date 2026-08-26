-- Crowns · esquema inicial
-- Ejecuta este archivo entero en Supabase → SQL Editor (o con `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- perfiles
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  username     text not null unique check (username ~ '^[a-zA-Z0-9_-]{3,20}$'),
  display_name text check (char_length(display_name) <= 40),
  locale       text not null default 'es' check (locale in ('es','en','fr','ca','pt','de')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Perfil público de cada jugador.';

-- ----------------------------------------------------------------- puzles
-- Los tableros se generan en el cliente de forma determinista y se registran
-- aquí la primera vez que alguien resuelve uno. `fingerprint` es el tablero
-- canónico ("8:0011223...") y sirve de identidad: el mismo tablero, una fila.
create table if not exists public.puzzles (
  id          uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  size        smallint not null check (size between 5 and 10),
  regions     smallint[] not null,
  solution    smallint[] not null,
  daily_date  date,
  created_at  timestamptz not null default now()
);

create unique index if not exists puzzles_daily_date_idx
  on public.puzzles (daily_date) where daily_date is not null;

-- --------------------------------------------------------------- partidas
create table if not exists public.plays (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  puzzle_id   uuid not null references public.puzzles on delete cascade,
  mode        text not null default 'practice' check (mode in ('daily','practice')),
  duration_ms integer not null check (duration_ms between 1000 and 86400000),
  hints       smallint not null default 0 check (hints >= 0),
  moves       integer not null default 0 check (moves >= 0),
  played_on   date not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists plays_user_idx    on public.plays (user_id, created_at desc);
create index if not exists plays_puzzle_idx  on public.plays (puzzle_id, duration_ms);
create index if not exists plays_created_idx on public.plays (created_at desc);
-- del puzle diario solo cuenta el primer intento de cada jugador
create unique index if not exists plays_daily_unique
  on public.plays (user_id, puzzle_id) where mode = 'daily';

-- ------------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.puzzles  enable row level security;
alter table public.plays    enable row level security;

drop policy if exists "perfiles visibles" on public.profiles;
create policy "perfiles visibles" on public.profiles for select using (true);

drop policy if exists "crear el perfil propio" on public.profiles;
create policy "crear el perfil propio" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "editar el perfil propio" on public.profiles;
create policy "editar el perfil propio" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "puzles visibles" on public.puzzles;
create policy "puzles visibles" on public.puzzles for select using (true);

drop policy if exists "partidas visibles" on public.plays;
create policy "partidas visibles" on public.plays for select using (true);

-- Nadie escribe directamente en puzzles ni en plays: solo a través de
-- submit_play(), que comprueba que la solución enviada cumple las reglas.

-- ------------------------------------------- perfil automático al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base      text;
  candidate text;
  suffix    int := 0;
  meta_loc  text;
begin
  base := regexp_replace(
    coalesce(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'preferred_username',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'player'), '@', 1)
    ), '[^a-zA-Z0-9_-]', '', 'g');
  base := left(coalesce(nullif(base, ''), 'player'), 16);
  if char_length(base) < 3 then base := base || 'player'; end if;

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := left(base, 15) || suffix::text;
  end loop;

  meta_loc := new.raw_user_meta_data->>'locale';
  if meta_loc is null or meta_loc not in ('es','en','fr','ca','pt','de') then
    meta_loc := 'es';
  end if;

  insert into public.profiles (id, username, display_name, locale)
  values (new.id, candidate, nullif(new.raw_user_meta_data->>'name', ''), meta_loc)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------- validación de las reglas
-- Las mismas reglas que en el cliente, para que el servidor no se fíe de nadie.
create or replace function public.is_valid_crowns(p_size int, p_regions smallint[], p_solution smallint[])
returns boolean language plpgsql immutable as $$
declare
  i int; col int; prev int := -3; reg int;
  seen_cols boolean[]; seen_regs boolean[];
begin
  if p_size < 5 or p_size > 10 then return false; end if;
  if coalesce(array_length(p_regions, 1), 0) <> p_size * p_size then return false; end if;
  if coalesce(array_length(p_solution, 1), 0) <> p_size then return false; end if;

  foreach reg in array p_regions loop
    if reg < 0 or reg >= p_size then return false; end if;
  end loop;

  seen_cols := array_fill(false, array[p_size]);
  seen_regs := array_fill(false, array[p_size]);
  for i in 1..p_size loop
    col := p_solution[i];
    if col < 0 or col >= p_size then return false; end if;
    if seen_cols[col + 1] then return false; end if;            -- columna repetida
    seen_cols[col + 1] := true;
    if abs(col - prev) <= 1 then return false; end if;          -- coronas que se tocan
    prev := col;
    reg := p_regions[(i - 1) * p_size + col + 1];
    if seen_regs[reg + 1] then return false; end if;            -- región repetida
    seen_regs[reg + 1] := true;
  end loop;
  return true;
end $$;

-- Las regiones deben venir numeradas por orden de aparición (0,1,2,…): así el
-- mismo tablero produce siempre el mismo fingerprint.
create or replace function public.is_canonical(p_size int, p_regions smallint[])
returns boolean language plpgsql immutable as $$
declare
  r int; next_id int := 0; seen boolean[];
begin
  if coalesce(array_length(p_regions, 1), 0) <> p_size * p_size then return false; end if;
  seen := array_fill(false, array[p_size]);
  foreach r in array p_regions loop
    if r < 0 or r >= p_size then return false; end if;
    if not seen[r + 1] then
      if r <> next_id then return false; end if;
      seen[r + 1] := true;
      next_id := next_id + 1;
    end if;
  end loop;
  return next_id = p_size;
end $$;

-- ------------------------------------------------ registrar una partida
create or replace function public.submit_play(
  p_size        int,
  p_regions     smallint[],
  p_solution    smallint[],
  p_duration_ms int,
  p_hints       int  default 0,
  p_moves       int  default 0,
  p_mode        text default 'practice',
  p_daily_date  date default null
) returns public.plays
language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_fp     text;
  v_puzzle public.puzzles;
  v_play   public.plays;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using hint = 'Inicia sesión para guardar partidas.';
  end if;
  if p_mode not in ('daily','practice') then raise exception 'BAD_MODE'; end if;
  if not public.is_canonical(p_size, p_regions) then raise exception 'BAD_REGIONS'; end if;
  if not public.is_valid_crowns(p_size, p_regions, p_solution) then raise exception 'BAD_SOLUTION'; end if;
  if p_duration_ms < 1000 or p_duration_ms > 86400000 then raise exception 'BAD_DURATION'; end if;

  v_fp := p_size || ':' || array_to_string(p_regions, '');

  insert into public.puzzles (fingerprint, size, regions, solution, daily_date)
  values (v_fp, p_size, p_regions, p_solution,
          case when p_mode = 'daily' then p_daily_date end)
  on conflict (fingerprint) do update
    set daily_date = coalesce(public.puzzles.daily_date, excluded.daily_date)
  returning * into v_puzzle;

  insert into public.plays (user_id, puzzle_id, mode, duration_ms, hints, moves, played_on)
  values (v_user, v_puzzle.id, p_mode, p_duration_ms,
          greatest(p_hints, 0), greatest(p_moves, 0),
          coalesce(p_daily_date, current_date))
  on conflict do nothing
  returning * into v_play;

  if v_play is null then   -- ya había jugado este diario: devolvemos aquella partida
    select * into v_play from public.plays
      where user_id = v_user and puzzle_id = v_puzzle.id order by created_at limit 1;
  end if;
  return v_play;
end $$;

revoke all on function public.submit_play(int, smallint[], smallint[], int, int, int, text, date) from public;
grant execute on function public.submit_play(int, smallint[], smallint[], int, int, int, text, date) to authenticated;

-- ------------------------------------------------------------------ vistas
create or replace view public.recent_activity with (security_invoker = true) as
  select pl.id, pl.created_at, pl.duration_ms, pl.hints, pl.mode,
         pz.size, pz.fingerprint, pz.daily_date,
         pr.id as user_id, pr.username, pr.display_name
  from public.plays pl
  join public.puzzles  pz on pz.id = pl.puzzle_id
  join public.profiles pr on pr.id = pl.user_id
  order by pl.created_at desc;

create or replace view public.leaderboard_by_size with (security_invoker = true) as
  select pz.size,
         pr.id as user_id, pr.username, pr.display_name,
         min(pl.duration_ms) filter (where pl.hints = 0) as best_ms,
         count(*) as solved,
         max(pl.created_at) as last_played
  from public.plays pl
  join public.puzzles  pz on pz.id = pl.puzzle_id
  join public.profiles pr on pr.id = pl.user_id
  group by pz.size, pr.id, pr.username, pr.display_name;

create or replace view public.daily_leaderboard with (security_invoker = true) as
  select pz.daily_date, pz.size, pl.duration_ms, pl.hints, pl.created_at,
         pr.id as user_id, pr.username, pr.display_name
  from public.plays pl
  join public.puzzles  pz on pz.id = pl.puzzle_id
  join public.profiles pr on pr.id = pl.user_id
  where pl.mode = 'daily' and pz.daily_date is not null;

create or replace view public.player_stats with (security_invoker = true) as
  select pr.id as user_id, pr.username, pr.display_name, pr.created_at as joined_at,
         count(pl.id) as solved,
         count(pl.id) filter (where pl.mode = 'daily') as dailies,
         count(pl.id) filter (where pl.hints = 0) as clean_solves,
         min(pl.duration_ms) as best_ms,
         round(avg(pl.duration_ms))::int as avg_ms,
         max(pl.created_at) as last_played
  from public.profiles pr
  left join public.plays pl on pl.user_id = pr.id
  group by pr.id, pr.username, pr.display_name, pr.created_at;

grant select on public.recent_activity, public.leaderboard_by_size,
                public.daily_leaderboard, public.player_stats to anon, authenticated;

-- Actividad en vivo (opcional): si la publicación de realtime existe, añadimos plays.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.plays;
  end if;
exception when duplicate_object then null;
end $$;
