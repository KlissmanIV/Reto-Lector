import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StreakFlame from './StreakFlame';
import StreakRing from './StreakRing';
import { useStreak } from './useStreak';
import { STATUS_LABEL, daysLabel, streakMessage, timeLeftLabel } from './streakCopy';
import { AnimatedNumber } from '../common/ui';

/** Resumen de racha para el inicio: anillo, contador, estado y enlace. */
export default function StreakCard() {
  const state = useStreak();
  const msg = streakMessage(state);
  const left = timeLeftLabel(state);

  return (
    <Link to="/racha" className={`streak-card is-${state.status}`} aria-label={`${STATUS_LABEL[state.status]}, ${daysLabel(state.count)}. Ver racha`}>
      <StreakRing fraction={state.fraction} status={state.status} label={left ?? STATUS_LABEL[state.status]}>
        <StreakFlame status={state.status} size={30} />
      </StreakRing>
      <div className="streak-card-body">
        <p className="streak-card-count">
          <AnimatedNumber value={state.count} className="tabular" />
          <span>{state.count === 1 ? 'día de racha' : 'días de racha'}</span>
        </p>
        <p className="streak-card-msg">{msg.title}{left ? ` · ${left}` : ''}</p>
      </div>
      <ArrowRight size={18} className="streak-card-arrow" aria-hidden="true" />
    </Link>
  );
}
