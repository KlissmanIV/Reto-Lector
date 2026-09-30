-- Reto Lector: esquema de base de datos (Supabase / PostgreSQL)
-- Ejecutar una vez en Supabase > SQL Editor. Es idempotente en lo posible.
-- Los identificadores son text para conservar los ids que ya usa el frontend.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

-- Participantes. Cada perfil se vincula a una cuenta de Supabase Auth.
create table if not exists public.profiles (
  id           text primary key,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name         text not null check (char_length(name) between 1 and 50),
  short_name   text not null check (char_length(short_name) between 1 and 16),
  color        text not null default '#3d6b73',
  bio          text not null default '' check (char_length(bio) <= 160),
  created_at   timestamptz not null default now()
);

create table if not exists public.challenges (
  id         text primary key,
  name       text not null check (char_length(name) between 1 and 60),
  start_date date not null,
  end_date   date not null,
  status     text not null default 'active' check (status in ('active', 'closed')),
  winner_id  text references public.profiles (id) on delete set null,
  tie        boolean not null default false,
  created_at timestamptz not null default now(),
  closed_at  timestamptz,
  check (end_date >= start_date)
);

-- Solo puede haber un reto activo a la vez.
create unique index if not exists challenges_one_active
  on public.challenges ((status)) where status = 'active';

create table if not exists public.challenge_participants (
  challenge_id text not null references public.challenges (id) on delete cascade,
  profile_id   text not null references public.profiles (id) on delete cascade,
  primary key (challenge_id, profile_id)
);

create table if not exists public.books (
  id           text primary key,
  owner_id     text not null references public.profiles (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 140),
  author       text not null check (char_length(author) between 1 and 100),
  pages        integer not null check (pages between 1 and 20000),
  current_page integer not null default 0,
  status       text not null default 'pending' check (status in ('pending', 'reading', 'finished')),
  started_at   date,
  finished_at  date,
  notes        text not null default '' check (char_length(notes) <= 1000),
  cover_color  text not null default '#3d6b73',
  cover_url    text not null default '',
  created_at   timestamptz not null default now(),
  check (current_page between 0 and pages)
);

create index if not exists books_owner_idx on public.books (owner_id);

-- Historial de actividad. Los puntos y las páginas de cada reto se calculan
-- a partir de estos eventos (book_finished aporta puntos; pages_delta, páginas).
create table if not exists public.events (
  id           text primary key,
  type         text not null check (type in (
                 'book_added', 'book_started', 'progress', 'book_finished',
                 'challenge_created', 'challenge_closed')),
  user_id      text references public.profiles (id) on delete cascade,   -- participante al que se refiere
  actor_id     uuid default auth.uid() references auth.users (id) on delete set null, -- cuenta que lo registró
  book_id      text references public.books (id) on delete set null,
  book_title   text,               -- se conserva aunque el libro se elimine
  challenge_id text references public.challenges (id) on delete cascade,
  pages        integer,
  pages_delta  integer not null default 0,
  page         integer,
  points       integer not null default 0 check (points between 0 and 3),
  at           timestamptz not null default now()
);

create index if not exists events_challenge_idx on public.events (challenge_id);
create index if not exists events_book_idx on public.events (book_id);
create index if not exists events_at_idx on public.events (at desc);

-- Regla de negocio: un libro solo entrega puntos una vez por reto.
create unique index if not exists events_one_award_per_book
  on public.events (book_id, challenge_id)
  where type = 'book_finished' and points > 0;

-- ---------------------------------------------------------------------------
-- Funciones auxiliares para RLS
-- ---------------------------------------------------------------------------

create or replace function public.current_profile_id()
returns text language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_user_id = auth.uid()
$$;

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where auth_user_id = auth.uid())
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Solo las cuentas vinculadas a un perfil ven datos. Todos los participantes
-- ven la competencia completa; cada uno modifica solo lo suyo.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.books enable row level security;
alter table public.events enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (public.is_member());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- Los retos son compartidos: cualquier participante puede crearlos, editarlos o cerrarlos.
drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges
  for select to authenticated using (public.is_member());

drop policy if exists challenges_insert on public.challenges;
create policy challenges_insert on public.challenges
  for insert to authenticated with check (public.is_member());

drop policy if exists challenges_update on public.challenges;
create policy challenges_update on public.challenges
  for update to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists participants_select on public.challenge_participants;
create policy participants_select on public.challenge_participants
  for select to authenticated using (public.is_member());

drop policy if exists participants_insert on public.challenge_participants;
create policy participants_insert on public.challenge_participants
  for insert to authenticated with check (public.is_member());

drop policy if exists books_select on public.books;
create policy books_select on public.books
  for select to authenticated using (public.is_member());

drop policy if exists books_insert_own on public.books;
create policy books_insert_own on public.books
  for insert to authenticated with check (owner_id = public.current_profile_id());

drop policy if exists books_update_own on public.books;
create policy books_update_own on public.books
  for update to authenticated
  using (owner_id = public.current_profile_id())
  with check (owner_id = public.current_profile_id());

drop policy if exists books_delete_own on public.books;
create policy books_delete_own on public.books
  for delete to authenticated using (owner_id = public.current_profile_id());

drop policy if exists events_select on public.events;
create policy events_select on public.events
  for select to authenticated using (public.is_member());

drop policy if exists events_insert_own on public.events;
create policy events_insert_own on public.events
  for insert to authenticated
  with check (public.is_member() and actor_id = auth.uid());

-- Se pueden modificar/eliminar los eventos propios (registrados por mí o sobre mí).
drop policy if exists events_update_own on public.events;
create policy events_update_own on public.events
  for update to authenticated
  using (actor_id = auth.uid() or user_id = public.current_profile_id())
  with check (actor_id = auth.uid() or user_id = public.current_profile_id());

drop policy if exists events_delete_own on public.events;
create policy events_delete_own on public.events
  for delete to authenticated
  using (actor_id = auth.uid() or user_id = public.current_profile_id());
