import { Link } from 'react-router-dom';
import { ArrowRight, Flag, History as HistoryIcon, Plus } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useUi } from '../context/UiContext';
import ScoreBoard from '../components/challenge/ScoreBoard';
import ChallengeTimeline from '../components/challenge/ChallengeTimeline';
import WinnerBanner from '../components/challenge/WinnerBanner';
import { useCloseChallenge } from '../components/challenge/useChallengeActions';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import ReadingNow from '../components/dashboard/ReadingNow';
import { EmptyState } from '../components/common/ui';
import { isChallengeOver } from '../utils/dates';

export default function Dashboard() {
  const { users, books, history, activeChallenge, scores, leader, usersById, currentUser } = useAppData();
  const { openBook, openBookForm, openChallengeForm } = useUi();
  const closeChallenge = useCloseChallenge();
  const over = isChallengeOver(activeChallenge);
  const recent = history.slice(0, 6);

  return (
    <div className="dashboard">
      <p className="greeting">Hola, {currentUser?.shortName}</p>

      {activeChallenge ? (
        <section className="hero-card" aria-labelledby="challenge-name">
          <div className="hero-head">
            <h1 id="challenge-name" className="hero-title">{activeChallenge.name}</h1>
            <Link to="/desafio" className="btn-link">
              Ver desafío <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ChallengeTimeline challenge={activeChallenge} />
          {over && (
            <WinnerBanner
              challenge={activeChallenge}
              winner={usersById[leader.leaderId]}
              tie={leader.tie}
              onClose={closeChallenge}
            />
          )}
          <ScoreBoard challenge={activeChallenge} users={usersById} scores={scores} leader={leader} />
        </section>
      ) : (
        <section className="hero-card">
          <h1 className="visually-hidden">Inicio</h1>
          <EmptyState
            icon={Flag}
            title="No hay un desafío en curso"
            action={
              <button type="button" className="btn btn-primary" onClick={() => openChallengeForm()}>
                <Plus size={18} aria-hidden="true" /> Crear desafío
              </button>
            }
          >
            Elige un nombre y unas fechas. Cada libro terminado dentro del plazo suma puntos según sus páginas.
          </EmptyState>
        </section>
      )}

      <section className="section" aria-labelledby="reading-now">
        <h2 id="reading-now" className="section-title">Leyendo ahora</h2>
        <div className="reading-grid">
          {users.slice(0, 2).map((u) => (
            <ReadingNow
              key={u.id}
              user={u}
              books={books.filter((b) => b.ownerId === u.id && b.status === 'reading')}
              onOpen={openBook}
              onAdd={() => openBookForm(null, { ownerId: u.id, status: 'reading' })}
            />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="recent">
        <div className="section-head">
          <h2 id="recent" className="section-title">Actividad reciente</h2>
          {recent.length > 0 && (
            <Link to="/historial" className="btn-link">
              Historial <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
        {recent.length ? (
          <div className="surface">
            <ActivityFeed events={recent} usersById={usersById} />
          </div>
        ) : (
          <EmptyState icon={HistoryIcon} title="Todavía no hay actividad" compact>
            Cuando alguien añada, avance o termine un libro aparecerá aquí.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
