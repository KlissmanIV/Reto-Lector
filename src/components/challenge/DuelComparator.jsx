import { AnimatedNumber, Avatar } from '../common/ui';
import { formatNumber } from '../../utils/statistics';

const METRICS = [
  { key: 'points', label: 'Puntos' },
  { key: 'books', label: 'Libros terminados' },
  { key: 'pages', label: 'Páginas leídas', format: formatNumber },
];

/** Comparador central: cada métrica con barras que crecen desde el centro. */
export default function DuelComparator({ a, b, scores, leaderId }) {
  const sa = scores[a.id];
  const sb = scores[b.id];

  return (
    <section className="duel" aria-label={`Comparativa entre ${a.shortName} y ${b.shortName}`}>
      <div className="duel-head">
        <div className={`duel-person ${leaderId === a.id ? 'is-leader' : ''}`}>
          <Avatar user={a} size={56} />
          <span className="duel-name">{a.shortName}</span>
          <span className="duel-points"><AnimatedNumber value={sa.points} className="tabular" /><small>pts</small></span>
        </div>
        <span className="duel-vs" aria-hidden="true">VS</span>
        <div className={`duel-person ${leaderId === b.id ? 'is-leader' : ''}`}>
          <Avatar user={b} size={56} />
          <span className="duel-name">{b.shortName}</span>
          <span className="duel-points"><AnimatedNumber value={sb.points} className="tabular" /><small>pts</small></span>
        </div>
      </div>

      <dl className="duel-metrics">
        {METRICS.map(({ key, label, format = (n) => n }) => {
          const va = sa[key];
          const vb = sb[key];
          const max = Math.max(va, vb, 1);
          return (
            <div className="duel-metric" key={key}>
              <dt className="duel-metric-label">{label}</dt>
              <dd className="duel-metric-row">
                <span className={`duel-val tabular ${va > vb ? 'is-ahead' : ''}`}>{format(va)}</span>
                <span className="duel-bar is-left" aria-hidden="true">
                  <span style={{ transform: `scaleX(${va / max})`, '--c': a.color }} />
                </span>
                <span className="duel-bar is-right" aria-hidden="true">
                  <span style={{ transform: `scaleX(${vb / max})`, '--c': b.color }} />
                </span>
                <span className={`duel-val tabular ${vb > va ? 'is-ahead' : ''}`}>{format(vb)}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
