-- Reto Lector: datos iniciales de la competencia.
-- Ejecutar DESPUÉS de schema.sql. Es idempotente: volver a ejecutarlo no duplica nada.

insert into public.profiles (id, name, short_name, color) values
  ('u-giovanni', 'Giovanni', 'Giovanni', '#3d6b73'),
  ('u-klissman', 'Klissman', 'Klissman', '#b5643c')
on conflict (id) do nothing;

insert into public.challenges (id, name, start_date, end_date, status, created_at) values
  ('c-competencia', 'Competencia por un libro', '2026-09-01', '2026-10-31', 'active', '2026-09-01 09:00:00+00')
on conflict (id) do nothing;

insert into public.challenge_participants (challenge_id, profile_id) values
  ('c-competencia', 'u-giovanni'),
  ('c-competencia', 'u-klissman')
on conflict do nothing;

insert into public.books (id, owner_id, title, author, pages, current_page, status, finished_at, cover_color, created_at) values
  ('b-1', 'u-giovanni', 'Los manuscritos rojos de la magia', 'Cassandra Clare y Wesley Chu', 368, 368, 'finished', '2026-09-29', '#8c3b2e', '2026-09-29 20:01:00+00'),
  ('b-2', 'u-giovanni', 'Una corte de alas y ruinas', 'Sarah J. Maas', 704, 704, 'finished', '2026-09-29', '#2f4b3a', '2026-09-29 20:02:00+00'),
  ('b-3', 'u-giovanni', 'Una corte de hielo y estrellas', 'Sarah J. Maas', 272, 272, 'finished', '2026-09-29', '#4a5d7e', '2026-09-29 20:03:00+00'),
  ('b-4', 'u-klissman', 'Ecce Homo', 'Friedrich Nietzsche', 160, 160, 'finished', '2026-09-29', '#27272a', '2026-09-29 20:04:00+00'),
  ('b-5', 'u-klissman', 'El idiota', 'Fiódor Dostoievski', 720, 720, 'finished', '2026-09-29', '#c9a227', '2026-09-29 20:05:00+00'),
  ('b-6', 'u-klissman', 'Los años de peregrinación del chico sin color', 'Haruki Murakami', 320, 320, 'finished', '2026-09-29', '#3d6b73', '2026-09-29 20:06:00+00'),
  ('b-7', 'u-klissman', 'Mujeres', 'Charles Bukowski', 352, 352, 'finished', '2026-09-29', '#9d4a61', '2026-09-29 20:07:00+00'),
  ('b-8', 'u-klissman', 'Noches blancas', 'Fiódor Dostoievski', 96, 96, 'finished', '2026-09-29', '#d4c4a8', '2026-09-29 20:08:00+00'),
  ('b-9', 'u-klissman', 'El proceso', 'Franz Kafka', 256, 256, 'finished', '2026-09-29', '#5b3a5e', '2026-09-29 20:09:00+00')
on conflict (id) do nothing;

-- actor_id queda nulo: son datos cargados por el administrador.
insert into public.events (id, type, user_id, actor_id, book_id, book_title, challenge_id, pages, pages_delta, points, at) values
  ('e-0', 'challenge_created', 'u-giovanni', null, null, null, 'c-competencia', null, 0, 0, '2026-09-01 09:00:00+00'),
  ('e-1', 'book_finished', 'u-giovanni', null, 'b-1', 'Los manuscritos rojos de la magia', 'c-competencia', 368, 368, 2, '2026-09-29 20:01:00+00'),
  ('e-2', 'book_finished', 'u-giovanni', null, 'b-2', 'Una corte de alas y ruinas', 'c-competencia', 704, 704, 3, '2026-09-29 20:02:00+00'),
  ('e-3', 'book_finished', 'u-giovanni', null, 'b-3', 'Una corte de hielo y estrellas', 'c-competencia', 272, 272, 2, '2026-09-29 20:03:00+00'),
  ('e-4', 'book_finished', 'u-klissman', null, 'b-4', 'Ecce Homo', 'c-competencia', 160, 160, 1, '2026-09-29 20:04:00+00'),
  ('e-5', 'book_finished', 'u-klissman', null, 'b-5', 'El idiota', 'c-competencia', 720, 720, 3, '2026-09-29 20:05:00+00'),
  ('e-6', 'book_finished', 'u-klissman', null, 'b-6', 'Los años de peregrinación del chico sin color', 'c-competencia', 320, 320, 2, '2026-09-29 20:06:00+00'),
  ('e-7', 'book_finished', 'u-klissman', null, 'b-7', 'Mujeres', 'c-competencia', 352, 352, 2, '2026-09-29 20:07:00+00'),
  ('e-8', 'book_finished', 'u-klissman', null, 'b-8', 'Noches blancas', 'c-competencia', 96, 96, 1, '2026-09-29 20:08:00+00'),
  ('e-9', 'book_finished', 'u-klissman', null, 'b-9', 'El proceso', 'c-competencia', 256, 256, 2, '2026-09-29 20:09:00+00')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Vincular cuentas (ejecutar después de crear los dos usuarios en
-- Authentication > Users). Sustituye los correos por los reales.
-- ---------------------------------------------------------------------------
-- update public.profiles set auth_user_id = (select id from auth.users where email = 'CORREO_DE_GIOVANNI')
--   where id = 'u-giovanni';
-- update public.profiles set auth_user_id = (select id from auth.users where email = 'CORREO_DE_KLISSMAN')
--   where id = 'u-klissman';
