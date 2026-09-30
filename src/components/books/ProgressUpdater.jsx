import { useId, useState } from 'react';
import { Check } from 'lucide-react';
import { ProgressBar } from '../common/ui';
import { formatNumber } from '../../utils/statistics';

const QUICK_STEPS = [10, 25, 50];

/** Actualización rápida de progreso: número, slider y pasos rápidos con feedback inmediato. */
export default function ProgressUpdater({ book, onSave }) {
  const [draft, setDraft] = useState(String(book.currentPage));
  const [savedAt, setSavedAt] = useState(book.currentPage);
  const inputId = useId();

  // Si el libro cambia desde fuera (otro modal, reversión), sincroniza el borrador.
  if (book.currentPage !== savedAt) {
    setSavedAt(book.currentPage);
    setDraft(String(book.currentPage));
  }

  const parsed = Number.parseInt(draft, 10);
  const valid = Number.isFinite(parsed) && parsed >= 0 && parsed <= book.pages;
  const page = valid ? parsed : book.currentPage;
  const pct = Math.round((page / book.pages) * 100);
  const dirty = valid && parsed !== book.currentPage;
  const atEnd = page === book.pages;

  const setPage = (n) => setDraft(String(Math.max(0, Math.min(book.pages, n))));
  const save = () => dirty && onSave(parsed);

  return (
    <section className="progress-updater" aria-label="Actualizar progreso">
      <div className="pu-readout" aria-live="polite">
        <span className="pu-pages tabular">
          <strong>{formatNumber(page)}</strong> / {formatNumber(book.pages)} páginas
        </span>
        <span className="pu-pct tabular">{pct}%</span>
      </div>
      <ProgressBar value={pct} label="Progreso de lectura" />

      <input
        type="range"
        className="pu-range"
        min={0}
        max={book.pages}
        value={page}
        onChange={(e) => setPage(Number(e.target.value))}
        onPointerUp={save}
        aria-label="Página actual"
        aria-valuetext={`Página ${page} de ${book.pages}`}
      />

      <div className="pu-controls">
        <div className="pu-field">
          <label htmlFor={inputId} className="field-label">Página actual</label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            className={`field-input tabular ${!valid && draft !== '' ? 'is-invalid' : ''}`}
            min={0}
            max={book.pages}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            aria-invalid={!valid}
            aria-describedby={!valid ? `${inputId}-err` : undefined}
          />
        </div>
        <div className="pu-quick" role="group" aria-label="Sumar páginas">
          {QUICK_STEPS.map((n) => (
            <button key={n} type="button" className="btn-chip" onClick={() => setPage(page + n)} disabled={page >= book.pages}>
              +{n}
            </button>
          ))}
        </div>
      </div>
      {!valid && draft !== '' && (
        <p id={`${inputId}-err`} className="field-error">Introduce un número entre 0 y {book.pages}.</p>
      )}

      <div className="pu-actions">
        {atEnd && <p className="pu-hint">Última página. Márcalo como terminado para sumar los puntos.</p>}
        <button type="button" className="btn btn-secondary" onClick={save} disabled={!dirty}>
          <Check size={18} aria-hidden="true" /> Guardar progreso
        </button>
      </div>
    </section>
  );
}
