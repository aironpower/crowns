-- Crowns · temporadas mensuales y posición en el tablero
-- Ejecuta este archivo en Supabase → SQL Editor (o con `supabase db push`).
--
-- Dos cosas:
--
--   1. Puntos por posición en el puzle del día, agregados por mes. Así un mal
--      día no hunde la temporada y presentarse todos los días compensa.
--   2. board_standing(): en qué puesto has quedado en un tablero y a cuánto
--      estás del mejor tiempo.

-- ----------------------------------------------- puntos del puzle del día
-- 1.º 10 puntos, 2.º 8, 3.º 6, 4.º 5, 5.º 4, 6.º 3, 7.º 2 y 1 punto por
-- terminar. Los empates comparten puesto (rank), como en cualquier carrera.
create or replace view public.daily_points with (security_invoker = true) as
  select pz.daily_date,
         pl.user_id,
         pl.duration_ms,
         pl.hints,
         rank() over (partition by pz.daily_date order by pl.duration_ms) as position,
         (case rank() over (partition by pz.daily_date order by pl.duration_ms)
            when 1 then 10
            when 2 then 8
            when 3 then 6
            when 4 then 5
            when 5 then 4
            when 6 then 3
            when 7 then 2
            else 1
          end)::int as points
  from public.plays pl
  join public.puzzles pz on pz.id = pl.puzzle_id
  where pl.mode = 'daily' and pz.daily_date is not null;

-- --------------------------------------------------- clasificación del mes
create or replace view public.monthly_leaderboard with (security_invoker = true) as
  select to_char(dp.daily_date, 'YYYY-MM') as month,
         pr.id as user_id, pr.username, pr.display_name,
         sum(dp.points)::int  as points,
         count(*)::int        as days,
         min(dp.duration_ms)::int as best_ms
  from public.daily_points dp
  join public.profiles pr on pr.id = dp.user_id
  group by 1, 2, 3, 4;

-- La misma clasificación, pero dentro de cada liga.
create or replace view public.league_monthly_leaderboard with (security_invoker = true) as
  select m.league_id,
         to_char(dp.daily_date, 'YYYY-MM') as month,
         pr.id as user_id, pr.username, pr.display_name,
         sum(dp.points)::int  as points,
         count(*)::int        as days,
         min(dp.duration_ms)::int as best_ms
  from public.league_members m
  join public.daily_points dp on dp.user_id = m.user_id
  join public.profiles pr on pr.id = dp.user_id
  group by 1, 2, 3, 4, 5;

grant select on public.daily_points, public.monthly_leaderboard to anon, authenticated;
grant select on public.league_monthly_leaderboard to authenticated;

-- ------------------------------------------- tu puesto en un tablero dado
-- Devuelve el puesto de quien llama, cuánta gente lo ha jugado y el mejor
-- tiempo, para poder decir «2.º de 37, a 14 s del primero».
-- La columna se llama `place` porque `position` es una función del estándar SQL.
create or replace function public.board_standing(p_fingerprint text)
returns table (place int, total int, best_ms int, your_ms int)
language sql stable security definer set search_path = public as $$
  with marcas as (
    select pl.user_id,
           pl.duration_ms,
           rank() over (order by pl.duration_ms) as puesto
    from public.plays pl
    join public.puzzles pz on pz.id = pl.puzzle_id
    where pz.fingerprint = p_fingerprint
  )
  select (select min(puesto) from marcas where user_id = auth.uid())::int,
         (select count(*) from marcas)::int,
         (select min(duration_ms) from marcas)::int,
         (select min(duration_ms) from marcas where user_id = auth.uid())::int;
$$;

revoke all on function public.board_standing(text) from public;
grant execute on function public.board_standing(text) to anon, authenticated;
