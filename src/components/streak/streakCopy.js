import { formatDuration } from '../../utils/streak';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const daysLabel = (n) => plural(n, 'día', 'días');

export const STATUS_LABEL = {
  active: 'Racha activa',
  grace: 'En riesgo',
  lost: 'Racha perdida',
  new: 'Sin racha',
};

/** Título y mensaje cortos según el estado de la racha. */
export function streakMessage(state) {
  switch (state.status) {
    case 'active':
      return {
        title: state.nextIncrementIn > 0 ? 'Hoy ya sumaste' : 'Lista para sumar',
        text: state.nextIncrementIn > 0
          ? `Vuelve a leer en ${formatDuration(state.nextIncrementIn)} para sumar otro día.`
          : 'Lee al menos 1 página para sumar otro día.',
      };
    case 'grace':
      return {
        title: 'Tu racha está en riesgo',
        text: `Lee al menos 1 página en ${formatDuration(state.msLeft)} para conservarla.`,
      };
    case 'lost':
      return { title: 'Se apagó tu racha', text: 'Registra una página y empieza de nuevo desde 1.' };
    default:
      return { title: 'Enciende tu racha', text: 'Registra al menos 1 página en cualquier libro para empezar.' };
  }
}

export function timeLeftLabel(state) {
  if (state.status === 'active') return `Activa ${formatDuration(state.msLeft)} más`;
  if (state.status === 'grace') return `Quedan ${formatDuration(state.msLeft)}`;
  return null;
}
