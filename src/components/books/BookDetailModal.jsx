import { CalendarDays, Pencil, Sparkles, Trash2, X } from 'lucide-react';
import Modal from '../common/Modal';
import BookCover from './BookCover';
import ProgressUpdater from './ProgressUpdater';
import StatusBadge from './StatusBadge';
import { STATUS_OPTIONS } from './bookMeta';
import { Avatar, Segmented } from '../common/ui';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { calcularPuntos, findAward } from '../../utils/scoring';
import { formatShortDate } from '../../utils/dates';
import { formatNumber, progressPercent } from '../../utils/statistics';

export default function BookDetailModal({ bookId, open: requestedOpen, onClose, onEdit, onDelete, onStatus, onFinish }) {
  const { books, usersById, history, challenges, activeChallenge, currentUser, actions } = useAppData();
  const { toast } = useToast();
  const book = books.find((b) => b.id === bookId);
  const open = requestedOpen && !!book;

  const owner = book ? usersById[book.ownerId] : null;
  // Solo el dueño puede modificar su libro (la base de datos aplica la misma regla).
  const canEdit = !!book && book.ownerId === currentUser?.id;
  const points = book ? calcularPuntos(book.pages) : 0;
  const award = book?.status === 'finished'
    ? history.find((e) => e.type === 'book_finished' && e.bookId === book.id && e.points > 0)
    : null;
  const awardChallenge = award ? challenges.find((c) => c.id === award.challengeId) : null;
  const alreadyAwarded = book && activeChallenge && book.status !== 'finished' && findAward(history, book.id, activeChallenge.id);

  const saveProgress = async (page) => {
    await actions.updateProgress(book.id, page);
    toast(`Progreso guardado: página ${page}`);
  };

  return (
    <Modal open={open} onClose={onClose} title={book?.title ?? 'Libro'} size="lg" hideHeader className="book-detail">
      {book && (
        <div className="bd-layout">
          <div className="bd-cover-col">
            <BookCover book={book} size="lg" />
          </div>

          <div className="bd-main">
            <div className="bd-head">
              <div className="min-w-0">
                <p className="bd-author">{book.author}</p>
                <h2 className="bd-title">{book.title}</h2>
                {owner && (
                  <p className="bd-owner">
                    <Avatar user={owner} size={22} /> Biblioteca de {owner.shortName}
                  </p>
                )}
              </div>
              <button type="button" className="icon-btn bd-close" onClick={onClose} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            {canEdit ? (
              <Segmented
                label="Estado de lectura"
                options={STATUS_OPTIONS}
                value={book.status}
                onChange={(s) => onStatus(book.id, s)}
                className="bd-status"
              />
            ) : (
              <div><StatusBadge status={book.status} /></div>
            )}

            <div className={`points-callout ${book.status === 'finished' ? 'is-done' : ''}`}>
              <Sparkles size={18} aria-hidden="true" />
              {book.status === 'finished' && award && (
                <span>Sumó <strong>{award.points} {award.points === 1 ? 'punto' : 'puntos'}</strong>{awardChallenge ? ` en ${awardChallenge.name}` : ''}.</span>
              )}
              {book.status === 'finished' && !award && <span>Terminado fuera de un desafío, no sumó puntos.</span>}
              {book.status !== 'finished' && alreadyAwarded && (
                <span>Ya sumó sus puntos en este desafío. Volver a terminarlo no suma de nuevo.</span>
              )}
              {book.status !== 'finished' && !alreadyAwarded && (
                <span>Este libro vale <strong>{points} {points === 1 ? 'punto' : 'puntos'}</strong> al completarlo.</span>
              )}
            </div>

            <dl className="bd-facts">
              <div><dt>Páginas</dt><dd className="tabular">{formatNumber(book.pages)}</dd></div>
              <div><dt>Página actual</dt><dd className="tabular">{formatNumber(book.currentPage)}</dd></div>
              <div><dt>Progreso</dt><dd className="tabular">{progressPercent(book)}%</dd></div>
              <div>
                <dt>{book.finishedAt ? 'Terminado' : 'Inicio'}</dt>
                <dd>
                  <CalendarDays size={14} aria-hidden="true" />{' '}
                  {formatShortDate(book.finishedAt || book.startedAt) || 'Sin empezar'}
                </dd>
              </div>
            </dl>

            {canEdit && book.status !== 'finished' && <ProgressUpdater book={book} onSave={saveProgress} />}

            <section className="bd-notes">
              <h3 className="section-label">Notas</h3>
              {book.notes && <p>{book.notes}</p>}
              {!book.notes && (
                <p className="text-muted-2">{canEdit ? 'Sin notas todavía. Añade impresiones o citas desde Editar.' : 'Sin notas.'}</p>
              )}
            </section>

            {!canEdit && owner && (
              <p className="text-muted-2 bd-readonly">Solo {owner.shortName} puede modificar este libro.</p>
            )}

            {canEdit && <footer className="bd-actions">
              <button type="button" className="btn btn-ghost-danger" onClick={() => onDelete(book.id)}>
                <Trash2 size={18} aria-hidden="true" /> Eliminar
              </button>
              <div className="bd-actions-main">
                <button type="button" className="btn btn-secondary" onClick={() => onEdit(book)}>
                  <Pencil size={18} aria-hidden="true" /> Editar
                </button>
                {book.status !== 'finished' && (
                  <button type="button" className="btn btn-primary" onClick={() => onFinish(book.id)}>
                    Terminé el libro
                  </button>
                )}
              </div>
            </footer>}
          </div>
        </div>
      )}
    </Modal>
  );
}
