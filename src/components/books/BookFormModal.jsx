import { useId, useState } from 'react';
import { Check } from 'lucide-react';
import Modal from '../common/Modal';
import BookCover from './BookCover';
import { COVER_COLORS, STATUS_OPTIONS } from './bookMeta';
import { Segmented } from '../common/ui';
import { useAppData } from '../../context/AppDataContext';
import { calcularPuntos } from '../../utils/scoring';
import { todayISO } from '../../utils/dates';

function initialState(book, defaults, currentUserId) {
  if (book) {
    return { ...book, pages: String(book.pages), currentPage: String(book.currentPage), startedAt: book.startedAt || '' };
  }
  return {
    title: '',
    author: '',
    pages: '',
    currentPage: '0',
    status: 'pending',
    startedAt: todayISO(),
    notes: '',
    coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
    coverUrl: '',
    ...defaults,
    // Cada participante solo puede añadir libros a su propia biblioteca.
    ownerId: currentUserId,
  };
}

function validate(v, isEdit) {
  const e = {};
  const pages = Number(v.pages);
  if (!v.title.trim()) e.title = 'El título es obligatorio.';
  if (!v.author.trim()) e.author = 'Indica el autor o autora.';
  if (!Number.isInteger(pages) || pages < 1 || pages > 20000) e.pages = 'Introduce un número de páginas válido (1 a 20.000).';
  if (!isEdit && v.status === 'reading') {
    const cp = Number(v.currentPage);
    if (!Number.isInteger(cp) || cp < 0 || (e.pages ? false : cp > pages)) e.currentPage = `Debe estar entre 0 y ${pages || 'el total'}.`;
  }
  if (v.coverUrl && !/^https?:\/\/\S+$/i.test(v.coverUrl.trim())) e.coverUrl = 'La URL debe empezar por http:// o https://';
  return e;
}

function Field({ id, label, error, hint, children, optional }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label} {optional && <span className="field-optional">Opcional</span>}
      </label>
      {children}
      {hint && !error && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${id}-err`}>{error}</p>}
    </div>
  );
}

function BookForm({ book, defaults, onDone, onCancel }) {
  const { currentUser, actions } = useAppData();
  const isEdit = !!book;
  const [values, setValues] = useState(() => initialState(book, defaults, currentUser?.id));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const uid = useId();
  const id = (name) => `${uid}-${name}`;

  const set = (name) => (e) => {
    const value = e?.target ? e.target.value : e;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };
  const inputProps = (name) => ({
    id: id(name),
    value: values[name],
    onChange: set(name),
    className: `field-input ${errors[name] ? 'is-invalid' : ''}`,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${id(name)}-err` : undefined,
  });

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(values, isEdit);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(id(Object.keys(found)[0]))?.focus();
      return;
    }
    setSubmitting(true);
    const payload = {
      title: values.title.trim(),
      author: values.author.trim(),
      pages: Number(values.pages),
      notes: values.notes.trim(),
      coverColor: values.coverColor,
      coverUrl: values.coverUrl.trim(),
      startedAt: values.startedAt || null,
    };
    if (isEdit) {
      await actions.updateBook(book.id, payload);
      onDone({ type: 'edit', book: { ...book, ...payload } });
    } else {
      const { book: created, result } = await actions.addBook({
        ...payload,
        ownerId: values.ownerId,
        status: values.status,
        currentPage: Number(values.currentPage) || 0,
      });
      onDone({ type: 'create', book: created, result });
    }
  };

  const pages = Number(values.pages);
  const preview = { title: values.title || 'Título del libro', author: values.author || 'Autor', coverColor: values.coverColor, coverUrl: values.coverUrl };

  return (
    <form onSubmit={submit} noValidate className="book-form">
      <div className="bf-grid">
        <div className="bf-preview">
          <BookCover book={preview} size="md" key={values.coverUrl} />
          {pages > 0 && (
            <p className="bf-points">Vale <strong>{calcularPuntos(pages)} {calcularPuntos(pages) === 1 ? 'punto' : 'puntos'}</strong></p>
          )}
        </div>

        <div className="bf-fields">
          <Field id={id('title')} label="Título" error={errors.title}>
            <input {...inputProps('title')} autoComplete="off" maxLength={140} data-autofocus={!isEdit || undefined} />
          </Field>
          <Field id={id('author')} label="Autor" error={errors.author}>
            <input {...inputProps('author')} autoComplete="off" maxLength={100} />
          </Field>
          <div className="field-row">
            <Field id={id('pages')} label="Páginas" error={errors.pages}>
              <input {...inputProps('pages')} type="number" inputMode="numeric" min={1} />
            </Field>
            <Field id={id('startedAt')} label="Fecha de inicio" optional>
              <input {...inputProps('startedAt')} type="date" />
            </Field>
          </div>

          {!isEdit && (
            <>
              <div className="field">
                <span className="field-label">Estado</span>
                <Segmented label="Estado inicial" options={STATUS_OPTIONS} value={values.status} onChange={set('status')} size="sm" className="is-block" />
                {values.status === 'finished' && <p className="field-hint">Se marcará como terminado y sumará sus puntos al desafío en curso.</p>}
              </div>
              {values.status === 'reading' && (
                <Field id={id('currentPage')} label="Página actual" error={errors.currentPage} hint="Las páginas leídas antes de añadirlo no cuentan para el desafío.">
                  <input {...inputProps('currentPage')} type="number" inputMode="numeric" min={0} />
                </Field>
              )}
            </>
          )}

          <div className="field">
            <span className="field-label" id={id('color-l')}>Color de portada</span>
            <div className="swatches" role="radiogroup" aria-labelledby={id('color-l')}>
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={values.coverColor === c}
                  aria-label={`Color ${c}`}
                  className="swatch"
                  style={{ '--swatch': c }}
                  onClick={() => set('coverColor')(c)}
                >
                  {values.coverColor === c && <Check size={14} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>

          <Field id={id('coverUrl')} label="URL de portada" optional error={errors.coverUrl} hint="Si la imagen no carga se usa la portada de color.">
            <input {...inputProps('coverUrl')} type="url" inputMode="url" placeholder="https://" />
          </Field>

          <Field id={id('notes')} label="Notas" optional>
            <textarea {...inputProps('notes')} rows={3} maxLength={1000} />
          </Field>
        </div>
      </div>

      <div className="modal-foot is-inline">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {isEdit ? 'Guardar cambios' : 'Añadir libro'}
        </button>
      </div>
    </form>
  );
}

export default function BookFormModal({ state, onClose, onDone }) {
  const isEdit = !!state.book;
  return (
    <Modal open={state.open} onClose={onClose} title={isEdit ? 'Editar libro' : 'Añadir libro'} size="lg">
      <BookForm key={state.key} book={state.book} defaults={state.defaults} onDone={onDone} onCancel={onClose} />
    </Modal>
  );
}
