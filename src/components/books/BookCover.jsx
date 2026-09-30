import { useState } from 'react';

/** Luminancia relativa aproximada para decidir texto claro u oscuro sobre la portada. */
function isLight(hex = '#444444') {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6;
}

/**
 * Portada del libro. Usa la imagen si existe; si no, genera una portada
 * tipográfica con el color del libro para que la biblioteca siempre tenga color.
 */
export default function BookCover({ book, size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false);
  const showImage = book.coverUrl && !failed;
  const light = isLight(book.coverColor);

  return (
    <div
      className={`book-cover size-${size} ${light ? 'is-light' : ''} ${className}`}
      style={{ '--cover': book.coverColor }}
    >
      {showImage ? (
        <img src={book.coverUrl} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <div className="cover-type" aria-hidden="true">
          <span className="cover-title">{book.title}</span>
          <span className="cover-author">{book.author}</span>
        </div>
      )}
    </div>
  );
}
