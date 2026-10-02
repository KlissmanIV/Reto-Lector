-- Reto Lector: gestión de participantes. Ejecutar en Supabase > SQL Editor.
-- Copia solo el bloque que necesites y sustituye los valores en MAYÚSCULAS.

-- ---------------------------------------------------------------------------
-- 1. Desactivar un participante (no borra nada)
--    Desaparecen de la app su perfil, sus libros, su actividad y los retos en
--    los que participó. Su cuenta deja de tener acceso.
-- ---------------------------------------------------------------------------
begin;
-- Cierra el reto activo en el que participa (solo puede haber uno activo).
update public.challenges set status = 'closed', closed_at = now()
  where status = 'active'
    and id in (select challenge_id from public.challenge_participants where profile_id = 'ID_PERFIL');
update public.profiles set active = false where id = 'ID_PERFIL';   -- p. ej. 'u-giovanni'
commit;

-- ---------------------------------------------------------------------------
-- 2. Añadir un participante nuevo
--    a) Authentication > Users > Add user (correo + contraseña, Auto Confirm).
--    b) Ejecuta este bloque.
--    c) En la app, crea un reto nuevo: los participantes son los perfiles activos.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, name, short_name, color, auth_user_id)
values ('u-NOMBRE', 'Nombre Completo', 'Nombre', '#5b3a5e',
        (select id from auth.users where email = 'CORREO_NUEVO'))
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Reactivar un participante
--    Vuelven a verse su perfil, libros, actividad y retos anteriores (cerrados).
--    La app compara solo de dos en dos: desactiva antes a otro si ya hay dos activos.
-- ---------------------------------------------------------------------------
update public.profiles set active = true where id = 'ID_PERFIL';

-- Consultar el estado de todos los participantes:
select id, name, active, (select email from auth.users u where u.id = auth_user_id) as email
from public.profiles order by created_at;
