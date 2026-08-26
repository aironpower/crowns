-- Crowns · ligas privadas
-- Ejecuta este archivo en Supabase → SQL Editor (o con `supabase db push`).
--
-- Un grupo cerrado con su propio ranking del puzle del día. Se entra con un
-- código corto, como el enlace de un tablero.

-- Comprobación de orden: sin la migración anterior, el error que sale es
-- confuso ("relation does not exist" en mitad del archivo).
do $$ begin
  if to_regclass('public.profiles') is null then
    raise exception 'Falta 0001_init.sql: aplícala antes que esta.';
  end if;
end $$;

create table if not exists public.leagues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 2 and 40),
  code       text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  owner_id   uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues on delete cascade,
  user_id   uuid not null references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create index if not exists league_members_user_idx on public.league_members (user_id);

alter table public.leagues        enable row level security;
alter table public.league_members enable row level security;

-- ------------------------------------------------------------------- RLS
-- Una política que consulte league_members desde league_members se muerde la
-- cola (recursión infinita). Con una función security definer se rompe el ciclo.
create or replace function public.is_league_member(p_league uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.league_members
     where league_id = p_league and user_id = p_user
  );
$$;

drop policy if exists "ligas propias visibles" on public.leagues;
create policy "ligas propias visibles" on public.leagues for select
  using (public.is_league_member(id, auth.uid()));

drop policy if exists "el dueño edita su liga" on public.leagues;
create policy "el dueño edita su liga" on public.leagues for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "el dueño borra su liga" on public.leagues;
create policy "el dueño borra su liga" on public.leagues for delete
  using (owner_id = auth.uid());

drop policy if exists "miembros visibles dentro de la liga" on public.league_members;
create policy "miembros visibles dentro de la liga" on public.league_members for select
  using (public.is_league_member(league_id, auth.uid()));

drop policy if exists "salirse de una liga" on public.league_members;
create policy "salirse de una liga" on public.league_members for delete
  using (user_id = auth.uid());

-- Crear liga y unirse pasan por funciones: así el código no se puede sondear
-- desde fuera ni apuntarse a nadie más que a uno mismo.

-- ------------------------------------------------------------- crear liga
create or replace function public.create_league(p_name text)
returns public.leagues
language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_code   text;
  v_league public.leagues;
  v_try    int := 0;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'BAD_NAME'; end if;
  if (select count(*) from public.leagues where owner_id = v_user) >= 10 then
    raise exception 'TOO_MANY_LEAGUES';
  end if;

  loop
    v_try := v_try + 1;
    -- Seis caracteres sin vocales: evita códigos que formen palabras.
    v_code := upper(substr(translate(encode(gen_random_bytes(8), 'base64'), 'AEIOUaeiou+/=', 'BCDFGHJKLM'), 1, 6));
    exit when not exists (select 1 from public.leagues where code = v_code);
    if v_try > 20 then raise exception 'CODE_EXHAUSTED'; end if;
  end loop;

  insert into public.leagues (name, code, owner_id)
  values (trim(p_name), v_code, v_user)
  returning * into v_league;

  insert into public.league_members (league_id, user_id) values (v_league.id, v_user);
  return v_league;
end $$;

-- -------------------------------------------------------------- unirse
create or replace function public.join_league(p_code text)
returns public.leagues
language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_league public.leagues;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_league from public.leagues where code = upper(trim(coalesce(p_code, '')));
  if not found then raise exception 'LEAGUE_NOT_FOUND'; end if;

  insert into public.league_members (league_id, user_id)
  values (v_league.id, v_user)
  on conflict do nothing;

  return v_league;
end $$;

revoke all on function public.create_league(text) from public;
revoke all on function public.join_league(text)   from public;
grant execute on function public.create_league(text) to authenticated;
grant execute on function public.join_league(text)   to authenticated;

-- ------------------------------------------------------------------ vistas
-- Las ligas de quien consulta, con cuántos son. security_invoker + las
-- políticas de arriba hacen el filtrado: solo salen las tuyas.
create or replace view public.my_leagues with (security_invoker = true) as
  select l.id, l.name, l.code, l.owner_id, l.created_at,
         (select count(*) from public.league_members m where m.league_id = l.id) as members
  from public.leagues l;

-- Ranking del puzle del día dentro de cada liga.
create or replace view public.league_daily_leaderboard with (security_invoker = true) as
  select m.league_id,
         pz.daily_date, pz.size,
         pl.duration_ms, pl.hints, pl.created_at, pl.verified,
         pr.id as user_id, pr.username, pr.display_name
  from public.league_members m
  join public.plays    pl on pl.user_id = m.user_id
  join public.puzzles  pz on pz.id = pl.puzzle_id
  join public.profiles pr on pr.id = pl.user_id
  where pl.mode = 'daily' and pz.daily_date is not null;

grant select on public.my_leagues, public.league_daily_leaderboard to authenticated;
