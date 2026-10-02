import { Link } from 'react-router-dom';
import { Flag, Pencil, Plus, Trophy } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useUi } from '../context/UiContext';
import DuelComparator from '../components/challenge/DuelComparator';
import ChallengeTimeline from '../components/challenge/ChallengeTimeline';
import WinnerBanner from '../components/challenge/WinnerBanner';
import { useCloseChallenge } from '../components/challenge/useChallengeActions';
import BookCover from '../components/books/BookCover';
import { Avatar, EmptyState, PageHeader } from '../components/common/ui';
import { SCORING_RULES } from '../utils/scoring';
import { formatShortDate, isChallengeOver } from '../utils/dates';

function ScoredBooks({ user, events, onOpen }) {
  return (
    <div className="scored">
      <h3 className="scored-head">
        <Avatar user={user} size={24} /> {user.shortName}
      </h3>
      {events.length === 0 ? (
        <p className="text-muted-2 scored-empty">Aún sin libros terminados.</p>
      ) : (
        <ul className="scored-list">
          {events.map(({ event, book }) => (
            <li key={event.id}>
              <div className="scored-item">
                {book ? <BookCover book={book} size="xs" /> : <span className="cover-missing" />}
                <span className="scored-info">
                  <span className="scored-title">{event.bookTitle}</span>
                  <span className="scored-meta tabular">{event.pages} pág. <span aria-hidden="true">·</span> {formatShortDate(event.at)}</span>
                </span>
                <span className="points-chip tabular">+{event.points}</span>
                {book && <button type="button" className="hit-area" onClick={() => onOpen(book.id)} aria-label={`Ver ${event.bookTitle}`} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Challenge() {
  const { activeChallenge, scores, leader, usersById, history, books, challenges } = useAppData();
  const { openBook, openChallengeForm } = useUi();
  const closeChallenge = useCloseChallenge();

  if (!activeChallenge) {
    const last = [...challenges].filter((c) => c.status === 'closed').sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
    return (
      <>
        <PageHeader title="Desafío" />
        <EmptyState
          icon={Flag}
          title="No hay un desafío en curso"
          action={
            <button type="button" className="btn btn-primary" onClick={() => openChallengeForm()}>
              <Plus size={18} aria-hidden="true" /> Crear desafío
            </button>
          }
        >
          {last
            ? `El último fue ${last.name}${last.winnerId ? `, ganado por ${usersById[last.winnerId]?.shortName}` : ''}. Empieza el siguiente cuando queráis.`
            : 'Cread vuestro primer desafío: elegid unas fechas y que gane quien más lea.'}
        </EmptyState>
        {last && (
          <p className="center-link"><Link to="/historial" className="btn-link">Ver desafíos anteriores</Link></p>
        )}
      </>
    );
  }

  const [a, b] = activeChallenge.participants.map((id) => usersById[id]);
  const over = isChallengeOver(activeChallenge);
  const booksById = Object.fromEntries(books.map((bk) => [bk.id, bk]));
  const scored = (uid) =>
    history
      .filter((e) => e.type === 'book_finished' && e.challengeId === activeChallenge.id && e.userId === uid && e.points > 0)
      .map((event) => ({ event, book: booksById[event.bookId] }));

  return (
    <div className="challenge-page">
      <PageHeader
        title={activeChallenge.name}
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => openChallengeForm(activeChallenge)}>
              <Pencil size={16} aria-hidden="true" /> Editar
            </button>
            {!over && (
              <button type="button" className="btn btn-ghost-danger" onClick={closeChallenge}>
                Terminar
              </button>
            )}
          </>
        }
      />
      <ChallengeTimeline challenge={activeChallenge} />

      {over && <WinnerBanner challenge={activeChallenge} winner={usersById[leader.leaderId]} tie={leader.tie} onClose={closeChallenge} />}

      {a && b && <DuelComparator a={a} b={b} scores={scores} leaderId={leader.leaderId} />}

      <div className="challenge-cols">
        <section className="section" aria-labelledby="scored-title">
          <h2 id="scored-title" className="section-title">Libros que puntuaron</h2>
          <div className="surface scored-grid">
            {a && <ScoredBooks user={a} events={scored(a.id)} onOpen={openBook} />}
            {b && <ScoredBooks user={b} events={scored(b.id)} onOpen={openBook} />}
          </div>
        </section>

        <section className="section" aria-labelledby="rules-title">
          <h2 id="rules-title" className="section-title">Cómo se puntúa</h2>
          <div className="surface rules">
            <ul className="rules-list">
              {SCORING_RULES.map((r) => (
                <li key={r.points}>
                  <span>{r.label}</span>
                  <span className="rules-pts tabular">{r.points} {r.points === 1 ? 'punto' : 'puntos'}</span>
                </li>
              ))}
            </ul>
            <p className="rules-note">
              <Trophy size={16} aria-hidden="true" />
              Los puntos se suman al marcar un libro como terminado dentro de las fechas. Cada libro puntúa una sola vez por desafío.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
