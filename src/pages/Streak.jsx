import { useMemo } from 'react';
import { BookOpen, Check, Hourglass, Timer } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useNow } from '../hooks/useNow';
import StreakFlame from '../components/streak/StreakFlame';
import StreakRing from '../components/streak/StreakRing';
import { STATUS_LABEL, daysLabel, streakMessage, timeLeftLabel } from '../components/streak/streakCopy';
import { AnimatedNumber, Avatar, PageHeader } from '../components/common/ui';
import { STREAK_MILESTONES, getStreakState, nextMilestone, recentReadingDays } from '../utils/streak';
import { formatShortDate, relativeTime } from '../utils/dates';

const WEEKDAY = new Intl.DateTimeFormat('es-ES', { weekday: 'narrow' });
const HOW_IT_WORKS = [
  { icon: BookOpen, title: 'Lee al menos 1 página', text: 'Al subir el progreso de cualquier libro, la racha se enciende o suma un día.' },
  { icon: Timer, title: '24 h activa', text: 'Tras cada lectura la racha queda activa durante 24 horas. Suma como máximo un día cada 24 h.' },
  { icon: Hourglass, title: '24 h de gracia', text: 'Si pasan, tienes 24 horas más para leer y conservarla. Después vuelve a 0.' },
];

function WeekStrip({ days }) {
  return (
    <ol className="week-strip" aria-label="Lectura de los últimos 7 días">
      {days.map((d) => {
        const date = new Date(`${d.date}T12:00:00`);
        return (
          <li key={d.date} className={`week-day ${d.read ? 'is-read' : ''} ${d.isToday ? 'is-today' : ''}`}>
            <span className="week-dot" aria-hidden="true">{d.read && <Check size={14} strokeWidth={3} />}</span>
            <span className="week-label">{WEEKDAY.format(date)}</span>
            <span className="visually-hidden">{formatShortDate(d.date)}: {d.read ? 'leíste' : 'sin lectura'}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function Streak() {
  const { currentUser, users, streaks, history } = useAppData();
  const now = useNow();
  const streak = streaks?.[currentUser?.id];
  const state = getStreakState(streak, now);
  const msg = streakMessage(state);
  const left = timeLeftLabel(state);
  const days = useMemo(() => recentReadingDays(history, currentUser?.id), [history, currentUser?.id]);
  const next = nextMilestone(state.count);

  const stats = [
    { label: 'Racha actual', value: daysLabel(state.count) },
    { label: 'Récord', value: daysLabel(state.best) },
    { label: 'Inicio de la racha', value: state.count && streak?.startedAt ? formatShortDate(streak.startedAt) : '-' },
    { label: 'Última lectura', value: streak?.lastReadAt ? relativeTime(streak.lastReadAt) : '-' },
  ];

  return (
    <div className="streak-page">
      <PageHeader title="Racha lectora" subtitle="Constancia antes que velocidad." />

      <section className={`streak-hero is-${state.status}`} aria-labelledby="streak-title">
        <StreakRing fraction={state.fraction} status={state.status} label={left ?? STATUS_LABEL[state.status]}>
          <StreakFlame status={state.status} size={64} />
          <p className="streak-hero-count">
            <AnimatedNumber value={state.count} className="tabular" />
          </p>
          <p className="streak-hero-unit">{state.count === 1 ? 'día' : 'días'}</p>
        </StreakRing>

        <div className="streak-hero-text" aria-live="polite">
          <span className={`streak-status is-${state.status}`}>{STATUS_LABEL[state.status]}</span>
          <h2 id="streak-title" className="streak-hero-title">{msg.title}</h2>
          <p className="streak-hero-msg">{msg.text}</p>
          {left && <p className="streak-hero-left tabular"><Timer size={15} aria-hidden="true" /> {left}</p>}
        </div>
      </section>

      <section className="section" aria-labelledby="week-title">
        <h2 id="week-title" className="section-title">Últimos 7 días</h2>
        <div className="surface week-card">
          <WeekStrip days={days} />
        </div>
      </section>

      <dl className="stat-tiles">
        {stats.map((s) => (
          <div key={s.label} className="stat-tile">
            <dt>{s.label}</dt>
            <dd className="tabular">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="streak-cols">
        <section className="section" aria-labelledby="ms-title">
          <div className="section-head">
            <h2 id="ms-title" className="section-title">Metas</h2>
            {next && <span className="text-muted-2 tabular">{next - state.count} para {next}</span>}
          </div>
          <ul className="milestones">
            {STREAK_MILESTONES.map((m) => (
              <li key={m} className={`milestone ${state.best >= m ? 'is-on' : ''}`}>
                <StreakFlame status={state.best >= m ? 'active' : 'lost'} size={18} />
                <span className="tabular">{m}</span>
                <span className="visually-hidden">{state.best >= m ? 'conseguida' : 'pendiente'}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" aria-labelledby="duel-streak-title">
          <h2 id="duel-streak-title" className="section-title">Rachas del duelo</h2>
          <ul className="surface duel-streaks">
            {users.map((u) => {
              const s = getStreakState(streaks?.[u.id], now);
              return (
                <li key={u.id} className="duel-streak">
                  <Avatar user={u} size={34} />
                  <span className="duel-streak-name">{u.shortName}{u.id === currentUser?.id ? ' (tú)' : ''}</span>
                  <span className={`duel-streak-val is-${s.status}`}>
                    <StreakFlame status={s.status} size={18} />
                    <span className="tabular">{s.count}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="section" aria-labelledby="how-title">
        <h2 id="how-title" className="section-title">Cómo funciona</h2>
        <ol className="how-list">
          {HOW_IT_WORKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="how-item">
              <span className="how-icon" aria-hidden="true"><Icon size={18} /></span>
              <span>
                <span className="how-title">{title}</span>
                <span className="how-text">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
