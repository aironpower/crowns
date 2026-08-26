-- Prueba de la migración contra un Postgres de verdad (ver scripts/test-db.mjs).
-- Recrea el mínimo que aporta Supabase (esquema auth, roles, auth.uid()), aplica
-- la migración y comprueba trigger, validaciones, submit_play, vistas y RLS.
-- El tablero de prueba sale del generador del juego (semilla 20260826).

\set regions '{0,0,0,0,0,1,2,2,0,3,0,0,1,1,1,4,0,3,0,1,1,4,1,4,3,3,0,1,1,4,4,4,5,6,6,1,1,4,4,4,5,6,5,7,7,7,4,7,5,5,5,7,7,7,4,7,5,7,7,7,7,7,7,7}'
\set solution '{7,3,1,4,2,6,0,5}'
\set fingerprint '8:0000012203001114030114143301144456611444565777475557774757777777'
\set regions_b '{0,0,1,1,1,1,2,2,3,0,1,4,4,1,1,2,3,4,4,4,4,4,2,2,3,4,4,4,5,4,5,5,3,3,3,5,5,4,5,5,3,5,5,5,5,5,5,6,3,6,6,5,6,6,5,6,7,7,6,6,6,6,6,6}'
\set solution_b '{3,1,7,5,2,6,4,0}'
\set regions_c '{0,0,1,1,2,2,2,2,0,0,3,3,3,4,4,2,0,3,3,5,3,4,4,4,0,0,3,5,6,4,4,4,0,5,5,5,6,4,4,4,0,0,0,6,6,6,4,4,7,0,6,6,6,4,4,6,7,0,6,6,6,6,6,6}'
\set solution_c '{2,7,4,1,3,6,0,5}'
\set regions_d '{0,0,0,0,1,2,2,2,0,0,0,1,1,1,3,4,5,5,0,1,3,3,3,4,6,0,0,1,3,3,3,4,6,0,1,1,1,3,3,3,6,0,1,7,3,3,7,3,6,6,1,7,7,7,7,3,1,1,1,1,7,7,7,7}'
\set solution_d '{6,2,0,7,3,5,1,4}'
-- Stub de lo que aporta Supabase (esquema auth, roles y auth.uid()).
create schema if not exists auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
end $$;

\echo '--- aplicando la migración ---'
\i /work/migrations/0001_init.sql
\i /work/migrations/0002_player_settings.sql
\i /work/migrations/0003_verified_times.sql
\i /work/migrations/0004_leagues.sql
\i /work/migrations/0005_seasons.sql
\i /work/migrations/0006_hint_penalty.sql

\echo '--- 1. trigger de perfil al registrarse ---'
insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'ada@example.com', '{"name":"Ada L","locale":"en"}');
insert into auth.users (id, email, raw_user_meta_data)
values ('22222222-2222-2222-2222-222222222222', 'ada@otro.com', '{}');
insert into auth.users (id, email, raw_user_meta_data)
values ('33333333-3333-3333-3333-333333333333', 'x@y.com', '{"username":"jugador!! con espacios","locale":"marciano"}');
select username, display_name, locale from public.profiles order by created_at;

\echo '--- 2. validación de reglas (is_valid_crowns) ---'
select
  public.is_valid_crowns(8, :'regions', :'solution')                as solucion_real_valida,
  public.is_valid_crowns(8, :'regions', '{7,3,1,4,2,6,0,4}')        as columna_repetida,
  public.is_valid_crowns(8, :'regions', '{7,3,1,4,2,6,0}')          as faltan_coronas,
  public.is_valid_crowns(8, :'regions', '{0,1,3,5,7,2,4,6}')        as coronas_pegadas,
  public.is_valid_crowns(8, :'regions', '{7,3,1,4,2,6,0,9}')        as fuera_del_tablero;

\echo '--- 3. canonicidad ---'
select
  public.is_canonical(8, :'regions')                                         as regiones_del_cliente,
  public.is_canonical(5, '{1,1,1,1,1,0,0,0,0,0,2,2,2,2,2,3,3,3,3,3,4,4,4,4,4}') as empieza_por_1,
  public.is_canonical(5, '{0,0,0,0,0,1,1,1,1,1,2,2,2,2,2,3,3,3,3,3,4,4,4,4,4}') as bien_numeradas;

-- Helper: psql no interpola :variables dentro de bloques DO, asi que envolvemos
-- la llamada en una funcion que captura el error y devuelve texto.
create or replace function pg_temp.try_submit(
  p_size int, p_regions smallint[], p_solution smallint[], p_ms int,
  p_hints int default 0, p_moves int default 0, p_mode text default 'practice', p_date date default null
) returns text language plpgsql as $fn$
begin
  perform public.submit_play(p_size, p_regions, p_solution, p_ms, p_hints, p_moves, p_mode, p_date);
  return 'ACEPTADA';
exception when others then
  return 'RECHAZADA (' || sqlerrm || ')';
end $fn$;

\echo '--- 4. submit_play sin sesion ---'
select set_config('app.user_id', '', false);
select pg_temp.try_submit(8, :'regions', :'solution', 60000) as sin_sesion;

\echo '--- 5. submit_play con solucion invalida ---'
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select pg_temp.try_submit(8, :'regions', '{7,3,1,4,2,6,0,4}', 60000) as columna_repetida;
select pg_temp.try_submit(8, '{1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7}', :'solution', 60000) as regiones_no_canonicas;

\echo '--- 6. submit_play con duracion imposible ---'
select pg_temp.try_submit(8, :'regions', :'solution', 10) as diez_ms;

\echo '--- 7. partida válida (práctica) ---'
select (public.submit_play(8, :'regions', :'solution', 95000, 0, 40, 'practice')).duration_ms as guardada_ms;
select fingerprint = :'fingerprint' as fingerprint_coincide, size, daily_date from public.puzzles;

\echo '--- 8. el puzle no se duplica y el diario solo cuenta una vez ---'
select set_config('app.user_id', '22222222-2222-2222-2222-222222222222', false);
select (public.submit_play(8, :'regions', :'solution', 61000, 1, 55, 'daily', current_date)).duration_ms as diario_1;
select (public.submit_play(8, :'regions', :'solution', 30000, 0, 30, 'daily', current_date)).duration_ms as diario_2_deberia_ser_61000;
select count(*) as filas_en_puzzles from public.puzzles;
select count(*) as partidas_totales from public.plays;

\echo '--- 9. vistas ---'
select username, size, duration_ms, mode from public.recent_activity order by created_at;
select username, duration_ms, hints from public.daily_leaderboard order by duration_ms;
select username, size, best_ms, solved from public.leaderboard_by_size order by best_ms nulls last;
select username, solved, dailies, clean_solves, best_ms from public.player_stats order by username;

\echo '--- 10. RLS activo en las tres tablas ---'
select relname, relrowsecurity from pg_class
where relname in ('profiles','puzzles','plays') and relnamespace = 'public'::regnamespace
order by relname;
select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by tablename, policyname;

\echo '--- 11. un usuario normal no puede escribir directamente ---'
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.plays, public.puzzles, public.profiles to authenticated;
set role authenticated;
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
do $$ begin
  insert into public.plays (user_id, puzzle_id, duration_ms)
  values ('11111111-1111-1111-1111-111111111111', (select id from public.puzzles limit 1), 1000);
  raise notice 'FALLO: pudo insertar una partida a mano';
exception when others then raise notice 'OK insert directo bloqueado por RLS (%)', sqlerrm;
end $$;
do $$ begin
  update public.profiles set username = 'secuestrado'
  where id = '22222222-2222-2222-2222-222222222222';
  if found then raise notice 'FALLO: pudo editar el perfil de otro'; else raise notice 'OK no puede editar perfiles ajenos'; end if;
end $$;
select count(*) as perfiles_visibles_para_todos from public.profiles;
reset role;

\echo '--- 12. preferencias del jugador ---'
select column_name, data_type, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in ('auto_mark','show_conflicts')
 order by column_name;
select username, auto_mark, show_conflicts from public.profiles order by username;
-- el dueño puede cambiarlas
set role authenticated;
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
update public.profiles set auto_mark = true where id = '11111111-1111-1111-1111-111111111111';
select username, auto_mark from public.profiles where id = '11111111-1111-1111-1111-111111111111';
do $$ begin
  update public.profiles set auto_mark = true where id = '22222222-2222-2222-2222-222222222222';
  if found then raise notice 'FALLO: pudo cambiar las preferencias de otro'; else raise notice 'OK no puede tocar las preferencias ajenas'; end if;
end $$;
reset role;

\echo '--- 13. tiempo medido por el servidor ---'

-- helper: enviar indicando (o no) un intento abierto
create or replace function pg_temp.enviar(
  p_size int, p_regions smallint[], p_solution smallint[], p_ms int, p_attempt uuid
) returns text language plpgsql as $fn$
declare r public.plays;
begin
  r := public.submit_play(p_size, p_regions, p_solution, p_ms, 0, 0, 'practice', null, p_attempt);
  return 'duracion=' || r.duration_ms || 'ms verificada=' || r.verified;
exception when others then return 'RECHAZADA (' || sqlerrm || ')';
end $fn$;

\echo '  sin intento: se guarda lo que dice el cliente, sin verificar'
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select pg_temp.enviar(8, :'regions', :'solution', 45000, null) as sin_intento;

\echo '  con intento: el cliente dice 1 s, el servidor mide 2 s de verdad'
select set_config('app.user_id', '22222222-2222-2222-2222-222222222222', false);
select public.start_attempt(8, :'regions') as intento \gset
select pg_sleep(2);
select pg_temp.enviar(8, :'regions', :'solution', 1000, :'intento') as con_intento;

\echo '  el mismo intento no vale dos veces (vuelve a no estar verificada)'
select pg_temp.enviar(8, :'regions', :'solution', 1000, :'intento') as reutilizado;

\echo '  el intento de otro jugador tampoco sirve'
select set_config('app.user_id', '33333333-3333-3333-3333-333333333333', false);
select public.start_attempt(8, :'regions') as ajeno \gset
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select pg_temp.enviar(8, :'regions', :'solution', 1000, :'ajeno') as intento_ajeno;

\echo '  start_attempt exige sesión'
select set_config('app.user_id', '', false);
do $$ begin
  perform public.start_attempt(8, (select regions from public.puzzles limit 1));
  raise notice 'FALLO: abrió intento sin sesión';
exception when others then raise notice 'OK sin sesión no se abre intento (%)', sqlerrm;
end $$;

\echo '  la tabla de intentos no la ve ningún usuario'
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
grant usage on schema public to authenticated;
grant select on public.attempts to authenticated;
set role authenticated;
select count(*) as intentos_visibles_para_un_usuario from public.attempts;
reset role;
select count(*) as intentos_reales from public.attempts;

\echo '--- 14. ligas privadas ---'
create or replace function pg_temp.intentar(p_sql text) returns text language plpgsql as $fn$
begin
  execute p_sql;
  return 'OK';
exception when others then return 'RECHAZADO (' || sqlerrm || ')';
end $fn$;

-- Supabase concede estos permisos por defecto a anon/authenticated; aquí hay
-- que darlos a mano para que RLS sea lo único que decide.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.leagues, public.league_members to authenticated;

select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select (public.create_league('Los del jueves')).name as liga_creada;
select code as codigo, id as liga_id from public.leagues limit 1 \gset

\echo '  el código tiene 6 caracteres y sin vocales'
select code, code ~ '^[A-Z0-9]{6}$' as formato_ok, code !~ '[AEIOU]' as sin_vocales from public.leagues;

\echo '  el creador queda dentro y ve su liga'
set role authenticated;
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select name, members from public.my_leagues;
reset role;

\echo '  otro jugador no la ve hasta unirse'
set role authenticated;
select set_config('app.user_id', '22222222-2222-2222-2222-222222222222', false);
select count(*) as ligas_visibles_antes from public.my_leagues;
reset role;

select set_config('app.user_id', '22222222-2222-2222-2222-222222222222', false);
select (public.join_league(:'codigo')).name as se_une;
set role authenticated;
select set_config('app.user_id', '22222222-2222-2222-2222-222222222222', false);
select count(*) as ligas_visibles_despues from public.my_leagues;
select name, members from public.my_leagues;
reset role;

\echo '  un código inventado no cuela'
select set_config('app.user_id', '33333333-3333-3333-3333-333333333333', false);
select pg_temp.intentar('select public.join_league(''XXXXXX'')') as codigo_falso;

\echo '  nadie puede apuntarse a mano ni meter a otro'
set role authenticated;
select set_config('app.user_id', '33333333-3333-3333-3333-333333333333', false);
-- con el id literal: si no, RLS ya oculta la liga y el insert no toca ninguna
-- fila, que parece un permiso concedido sin serlo
select pg_temp.intentar('insert into public.league_members (league_id, user_id) values (''' || :'liga_id' || ''', ''33333333-3333-3333-3333-333333333333'')') as apuntarse_a_mano;
select pg_temp.intentar('insert into public.leagues (name, code, owner_id) values (''Pirata'', ''ZZZZZZ'', ''33333333-3333-3333-3333-333333333333'')') as crear_a_mano;
reset role;

\echo '  el ranking de la liga solo lo ven sus miembros'
set role authenticated;
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select count(*) as filas_para_un_miembro from public.league_daily_leaderboard;
select set_config('app.user_id', '33333333-3333-3333-3333-333333333333', false);
select count(*) as filas_para_un_extrano from public.league_daily_leaderboard;
reset role;

\echo '  salirse sí se puede'
set role authenticated;
select set_config('app.user_id', '22222222-2222-2222-2222-222222222222', false);
select pg_temp.intentar('delete from public.league_members where user_id = ''22222222-2222-2222-2222-222222222222''') as salirse;
select count(*) as ligas_tras_salir from public.my_leagues;
reset role;

\echo '--- 15. temporada mensual y puesto en el tablero ---'
-- Tableros nuevos: el de las pruebas anteriores ya está atado a otra fecha, y
-- el índice del diario impide repetir jugador+tablero.
insert into auth.users (id, email) values
  ('44444444-4444-4444-4444-444444444444', 'd@example.com') on conflict do nothing;

\echo '  día 1: tres jugadores, 30 s / 45 s / 60 s'
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select (public.submit_play(8, :'regions_b', :'solution_b', 30000, 0, 0, 'daily', date '2026-03-01')).duration_ms as j1;
select set_config('app.user_id', '22222222-2222-2222-2222-222222222222', false);
select (public.submit_play(8, :'regions_b', :'solution_b', 45000, 0, 0, 'daily', date '2026-03-01')).duration_ms as j2;
select set_config('app.user_id', '33333333-3333-3333-3333-333333333333', false);
select (public.submit_play(8, :'regions_b', :'solution_b', 60000, 0, 0, 'daily', date '2026-03-01')).duration_ms as j3;

\echo '  día 2: solo dos, y el orden se invierte'
select set_config('app.user_id', '22222222-2222-2222-2222-222222222222', false);
select (public.submit_play(8, :'regions_c', :'solution_c', 20000, 0, 0, 'daily', date '2026-03-02')).duration_ms as j2b;
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select (public.submit_play(8, :'regions_c', :'solution_c', 50000, 0, 0, 'daily', date '2026-03-02')).duration_ms as j1b;

\echo '  puntos por día: 10 / 8 / 6 según el tiempo'
select p.username, dp.daily_date, dp.duration_ms, dp.position, dp.points
  from public.daily_points dp join public.profiles p on p.id = dp.user_id
 where dp.daily_date between date '2026-03-01' and date '2026-03-02'
 order by dp.daily_date, dp.position;

\echo '  la temporada suma los dos días (18 / 18 / 6, y quien juega más no pierde)'
select username, points, days, best_ms from public.monthly_leaderboard
 where month = '2026-03' order by points desc, best_ms;

\echo '  tu puesto en el tablero del día 1'
select set_config('app.user_id', '22222222-2222-2222-2222-222222222222', false);
select * from public.board_standing('8:' || array_to_string(:'regions_b'::smallint[], ''));

\echo '  quien no lo ha jugado no tiene puesto, pero ve el total'
select set_config('app.user_id', '44444444-4444-4444-4444-444444444444', false);
select place is null as sin_puesto, total, best_ms from public.board_standing('8:' || array_to_string(:'regions_b'::smallint[], ''));

\echo '  la clasificación mensual de liga solo cuenta a sus miembros'
grant select on public.league_monthly_leaderboard, public.daily_points, public.monthly_leaderboard to authenticated;
set role authenticated;
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select count(*) as filas_liga_para_miembro from public.league_monthly_leaderboard;
select set_config('app.user_id', '44444444-4444-4444-4444-444444444444', false);
select count(*) as filas_liga_para_extrano from public.league_monthly_leaderboard;
reset role;

\echo '--- 16. las pistas penalizan ---'
-- Mismo tablero, dos jugadores: uno tarda menos pero usa dos pistas.
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select (public.submit_play(8, :'regions_d', :'solution_d', 40000, 2, 0, 'daily', date '2026-04-01')).hints as con_pistas;
select set_config('app.user_id', '22222222-2222-2222-2222-222222222222', false);
select (public.submit_play(8, :'regions_d', :'solution_d', 70000, 0, 0, 'daily', date '2026-04-01')).hints as sin_pistas;

\echo '  40 s con dos pistas = 1:40 ajustado, así que gana el de 70 s limpio'
select p.username, dp.duration_ms, dp.hints, dp.adjusted_ms, dp.position, dp.points
  from public.daily_points dp join public.profiles p on p.id = dp.user_id
 where dp.daily_date = date '2026-04-01' order by dp.position;

\echo '  el ranking del día ordena igual'
select username, duration_ms, hints, adjusted_ms from public.daily_leaderboard
 where daily_date = date '2026-04-01' order by adjusted_ms;

\echo '  y el puesto propio usa el tiempo ajustado'
select set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);
select * from public.board_standing('8:' || array_to_string(:'regions_d'::smallint[], ''));

\echo '  la penalización está en un solo sitio'
select public.hint_penalty_ms() as penalizacion_ms;
