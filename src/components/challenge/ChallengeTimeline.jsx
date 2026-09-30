import { CalendarClock } from 'lucide-react';
import { daysBetween, daysRemaining, formatRange, todayISO } from '../../utils/dates';

/** Días restantes y avance temporal del desafío. */
export default function ChallengeTimeline({ challenge, compact = false }) {
  const today = todayISO();
  const total = daysBetween(challenge.startDate, challenge.endDate) + 1;
  const elapsed = Math.min(total, Math.max(0, daysBetween(challenge.startDate, today) + 1));
  const left = daysRemaining(challenge.endDate, today);
  const over = today > challenge.endDate;
  const pct = Math.round((elapsed / total) * 100);

  return (
    <div className={`timeline ${compact ? 'is-compact' : ''}`}>
      <div className="timeline-top">
        <span className="timeline-days">
          <CalendarClock size={16} aria-hidden="true" />
          {over ? 'Finalizado' : left === 0 ? 'Último día' : <><strong className="tabular">{left}</strong> {left === 1 ? 'día restante' : 'días restantes'}</>}
        </span>
        <span className="timeline-range">{formatRange(challenge.startDate, challenge.endDate)}</span>
      </div>
      <div className="timeline-track" aria-hidden="true">
        <span style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}
