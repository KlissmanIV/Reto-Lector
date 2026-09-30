import { BookCheck, BookOpen, BookPlus, Flag, Trophy, TrendingUp } from 'lucide-react';
import { Avatar } from '../common/ui';
import { relativeTime } from '../../utils/dates';

function describe(e, user) {
  const who = user?.shortName ?? 'Alguien';
  const title = e.bookTitle ? `«${e.bookTitle}»` : '';
  switch (e.type) {
    case 'book_finished':
      return { icon: BookCheck, text: <><strong>{who}</strong> terminó {title}</>, badge: e.points ? `+${e.points}` : null };
    case 'progress':
      return {
        icon: TrendingUp,
        text: e.pagesDelta >= 0
          ? <><strong>{who}</strong> leyó {e.pagesDelta} págs. de {title}</>
          : <><strong>{who}</strong> corrigió su progreso en {title}</>,
      };
    case 'book_started':
      return { icon: BookOpen, text: <><strong>{who}</strong> empezó {title}</> };
    case 'book_added':
      return { icon: BookPlus, text: <><strong>{who}</strong> añadió {title} a su biblioteca</> };
    case 'challenge_created':
      return { icon: Flag, text: <>Comenzó <strong>{e.challengeName}</strong></> };
    case 'challenge_closed':
      return { icon: Trophy, text: user ? <><strong>{who}</strong> ganó {e.challengeName}</> : <>{e.challengeName} terminó en empate</> };
    default:
      return null;
  }
}

export function ActivityItem({ event, user }) {
  const d = describe(event, user);
  if (!d) return null;
  const Icon = d.icon;
  return (
    <li className={`activity-item type-${event.type}`}>
      <span className="activity-avatar">
        {user ? <Avatar user={user} size={34} /> : <span className="activity-sys" aria-hidden="true"><Icon size={16} /></span>}
        {user && <span className="activity-glyph" aria-hidden="true"><Icon size={11} strokeWidth={2.4} /></span>}
      </span>
      <p className="activity-text">{d.text}</p>
      <span className="activity-side">
        {d.badge && <span className="points-chip tabular">{d.badge}</span>}
        <time dateTime={event.at} className="activity-time">{relativeTime(event.at)}</time>
      </span>
    </li>
  );
}

export default function ActivityFeed({ events, usersById }) {
  return (
    <ul className="activity-list">
      {events.map((e) => <ActivityItem key={e.id} event={e} user={usersById[e.userId]} />)}
    </ul>
  );
}
