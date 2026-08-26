-- Crowns · preferencias de juego en el perfil
-- Ejecuta este archivo en Supabase → SQL Editor (o con `supabase db push`).
--
-- Guarda las dos opciones del tablero en la cuenta, para que viajen con el
-- jugador entre navegadores y dispositivos. Quien juega sin cuenta las conserva
-- en el almacenamiento local del navegador.
--
-- Ambas nacen desactivadas, igual que en la interfaz.

-- Comprobación de orden: sin la migración anterior, el error que sale es
-- confuso ("relation does not exist" en mitad del archivo).
do $$ begin
  if to_regclass('public.profiles') is null then
    raise exception 'Falta 0001_init.sql: aplícala antes que esta.';
  end if;
end $$;

alter table public.profiles
  add column if not exists auto_mark      boolean not null default false,
  add column if not exists show_conflicts boolean not null default false;

comment on column public.profiles.auto_mark is
  'Marcar automáticamente con ✕ las casillas descartadas al poner una corona.';
comment on column public.profiles.show_conflicts is
  'Resaltar en rojo las coronas que incumplen las reglas.';

-- Las políticas existentes ya cubren estas columnas: el perfil es público en
-- lectura y solo su dueño puede modificarlo.
