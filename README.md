# Reto Lector

Competencia de lectura entre dos participantes. React + Vite + JS, Bootstrap (solo CSS), Lucide. Datos compartidos en Supabase (PostgreSQL + Auth); el tema claro/oscuro se guarda en cada dispositivo.

```bash
npm install
cp .env.example .env   # rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5188
```

## Puesta en marcha de Supabase (una sola vez)

1. **SQL Editor**: ejecuta en este orden `supabase/schema.sql`, `supabase/streaks.sql` y `supabase/seed.sql`. Todos se pueden volver a ejecutar sin duplicar ni borrar datos.
2. **Authentication > Users > Add user**: crea una cuenta (correo + contraseña, marcando *Auto Confirm User*) para Giovanni y otra para Klissman.
3. **Authentication > Sign In / Providers**: desactiva *Allow new users to sign up* para que nadie más pueda registrarse.
4. **SQL Editor**: vincula cada cuenta con su participante (bloque comentado al final de `seed.sql`, con los correos reales).
5. **Project Settings > API**: copia *Project URL* y la clave *anon public*.
6. **Vercel > Settings > Environment Variables**: añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Production y Preview) y vuelve a desplegar.

Nunca uses la clave `service_role` en el frontend.

## Arquitectura

- `src/services/supabaseClient.js`: cliente de Supabase (solo variables de entorno).
- `src/services/storageService.js`: **única** puerta a la persistencia. Carga los datos, envía a Supabase solo las filas que cambian, gestiona la sesión y la migración única de datos locales antiguos.
- `src/context/AppDataContext.jsx`: estado de dominio y acciones. Actualiza la interfaz al instante y, si el guardado falla, vuelve a cargar el estado real del servidor. Al volver a la pestaña trae los cambios del otro dispositivo.
- `src/utils/scoring.js`: reglas de puntos y marcador.

## Seguridad (RLS)

- Solo las cuentas vinculadas a un participante ven datos. Los usuarios anónimos o sin perfil no ven nada.
- Cada participante crea, edita y borra solo sus libros y su perfil. Los retos son compartidos.
- Un índice único impide que un libro sume puntos dos veces en el mismo reto.

## Racha lectora

- La calcula la base de datos (`supabase/streaks.sql`): un trigger sobre `books` registra una lectura cuando `current_page` supera la página más alta alcanzada en ese libro. Bajar páginas o volver a subir hasta donde ya estabas no cuenta.
- Suma como máximo +1 cada 24 h. Activa 24 h tras la última lectura, en riesgo de 24 a 48 h, perdida a partir de 48 h (la siguiente lectura empieza en 1).
- La hora es la del servidor, así que da igual el dispositivo o la zona horaria. El cliente no puede escribir rachas (solo leerlas).
- `src/utils/streak.js` interpreta el estado para la interfaz (activa, en riesgo o perdida, y el tiempo restante).

## Reglas de puntuación

- 0-199 páginas = 1 · 200-399 = 2 · 400+ = 3.
- Los puntos se registran como evento `book_finished`. Reabrir un libro retira su evento; volver a terminarlo lo repone (nunca suma doble).
- Las páginas leídas del reto son la suma de los `pages_delta` de sus eventos.
