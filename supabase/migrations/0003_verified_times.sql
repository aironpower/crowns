-- Crowns · tiempos verificados por el servidor
-- Ejecuta este archivo en Supabase → SQL Editor (o con `supabase db push`).
--
-- Hasta ahora la duración de una partida la enviaba el cliente, así que
-- cualquiera con la consola del navegador podía ponerse primero. A partir de
-- aquí el reloj lo lleva el servidor:
--
--   1. Al hacer la primera jugada, el cliente llama a start_attempt().
--   2. Al resolver, submit_play() recibe ese identificador y calcula la
--      duración como now() - started_at, ignorando lo que diga el cliente.
--
-- Las partidas sin intento asociado (invitados que suben su historial, o un
-- cliente antiguo) se guardan igual, pero marcadas como no verificadas.

-- ------------------------------------------------------------- intentos
create table if not exists public.attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  fingerprint  text not null,
  started_at   timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists attempts_open_idx
  on public.attempts (user_id, fingerprint) where submitted_at is null;
create index if not exists attempts_started_idx on public.attempts (started_at);

alter table public.attempts enable row level security;
-- Sin políticas a propósito: solo se toca desde las funciones de abajo.

comment on table public.attempts is
  'Marca de inicio puesta por el servidor para poder medir la duración real.';

-- ------------------------------------------- ¿el tiempo lo puso el servidor?
alter table public.plays
  add column if not exists verified boolean not null default false;

comment on column public.plays.verified is
  'true si la duración la midió el servidor entre start_attempt y submit_play.';

-- --------------------------------------------------------- abrir un intento
create or replace function public.start_attempt(p_size int, p_regions smallint[])
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_fp   text;
  v_id   uuid;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using hint = 'Inicia sesión para guardar partidas.';
  end if;
  if not public.is_canonical(p_size, p_regions) then raise exception 'BAD_REGIONS'; end if;

  v_fp := p_size || ':' || array_to_string(p_regions, '');

  -- Empezar de nuevo el mismo tablero reinicia el cronómetro: solo hay un
  -- intento abierto por jugador y tablero.
  delete from public.attempts
   where user_id = v_user and fingerprint = v_fp and submitted_at is null;

  insert into public.attempts (user_id, fingerprint)
  values (v_user, v_fp)
  returning id into v_id;

  -- Limpieza barata: los intentos que nadie cerró no sirven de nada.
  delete from public.attempts
   where user_id = v_user and submitted_at is null and started_at < now() - interval '2 days';

  return v_id;
end $$;

revoke all on function public.start_attempt(int, smallint[]) from public;
grant execute on function public.start_attempt(int, smallint[]) to authenticated;

-- ------------------------------------- registrar la partida (con el reloj real)
create or replace function public.submit_play(
  p_size        int,
  p_regions     smallint[],
  p_solution    smallint[],
  p_duration_ms int,
  p_hints       int  default 0,
  p_moves       int  default 0,
  p_mode        text default 'practice',
  p_daily_date  date default null,
  p_attempt_id  uuid default null
) returns public.plays
language plpgsql security definer set search_path = public as $$
declare
  v_user     uuid := auth.uid();
  v_fp       text;
  v_puzzle   public.puzzles;
  v_play     public.plays;
  v_attempt  public.attempts;
  v_duration int  := p_duration_ms;
  v_verified boolean := false;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using hint = 'Inicia sesión para guardar partidas.';
  end if;
  if p_mode not in ('daily','practice') then raise exception 'BAD_MODE'; end if;
  if not public.is_canonical(p_size, p_regions) then raise exception 'BAD_REGIONS'; end if;
  if not public.is_valid_crowns(p_size, p_regions, p_solution) then raise exception 'BAD_SOLUTION'; end if;

  v_fp := p_size || ':' || array_to_string(p_regions, '');

  -- Si hay intento abierto para este tablero, manda el reloj del servidor.
  if p_attempt_id is not null then
    select * into v_attempt from public.attempts
     where id = p_attempt_id and user_id = v_user and fingerprint = v_fp and submitted_at is null;
    if found then
      v_duration := floor(extract(epoch from (now() - v_attempt.started_at)) * 1000)::int;
      v_verified := true;
      update public.attempts set submitted_at = now() where id = v_attempt.id;
    end if;
  end if;

  if v_duration < 1000 or v_duration > 86400000 then raise exception 'BAD_DURATION'; end if;

  insert into public.puzzles (fingerprint, size, regions, solution, daily_date)
  values (v_fp, p_size, p_regions, p_solution,
          case when p_mode = 'daily' then p_daily_date end)
  on conflict (fingerprint) do update
    set daily_date = coalesce(public.puzzles.daily_date, excluded.daily_date)
  returning * into v_puzzle;

  insert into public.plays (user_id, puzzle_id, mode, duration_ms, hints, moves, played_on, verified)
  values (v_user, v_puzzle.id, p_mode, v_duration,
          greatest(p_hints, 0), greatest(p_moves, 0),
          coalesce(p_daily_date, current_date), v_verified)
  on conflict do nothing
  returning * into v_play;

  if v_play is null then   -- ya había jugado este diario: devolvemos aquella partida
    select * into v_play from public.plays
      where user_id = v_user and puzzle_id = v_puzzle.id order by created_at limit 1;
  end if;
  return v_play;
end $$;

revoke all on function public.submit_play(int, smallint[], smallint[], int, int, int, text, date, uuid) from public;
grant execute on function public.submit_play(int, smallint[], smallint[], int, int, int, text, date, uuid) to authenticated;

-- La firma anterior (sin p_attempt_id) deja de existir para no tener dos caminos.
drop function if exists public.submit_play(int, smallint[], smallint[], int, int, int, text, date);

-- ------------------------------------------------- vistas con la marca nueva
-- Postgres solo deja añadir columnas al final de una vista existente, nunca
-- intercalarlas: por eso `verified` va la última.
create or replace view public.recent_activity with (security_invoker = true) as
  select pl.id, pl.created_at, pl.duration_ms, pl.hints, pl.mode,
         pz.size, pz.fingerprint, pz.daily_date,
         pr.id as user_id, pr.username, pr.display_name,
         pl.verified
  from public.plays pl
  join public.puzzles  pz on pz.id = pl.puzzle_id
  join public.profiles pr on pr.id = pl.user_id
  order by pl.created_at desc;

create or replace view public.daily_leaderboard with (security_invoker = true) as
  select pz.daily_date, pz.size, pl.duration_ms, pl.hints, pl.created_at,
         pr.id as user_id, pr.username, pr.display_name,
         pl.verified
  from public.plays pl
  join public.puzzles  pz on pz.id = pl.puzzle_id
  join public.profiles pr on pr.id = pl.user_id
  where pl.mode = 'daily' and pz.daily_date is not null;

grant select on public.recent_activity, public.daily_leaderboard to anon, authenticated;
