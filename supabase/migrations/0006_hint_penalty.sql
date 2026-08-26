-- Crowns · las pistas cuestan tiempo
-- Ejecuta este archivo en Supabase → SQL Editor (o con `supabase db push`).
--
-- Hasta ahora los rankings ordenaban por tiempo bruto, así que una partida
-- resuelta con tres pistas podía ganar a otra hecha sin ninguna. A partir de
-- aquí se clasifica por **tiempo ajustado**: cada pista suma 30 segundos.
--
-- Se eligió una penalización fija en vez de normalizar por la mediana del día
-- porque con pocos jugadores la mediana es ruido, y porque «cada pista son 30
-- segundos» se entiende sin mirar la documentación.
--
-- El tiempo real se sigue guardando y mostrando: lo que cambia es el orden.

do $$ begin
  if to_regclass('public.plays') is null then
    raise exception 'Falta 0001_init.sql: aplícala antes que esta.';
  end if;
  if to_regclass('public.league_members') is null then
    raise exception 'Falta 0004_leagues.sql: aplícala antes que esta.';
  end if;
end $$;

-- Un solo sitio donde cambiar el castigo.
create or replace function public.hint_penalty_ms()
returns int language sql immutable as $$ select 30000; $$;

comment on function public.hint_penalty_ms is
  'Segundos que suma cada pista al tiempo de clasificación (no al tiempo real).';

-- ------------------------------------------------ puntos del puzle del día
-- Mismo reparto (10, 8, 6…) pero ordenando por tiempo ajustado.
create or replace view public.daily_points with (security_invoker = true) as
  select pz.daily_date,
         pl.user_id,
         pl.duration_ms,
         pl.hints,
         rank() over (
           partition by pz.daily_date
           order by pl.duration_ms + pl.hints * public.hint_penalty_ms()
         ) as position,
         (case rank() over (
             partition by pz.daily_date
             order by pl.duration_ms + pl.hints * public.hint_penalty_ms())
            when 1 then 10
            when 2 then 8
            when 3 then 6
            when 4 then 5
            when 5 then 4
            when 6 then 3
            when 7 then 2
            else 1
          end)::int as points,
         (pl.duration_ms + pl.hints * public.hint_penalty_ms())::int as adjusted_ms
  from public.plays pl
  join public.puzzles pz on pz.id = pl.puzzle_id
  where pl.mode = 'daily' and pz.daily_date is not null;

-- ------------------------------------------------------- vistas de ranking
-- Postgres solo deja añadir columnas al final de una vista existente.
create or replace view public.daily_leaderboard with (security_invoker = true) as
  select pz.daily_date, pz.size, pl.duration_ms, pl.hints, pl.created_at,
         pr.id as user_id, pr.username, pr.display_name,
         pl.verified,
         (pl.duration_ms + pl.hints * public.hint_penalty_ms())::int as adjusted_ms
  from public.plays pl
  join public.puzzles  pz on pz.id = pl.puzzle_id
  join public.profiles pr on pr.id = pl.user_id
  where pl.mode = 'daily' and pz.daily_date is not null;

create or replace view public.league_daily_leaderboard with (security_invoker = true) as
  select m.league_id,
         pz.daily_date, pz.size,
         pl.duration_ms, pl.hints, pl.created_at, pl.verified,
         pr.id as user_id, pr.username, pr.display_name,
         (pl.duration_ms + pl.hints * public.hint_penalty_ms())::int as adjusted_ms
  from public.league_members m
  join public.plays    pl on pl.user_id = m.user_id
  join public.puzzles  pz on pz.id = pl.puzzle_id
  join public.profiles pr on pr.id = pl.user_id
  where pl.mode = 'daily' and pz.daily_date is not null;

create or replace view public.recent_activity with (security_invoker = true) as
  select pl.id, pl.created_at, pl.duration_ms, pl.hints, pl.mode,
         pz.size, pz.fingerprint, pz.daily_date,
         pr.id as user_id, pr.username, pr.display_name,
         pl.verified,
         (pl.duration_ms + pl.hints * public.hint_penalty_ms())::int as adjusted_ms
  from public.plays pl
  join public.puzzles  pz on pz.id = pl.puzzle_id
  join public.profiles pr on pr.id = pl.user_id
  order by pl.created_at desc;

-- ------------------------------------------- puesto propio en un tablero
-- Ordena por tiempo ajustado y devuelve tiempos ajustados, para que el hueco
-- que se muestra («a 14 s del primero») cuadre con el puesto que se anuncia.
create or replace function public.board_standing(p_fingerprint text)
returns table (place int, total int, best_ms int, your_ms int)
language sql stable security definer set search_path = public as $$
  with marcas as (
    select pl.user_id,
           pl.duration_ms + pl.hints * public.hint_penalty_ms() as ajustado,
           rank() over (order by pl.duration_ms + pl.hints * public.hint_penalty_ms()) as puesto
    from public.plays pl
    join public.puzzles pz on pz.id = pl.puzzle_id
    where pz.fingerprint = p_fingerprint
  )
  select (select min(puesto)   from marcas where user_id = auth.uid())::int,
         (select count(*)      from marcas)::int,
         (select min(ajustado) from marcas)::int,
         (select min(ajustado) from marcas where user_id = auth.uid())::int;
$$;

grant select on public.daily_points, public.daily_leaderboard, public.recent_activity to anon, authenticated;
grant select on public.league_daily_leaderboard to authenticated;
grant execute on function public.hint_penalty_ms() to anon, authenticated;
