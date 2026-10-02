import { memo } from 'react';
import BookCover from './BookCover';
import StatusBadge from './StatusBadge';
import { Avatar, ProgressBar } from '../common/ui';
import { formatNumber, progressPercent } from '../../utils/statistics';

function BookCard({ book, owner, onOpen }) {
  const pct = progressPercent(book);
  return (
    <article className="book-card">
      <div className="book-card-cover">
        <BookCover book={book} />
        {owner && <Avatar user={owner} size={26} className="book-card-owner" />}
      </div>
      <div className="book-card-body">
        <h3 className="book-card-title">{book.title}</h3>
        <p className="book-card-author">{book.author}</p>
        <div className="book-card-meta">
          <StatusBadge status={book.status} />
          {book.status === 'reading' && <span className="tabular text-muted-2">{pct}%</span>}
          {book.status !== 'reading' && <span className="tabular text-muted-2">{formatNumber(book.pages)} pág.</span>}
        </div>
        {book.status === 'reading' && <ProgressBar value={pct} size="sm" label={`Progreso de ${book.title}`} />}
      </div>
      {/* Botón superpuesto: la maquetación no depende de un <button> (Safari lo encoge). */}
      <button type="button" className="hit-area book-card-hit" onClick={() => onOpen(book.id)} aria-label={`Ver detalles de ${book.title}`} />
    </article>
  );
}

export default memo(BookCard);
