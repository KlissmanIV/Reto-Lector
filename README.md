# Reto Lector

Competencia de lectura entre dos participantes. React + Vite + JS, Bootstrap (solo CSS), Lucide. Datos compartidos en Supabase (PostgreSQL + Auth); el tema claro/oscuro se guarda en cada dispositivo.

```bash
npm install
cp .env.example .env   # rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5188
```

## Puesta en marcha de Supabase (una sola vez)

1. **SQL Editor**: ejecuta `supabase/schema.sql` y después `supabase/seed.sql`. Ambos se pueden volver a ejecutar sin duplicar datos.
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

## Reglas de puntuación

- 0-199 páginas = 1 · 200-399 = 2 · 400+ = 3.
- Los puntos se registran como evento `book_finished`. Reabrir un libro retira su evento; volver a terminarlo lo repone (nunca suma doble).
- Las páginas leídas del reto son la suma de los `pages_delta` de sus eventos.
