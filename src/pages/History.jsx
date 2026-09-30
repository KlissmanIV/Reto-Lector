import { useMemo, useState } from 'react';
import { History as HistoryIcon, Trophy } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { ActivityItem } from '../components/dashboard/ActivityFeed';
import { Avatar, EmptyState, PageHeader, Segmented } from '../components/common/ui';
import { dayLabel, formatRange } from '../utils/dates';
import { formatNumber } from '../utils/statistics';

const PAGE_SIZE = 25;

function PastChallenge({ challenge, usersById }) {
  const winner = usersById[challenge.winnerId];
  const [a, b] = challenge.participants.map((id) => usersById[id]).filter(Boolean);
  const fs = challenge.finalScores || {};
  return (
    <article className="past-card">
      <header className="past-head">
        <div className="min-w-0">
          <h3 className="past-name">{challenge.name}</h3>
          <p className="past-range">{formatRange(challenge.startDate, challenge.endDate)}</p>
        </div>
        <span className="past-winner">
          <Trophy size={14} aria-hidden="true" />
          {winner ? winner.shortName : 'Empate'}
        </span>
      </header>
      {a && b && (
        <div className="past-score">
          {[a, b].map((u) => (
            <div key={u.id} className={`past-side ${challenge.winnerId === u.id ? 'is-winner' : ''}`}>
              <Avatar user={u} size={28} />
              <span className="past-pts tabular">{fs[u.id]?.points ?? 0}</span>
              <span className="past-sub tabular">
                {fs[u.id]?.books ?? 0} libros <span aria-hidden="true">·</span> {formatNumber(fs[u.id]?.pages)} pág.
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function History() {
  const { history, challenges, users, usersById } = useAppData();
  const [who, setWho] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const past = useMemo(
    () => challenges.filter((c) => c.status === 'closed').sort((x, y) => y.endDate.localeCompare(x.endDate)),
    [challenges],
  );

  const filtered = useMemo(
    () => (who === 'all' ? history : history.filter((e) => e.userId === who)),
    [history, who],
  );

  const groups = useMemo(() => {
    const out = [];
    for (const e of filtered.slice(0, limit)) {
      const label = dayLabel(e.at);
      if (out.at(-1)?.label !== label) out.push({ label, items: [] });
      out.at(-1).items.push(e);
    }
    return out;
  }, [filtered, limit]);

  return (
    <div className="history-page">
      <PageHeader title="Historial" subtitle="Desafíos anteriores y toda la actividad de lectura." />

      <section className="section" aria-labelledby="past-title">
        <h2 id="past-title" className="section-title">Desafíos anteriores</h2>
        {past.length ? (
          <div className="past-grid">
            {past.map((c) => <PastChallenge key={c.id} challenge={c} usersById={usersById} />)}
          </div>
        ) : (
          <EmptyState icon={Trophy} title="Aún no hay desafíos cerrados" compact>
            Cuando termine un desafío, su resultado quedará guardado aquí.
          </EmptyState>
        )}
      </section>

      <section className="section" aria-labelledby="activity-title">
        <div className="section-head">
          <h2 id="activity-title" className="section-title">Actividad</h2>
          <Segmented
            size="sm"
            label="Filtrar actividad"
            value={who}
            onChange={(v) => { setWho(v); setLimit(PAGE_SIZE); }}
            options={[{ value: 'all', label: 'Todos' }, ...users.map((u) => ({ value: u.id, label: u.shortName }))]}
          />
        </div>

        {groups.length ? (
          <div className="surface">
            {groups.map((g) => (
              <div key={g.label} className="day-group">
                <h3 className="day-label">{g.label}</h3>
                <ul className="activity-list">
                  {g.items.map((e) => <ActivityItem key={e.id} event={e} user={usersById[e.userId]} />)}
                </ul>
              </div>
            ))}
            {filtered.length > limit && (
              <div className="load-more">
                <button type="button" className="btn btn-secondary" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                  Mostrar más
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon={HistoryIcon} title="Sin actividad registrada" compact>
            Añade o actualiza un libro y el movimiento aparecerá aquí.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
