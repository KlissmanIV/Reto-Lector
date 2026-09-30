import { BookOpen, Plus } from 'lucide-react';
import BookCover from '../books/BookCover';
import { Avatar, ProgressBar } from '../common/ui';
import { formatNumber, progressPercent } from '../../utils/statistics';

/** Libro(s) en curso de un participante, con acceso directo al detalle. */
export default function ReadingNow({ user, books, onOpen, onAdd }) {
  return (
    <div className="reading-now">
      <div className="rn-head">
        <Avatar user={user} size={26} />
        <span className="rn-name">{user.shortName} está leyendo</span>
      </div>
      {books.length === 0 ? (
        <div className="rn-empty">
          <BookOpen size={18} aria-hidden="true" />
          <span>Nada en curso.</span>
          {onAdd && (
            <button type="button" className="btn-link" onClick={onAdd}>
              <Plus size={15} aria-hidden="true" /> Añadir libro
            </button>
          )}
        </div>
      ) : (
        <ul className="rn-list">
          {books.map((b) => {
            const pct = progressPercent(b);
            return (
              <li key={b.id}>
                <button type="button" className="rn-item" onClick={() => onOpen(b.id)}>
                  <BookCover book={b} size="xs" />
                  <span className="rn-info">
                    <span className="rn-title">{b.title}</span>
                    <span className="rn-author">{b.author}</span>
                    <ProgressBar value={pct} size="sm" label={`Progreso de ${b.title}`} />
                    <span className="rn-pages tabular">
                      {formatNumber(b.currentPage)} / {formatNumber(b.pages)} pág. <span aria-hidden="true">·</span> {pct}%
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
