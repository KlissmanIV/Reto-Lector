import { Check } from 'lucide-react';
import Modal from '../common/Modal';
import BookCover from './BookCover';
import { formatNumber } from '../../utils/statistics';

/** Microcelebración al terminar un libro: sobria, breve y con la información clave. */
export default function FinishCelebration({ state, onClose }) {
  const { book, points, total, reason } = state;
  return (
    <Modal open={state.open} onClose={onClose} title="Libro completado" size="sm" hideHeader className="celebration">
      {book && (
        <div className="celebrate">
          <div className="celebrate-art">
            <BookCover book={book} size="sm" />
            <span className="celebrate-check" aria-hidden="true">
              <Check size={20} strokeWidth={3} />
            </span>
            <span className="celebrate-rays" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
            </span>
          </div>
          <p className="celebrate-kicker">Libro completado</p>
          <h2 className="celebrate-title">{book.title}</h2>
          <p className="celebrate-meta tabular">{formatNumber(book.pages)} páginas</p>

          {points > 0 ? (
            <p className="celebrate-points tabular">
              +{points} {points === 1 ? 'punto' : 'puntos'}
            </p>
          ) : (
            <p className="celebrate-note">{reason}</p>
          )}
          {points > 0 && total != null && <p className="celebrate-total tabular">Ahora sumas {total} puntos en el desafío</p>}

          <button type="button" className="btn btn-primary btn-block" onClick={onClose} data-autofocus>
            Continuar
          </button>
        </div>
      )}
    </Modal>
  );
}
