import { Crown } from 'lucide-react';
import { AnimatedNumber, Avatar } from '../common/ui';
import { formatNumber } from '../../utils/statistics';

const plural = (n, one, many) => (n === 1 ? one : many);

function Side({ user, score, isLeader, align }) {
  return (
    <div className={`sb-side align-${align} ${isLeader ? 'is-leader' : ''}`}>
      <div className="sb-person">
        <Avatar user={user} size={44} />
        <span className="sb-name">{user.shortName}</span>
      </div>
      <div className="sb-lead-row">
        {isLeader && (
          <span className="sb-lead">
            <Crown size={13} aria-hidden="true" /> Lidera
          </span>
        )}
      </div>
      <p className="sb-points">
        <AnimatedNumber value={score.points} className="tabular" />
        <span className="sb-points-label">{plural(score.points, 'punto', 'puntos')}</span>
      </p>
      <dl className="sb-stats">
        <div><dt className="visually-hidden">Libros terminados</dt><dd className="tabular">{score.books} {plural(score.books, 'libro', 'libros')}</dd></div>
        <div><dt className="visually-hidden">Páginas leídas</dt><dd className="tabular">{formatNumber(score.pages)} pág.</dd></div>
      </dl>
    </div>
  );
}

/** Marcador principal: dos participantes enfrentados y barra de reparto de puntos. */
export default function ScoreBoard({ challenge, users, scores, leader }) {
  const [a, b] = challenge.participants.map((id) => users[id]).filter(Boolean);
  if (!a || !b) return null;
  const sa = scores[a.id];
  const sb = scores[b.id];
  const total = sa.points + sb.points;
  const share = total ? (sa.points / total) * 100 : 50;
  const diff = Math.abs(sa.points - sb.points);

  return (
    <section className="scoreboard" aria-label="Marcador del desafío">
      <div className="sb-row">
        <Side user={a} score={sa} isLeader={leader.leaderId === a.id} align="start" />
        <div className="sb-vs" aria-hidden="true">vs</div>
        <Side user={b} score={sb} isLeader={leader.leaderId === b.id} align="end" />
      </div>
      <div className="sb-split" aria-hidden="true">
        <span className="sb-split-a" style={{ flexGrow: share, '--c': a.color }} />
        <span className="sb-split-b" style={{ flexGrow: 100 - share, '--c': b.color }} />
      </div>
      <p className="sb-caption">
        {leader.tie
          ? 'Empate. El próximo libro terminado decide.'
          : `${(leader.leaderId === a.id ? a : b).shortName} va ${diff} ${plural(diff, 'punto', 'puntos')} por delante.`}
      </p>
    </section>
  );
}
