import { NavLink } from 'react-router-dom';
import StreakFlame from './StreakFlame';
import { useStreak } from './useStreak';
import { STATUS_LABEL, daysLabel } from './streakCopy';
import { AnimatedNumber } from '../common/ui';

/** Indicador del contador dentro de un enlace existente (menú lateral). */
export function StreakCount() {
  const state = useStreak();
  return (
    <span className={`streak-count is-${state.status}`}>
      <AnimatedNumber value={state.count} className="tabular" />
      <span className="visually-hidden"> {daysLabel(state.count)}, {STATUS_LABEL[state.status]}</span>
    </span>
  );
}

/** Contador compacto de racha para la barra superior móvil. */
export default function StreakChip({ className = '' }) {
  const state = useStreak();
  return (
    <NavLink
      to="/racha"
      className={`streak-chip is-${state.status} ${className}`}
      aria-label={`${STATUS_LABEL[state.status]}: ${daysLabel(state.count)}. Ver racha`}
    >
      <StreakFlame status={state.status} size={20} />
      <AnimatedNumber value={state.count} className="tabular" />
    </NavLink>
  );
}
