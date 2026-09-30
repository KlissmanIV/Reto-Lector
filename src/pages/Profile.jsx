import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BookCheck, Pencil } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useUi } from '../context/UiContext';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import ReadingNow from '../components/dashboard/ReadingNow';
import BookCover from '../components/books/BookCover';
import { Avatar, EmptyState, Segmented } from '../components/common/ui';
import { formatNumber, getAchievements, getUserStats } from '../utils/statistics';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { users, books, history, challenges, currentUser } = useAppData();
  const { openBook, openBookForm } = useUi();
  const [editing, setEditing] = useState(false);

  const user = users.find((u) => u.id === (userId || currentUser?.id));
  const stats = useMemo(() => (user ? getUserStats(user.id, books, history, challenges) : null), [user, books, history, challenges]);

  if (!user) return <Navigate to="/perfil" replace />;

  const own = books.filter((b) => b.ownerId === user.id);
  const reading = own.filter((b) => b.status === 'reading');
  const finished = own.filter((b) => b.status === 'finished').sort((a, b) => (b.finishedAt || '').localeCompare(a.finishedAt || '')).slice(0, 8);
  const achievements = getAchievements(stats);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  const tiles = [
    { label: 'Libros terminados', value: stats.finished },
    { label: 'Páginas leídas', value: formatNumber(stats.pages) },
    { label: 'Puntos totales', value: stats.points },
    { label: 'Desafíos ganados', value: stats.wins },
  ];

  return (
    <div className="profile-page">
      <Segmented
        label="Ver perfil de"
        size="sm"
        className="profile-switch"
        value={user.id}
        onChange={(id) => navigate(`/perfil/${id}`)}
        options={users.map((u) => ({ value: u.id, label: u.shortName }))}
      />

      <header className="profile-head">
        <Avatar user={user} size={84} />
        <div className="profile-id">
          <h1 className="profile-name">{user.name}</h1>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
        </div>
        <button type="button" className="btn btn-secondary profile-edit" onClick={() => setEditing(true)}>
          <Pencil size={16} aria-hidden="true" /> Editar
        </button>
      </header>

      <dl className="stat-tiles">
        {tiles.map((t) => (
          <div key={t.label} className="stat-tile">
            <dt>{t.label}</dt>
            <dd className="tabular">{t.value}</dd>
          </div>
        ))}
      </dl>

      <div className="profile-cols">
        <section className="section" aria-labelledby="p-reading">
          <h2 id="p-reading" className="section-title">En curso</h2>
          <ReadingNow user={user} books={reading} onOpen={openBook} onAdd={() => openBookForm(null, { ownerId: user.id, status: 'reading' })} />
        </section>

        <section className="section" aria-labelledby="p-ach">
          <div className="section-head">
            <h2 id="p-ach" className="section-title">Logros</h2>
            <span className="text-muted-2 tabular">{unlocked} de {achievements.length}</span>
          </div>
          <ul className="achievements">
            {achievements.map(({ id, icon: Icon, title, desc, unlocked: on }) => (
              <li key={id} className={`achievement ${on ? 'is-on' : ''}`}>
                <span className="achievement-icon" aria-hidden="true"><Icon size={18} /></span>
                <span className="achievement-text">
                  <span className="achievement-title">{title}</span>
                  <span className="achievement-desc">{desc}</span>
                </span>
                <span className="visually-hidden">{on ? 'Conseguido' : 'Pendiente'}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="section" aria-labelledby="p-finished">
        <h2 id="p-finished" className="section-title">Terminados recientemente</h2>
        {finished.length ? (
          <ul className="cover-row">
            {finished.map((b) => (
              <li key={b.id}>
                <button type="button" className="cover-row-item" onClick={() => openBook(b.id)} aria-label={`Ver ${b.title}`}>
                  <BookCover book={b} size="sm" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={BookCheck} title="Todavía sin libros terminados" compact>
            Los libros que {user.shortName} termine aparecerán aquí.
          </EmptyState>
        )}
      </section>

      <ProfileEditModal user={user} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
