-- Reto Lector: Racha lectora.
-- Ejecutar DESPUÉS de schema.sql. Es idempotente y no borra ni modifica datos
-- existentes (solo añade una columna, una tabla, funciones y un trigger).
--
-- Reglas:
--   * Cuenta como lectura que current_page supere la página más alta ya
--     alcanzada en ese libro (corregir hacia abajo y volver a subir no cuenta).
--   * La racha sube como máximo +1 cada 24 h (desde el último incremento).
--   * Activa durante 24 h desde la última lectura; en riesgo de 24 h a 48 h;
--     perdida a partir de 48 h. Leer después de perderla empieza desde 1.
--   * La hora la decide el servidor (now()), no el dispositivo.

-- ---------------------------------------------------------------------------
-- 1. Página más alta alcanzada por libro
-- ---------------------------------------------------------------------------
alter table public.books add column if not exists max_page_read integer;
update public.books set max_page_read = current_page where max_page_read is null;
alter table public.books alter column max_page_read set default 0;

-- ---------------------------------------------------------------------------
-- 2. Estado de racha por participante
-- ---------------------------------------------------------------------------
create table if not exists public.reading_streaks (
  profile_id        text primary key references public.profiles (id) on delete cascade,
  current_streak    integer not null default 0 check (current_streak >= 0),
  best_streak       integer not null default 0 check (best_streak >= 0),
  started_at        timestamptz,   -- inicio de la racha actual
  last_read_at      timestamptz,   -- última lectura válida
  last_increment_at timestamptz,   -- última vez que la racha sumó +1
  updated_at        timestamptz not null default now()
);

alter table public.reading_streaks enable row level security;

-- Todos los participantes ven las rachas; nadie las escribe desde el cliente.
drop policy if exists streaks_select on public.reading_streaks;
create policy streaks_select on public.reading_streaks
  for select to authenticated using (public.is_member());

-- ---------------------------------------------------------------------------
-- 3. Registrar una lectura (única lógica de racha)
-- ---------------------------------------------------------------------------
create or replace function public.register_reading(p_profile_id text, p_at timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare
  s public.reading_streaks%rowtype;
  active_window constant interval := interval '24 hours';
  lost_after    constant interval := interval '48 hours';
begin
  insert into public.reading_streaks (profile_id) values (p_profile_id)
    on conflict (profile_id) do nothing;

  -- Bloquea la fila: dos guardados simultáneos no pueden sumar dos veces.
  select * into s from public.reading_streaks where profile_id = p_profile_id for update;

  -- Lecturas fuera de orden (p. ej. reproceso histórico) no alteran la racha.
  if s.last_read_at is not null and p_at < s.last_read_at then
    return;
  end if;

  if s.current_streak = 0 or s.last_read_at is null or p_at - s.last_read_at >= lost_after then
    s.current_streak := 1;
    s.started_at := p_at;
    s.last_increment_at := p_at;
  elsif p_at - s.last_increment_at >= active_window then
    s.current_streak := s.current_streak + 1;
    s.last_increment_at := p_at;
  end if;

  update public.reading_streaks set
    current_streak    = s.current_streak,
    best_streak       = greatest(s.best_streak, s.current_streak),
    started_at        = s.started_at,
    last_read_at      = p_at,
    last_increment_at = s.last_increment_at,
    updated_at        = now()
  where profile_id = p_profile_id;
end;
$$;

-- Solo el trigger puede registrar lecturas (no se expone como RPC).
revoke all on function public.register_reading(text, timestamptz) from public;
do $$ begin
  revoke all on function public.register_reading(text, timestamptz) from anon, authenticated;
exception when undefined_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 4. Trigger sobre el progreso de los libros
-- ---------------------------------------------------------------------------
create or replace function public.books_track_reading()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  previous_max integer := greatest(coalesce(old.max_page_read, 0), coalesce(old.current_page, 0));
begin
  new.max_page_read := greatest(previous_max, new.current_page);
  if new.current_page > old.current_page and new.current_page > previous_max then
    perform public.register_reading(new.owner_id, now());
  end if;
  return new;
end;
$$;

revoke all on function public.books_track_reading() from public;

drop trigger if exists books_track_reading on public.books;
create trigger books_track_reading
  before update of current_page on public.books
  for each row execute function public.books_track_reading();

-- Libros nuevos: su página inicial no es una lectura registrada en la app.
create or replace function public.books_init_max_page()
returns trigger language plpgsql as $$
begin
  new.max_page_read := greatest(coalesce(new.max_page_read, 0), new.current_page);
  return new;
end;
$$;

drop trigger if exists books_init_max_page on public.books;
create trigger books_init_max_page
  before insert on public.books
  for each row execute function public.books_init_max_page();

-- ---------------------------------------------------------------------------
-- 5. Estado inicial a partir del historial existente (solo si no existe aún)
-- ---------------------------------------------------------------------------
do $$
declare
  p record;
  e record;
begin
  for p in
    select pr.id from public.profiles pr
    where not exists (select 1 from public.reading_streaks rs where rs.profile_id = pr.id)
  loop
    insert into public.reading_streaks (profile_id) values (p.id);
    for e in
      select at from public.events
      where user_id = p.id and pages_delta > 0
        and type in ('progress', 'book_finished', 'book_started')
      order by at
    loop
      perform public.register_reading(p.id, e.at);
    end loop;
  end loop;
end $$;
