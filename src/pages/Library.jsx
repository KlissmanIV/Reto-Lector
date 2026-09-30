import { useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookPlus, Plus, Search, SearchX, X } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useUi } from '../context/UiContext';
import BookCard from '../components/books/BookCard';
import { EmptyState, PageHeader, Segmented } from '../components/common/ui';
import { progressPercent } from '../utils/statistics';

const STATUS_ORDER = { reading: 0, pending: 1, finished: 2 };
const SORTS = {
  recent: { label: 'Recientes', fn: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (b.startedAt || b.createdAt || '').localeCompare(a.startedAt || a.createdAt || '') },
  title: { label: 'Título', fn: (a, b) => a.title.localeCompare(b.title, 'es') },
  progress: { label: 'Progreso', fn: (a, b) => progressPercent(b) - progressPercent(a) },
};

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Library() {
  const { books, users, usersById } = useAppData();
  const { openBook, openBookForm } = useUi();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const owner = params.get('de') || 'all';
  const status = params.get('estado') || 'all';
  const sort = SORTS[params.get('orden')] ? params.get('orden') : 'recent';

  const setParam = (key, value, fallback) => {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const byOwner = useMemo(() => (owner === 'all' ? books : books.filter((b) => b.ownerId === owner)), [books, owner]);
  const counts = useMemo(() => {
    const c = { all: byOwner.length, reading: 0, pending: 0, finished: 0 };
    for (const b of byOwner) c[b.status] += 1;
    return c;
  }, [byOwner]);

  const visible = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    return byOwner
      .filter((b) => status === 'all' || b.status === status)
      .filter((b) => !q || normalize(`${b.title} ${b.author}`).includes(q))
      .sort(SORTS[sort].fn);
  }, [byOwner, status, deferredQuery, sort]);

  const clearFilters = () => {
    setQuery('');
    setParams({}, { replace: true });
  };

  const addButton = (
    <button type="button" className="btn btn-primary hide-mobile" onClick={() => openBookForm(null, owner !== 'all' ? { ownerId: owner } : null)}>
      <Plus size={18} aria-hidden="true" /> Añadir libro
    </button>
  );

  if (books.length === 0) {
    return (
      <>
        <PageHeader title="Biblioteca" />
        <EmptyState
          icon={BookPlus}
          title="Tu biblioteca está vacía"
          action={
            <button type="button" className="btn btn-primary" onClick={() => openBookForm()}>
              <Plus size={18} aria-hidden="true" /> Añadir libro
            </button>
          }
        >
          Añade tu primer libro para comenzar tu desafío de lectura.
        </EmptyState>
      </>
    );
  }

  return (
    <div className="library">
      <PageHeader title="Biblioteca" subtitle={`${books.length} ${books.length === 1 ? 'libro' : 'libros'} entre ${users.map((u) => u.shortName).join(' y ')}`} actions={addButton} />

      <div className="library-toolbar">
        <div className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título o autor"
            aria-label="Buscar libros"
          />
          {query && (
            <button type="button" className="icon-btn icon-btn-sm" onClick={() => setQuery('')} aria-label="Borrar búsqueda">
              <X size={16} />
            </button>
          )}
        </div>
        <Segmented
          label="Filtrar por participante"
          size="sm"
          value={owner}
          onChange={(v) => setParam('de', v, 'all')}
          options={[{ value: 'all', label: 'Ambos' }, ...users.map((u) => ({ value: u.id, label: u.shortName }))]}
        />
        <label className="sort-select">
          <span className="visually-hidden">Ordenar por</span>
          <select className="field-input field-select" value={sort} onChange={(e) => setParam('orden', e.target.value, 'recent')}>
            {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="scroll-x">
        <Segmented
          label="Filtrar por estado"
          className="status-tabs"
          value={status}
          onChange={(v) => setParam('estado', v, 'all')}
          options={[
            { value: 'all', label: 'Todos', count: counts.all },
            { value: 'reading', label: 'Leyendo', count: counts.reading },
            { value: 'pending', label: 'Pendientes', count: counts.pending },
            { value: 'finished', label: 'Terminados', count: counts.finished },
          ]}
        />
      </div>

      {visible.length ? (
        <div className="book-grid">
          {visible.map((b) => (
            <BookCard key={b.id} book={b} owner={owner === 'all' ? usersById[b.ownerId] : null} onOpen={openBook} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No hay libros que coincidan"
          action={<button type="button" className="btn btn-secondary" onClick={clearFilters}>Quitar filtros</button>}
        >
          Prueba con otra búsqueda u otro estado.
        </EmptyState>
      )}
    </div>
  );
}
