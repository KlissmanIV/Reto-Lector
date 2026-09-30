# Duelo Lector

Competencia de lectura entre dos participantes. Fase 1: solo frontend (React + Vite + JS, Bootstrap como infraestructura, Lucide, datos en localStorage).

```bash
npm install
npm run dev      # http://localhost:5188
```

## Arquitectura

- `src/services/storageService.js`: **única** puerta a la persistencia. Funciones asíncronas (`getBooks`, `saveBooks`, etc.) para poder cambiarlas por API/Supabase sin tocar componentes.
- `src/context/AppDataContext.jsx`: estado de dominio y acciones (añadir, progresar, terminar, desafíos). Persiste solo vía storageService.
- `src/context/UiContext.jsx`: modales y flujos compartidos (detalle, formulario, confirmaciones, celebración).
- `src/utils/scoring.js`: reglas de puntos y marcador (sin UI).
- `src/data/demoData.js`: datos demo con fechas relativas a hoy.

## Reglas de puntuación

- 0-199 páginas = 1 · 200-399 = 2 · 400+ = 3.
- Los puntos se registran como evento `book_finished` con `challengeId`. Un libro no puede tener dos eventos con puntos en el mismo desafío.
- Reabrir un libro terminado retira su evento del desafío en curso; volver a terminarlo lo repone (nunca suma doble).
- Las páginas leídas del desafío son la suma de los `pagesDelta` de sus eventos. El avance previo a registrar un libro no cuenta.

## Pendiente para backend

Sustituir el interior de `storageService.js`. El historial de eventos (`history`) está pensado para mapear a una tabla `events`.
