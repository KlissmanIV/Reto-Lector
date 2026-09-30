// Estado de la interfaz compartido (modales y flujos) para que cualquier pantalla
// pueda abrir un libro, añadir uno, confirmar acciones o crear un desafío.
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useAppData } from './AppDataContext';
import { useToast } from './ToastContext';
import BookDetailModal from '../components/books/BookDetailModal';
import BookFormModal from '../components/books/BookFormModal';
import FinishCelebration from '../components/books/FinishCelebration';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ChallengeFormModal from '../components/challenge/ChallengeFormModal';
import { calcularPuntos, findAward, getChallengeScores } from '../utils/scoring';

const UiContext = createContext(null);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function UiProvider({ children }) {
  const data = useAppData();
  const { actions } = data;
  const { toast } = useToast();
  const dataRef = useRef(data);
  dataRef.current = data;

  const [detail, setDetail] = useState({ open: false, bookId: null });
  const [form, setForm] = useState({ open: false, key: 0 });
  const [celebration, setCelebration] = useState({ open: false });
  const [confirmState, setConfirmState] = useState({ open: false });
  const [challengeForm, setChallengeForm] = useState({ open: false, key: 0 });
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setConfirmState({ open: true, options });
      }),
    [],
  );
  const resolveConfirm = (value) => {
    resolver.current?.(value);
    resolver.current = null;
    setConfirmState((s) => ({ ...s, open: false }));
  };

  const openBook = useCallback((bookId) => setDetail({ open: true, bookId }), []);
  const closeBook = useCallback(() => setDetail((d) => ({ ...d, open: false })), []);

  const openBookForm = useCallback((book = null, defaults = null) => {
    setForm((f) => ({ open: true, book, defaults, key: f.key + 1 }));
  }, []);

  const openChallengeForm = useCallback((challenge = null) => {
    setChallengeForm((f) => ({ open: true, challenge, key: f.key + 1 }));
  }, []);

  const celebrate = useCallback((book, result) => {
    const { activeChallenge, history } = dataRef.current;
    let reason = 'Sin desafío en curso, este libro no suma puntos.';
    if (result.alreadyAwarded) reason = 'Este libro ya sumó sus puntos en este desafío.';
    const total = activeChallenge ? getChallengeScores(activeChallenge, history)[book.ownerId]?.points : null;
    setCelebration({ open: true, book: { ...book, currentPage: book.pages }, points: result.points, total, reason });
  }, []);

  /** Flujo "Terminé el libro": confirmación, cierre del detalle y celebración. */
  const requestFinish = useCallback(
    async (bookId) => {
      const { books, activeChallenge, history, usersById } = dataRef.current;
      const book = books.find((b) => b.id === bookId);
      if (!book) return;
      const pts = calcularPuntos(book.pages);
      const owner = usersById[book.ownerId];
      const already = activeChallenge && findAward(history, bookId, activeChallenge.id);
      const message = !activeChallenge
        ? 'No hay un desafío en curso, así que no sumará puntos.'
        : already
          ? 'Este libro ya sumó sus puntos en este desafío y no volverá a sumar.'
          : `Sumará ${plural(pts, 'punto', 'puntos')} a ${owner?.shortName ?? 'su dueño'} en ${activeChallenge.name}.`;

      const ok = await confirm({ title: `¿Terminaste «${book.title}»?`, message, confirmLabel: 'Sí, lo terminé' });
      if (!ok) return;
      const result = await actions.finishBook(bookId);
      setDetail((d) => ({ ...d, open: false }));
      // Pequeña pausa para que el detalle salga antes de la celebración.
      setTimeout(() => celebrate(book, result), 200);
    },
    [actions, confirm, celebrate],
  );

  const requestStatus = useCallback(
    async (bookId, status) => {
      if (status === 'finished') return requestFinish(bookId);
      const { books, activeChallenge, history } = dataRef.current;
      const book = books.find((b) => b.id === bookId);
      if (!book) return undefined;
      const award = book.status === 'finished' && activeChallenge
        && history.find((e) => e.type === 'book_finished' && e.bookId === bookId && e.challengeId === activeChallenge.id);
      if (award) {
        const ok = await confirm({
          title: 'Reabrir libro terminado',
          message: award.points
            ? `Se restarán ${plural(award.points, 'punto', 'puntos')} del desafío hasta que vuelvas a terminarlo.`
            : 'El libro volverá a tu lista de lectura.',
          confirmLabel: 'Reabrir',
          tone: 'danger',
        });
        if (!ok) return undefined;
      }
      await actions.setBookStatus(bookId, status);
      toast(status === 'reading' ? 'Marcado como leyendo' : 'Movido a pendientes');
      return undefined;
    },
    [actions, confirm, requestFinish, toast],
  );

  const requestDelete = useCallback(
    async (bookId) => {
      const { books, activeChallenge, history } = dataRef.current;
      const book = books.find((b) => b.id === bookId);
      if (!book) return;
      const award = activeChallenge && findAward(history, bookId, activeChallenge.id);
      const ok = await confirm({
        title: `¿Eliminar «${book.title}»?`,
        message: award
          ? `Se eliminará de la biblioteca y se restarán ${plural(award.points, 'punto', 'puntos')} del desafío en curso. No se puede deshacer.`
          : 'Se eliminará de la biblioteca junto con su actividad en el desafío en curso. No se puede deshacer.',
        confirmLabel: 'Eliminar',
        tone: 'danger',
      });
      if (!ok) return;
      setDetail((d) => ({ ...d, open: false }));
      await actions.deleteBook(bookId);
      toast('Libro eliminado');
    },
    [actions, confirm, toast],
  );

  const onFormDone = useCallback(
    ({ type, book, result }) => {
      setForm((f) => ({ ...f, open: false }));
      if (type === 'edit') return toast('Cambios guardados');
      if (result) return setTimeout(() => celebrate(book, result), 200);
      toast(`«${book.title}» añadido a la biblioteca`);
      return undefined;
    },
    [celebrate, toast],
  );

  const value = useMemo(
    () => ({ openBook, openBookForm, openChallengeForm, confirm, requestFinish, requestStatus, requestDelete }),
    [openBook, openBookForm, openChallengeForm, confirm, requestFinish, requestStatus, requestDelete],
  );

  return (
    <UiContext.Provider value={value}>
      {children}
      <BookDetailModal
        bookId={detail.bookId}
        open={detail.open}
        onClose={closeBook}
        onEdit={(book) => openBookForm(book)}
        onDelete={requestDelete}
        onStatus={requestStatus}
        onFinish={requestFinish}
      />
      <BookFormModal state={form} onClose={() => setForm((f) => ({ ...f, open: false }))} onDone={onFormDone} />
      <ChallengeFormModal state={challengeForm} onClose={() => setChallengeForm((f) => ({ ...f, open: false }))} />
      <FinishCelebration state={celebration} onClose={() => setCelebration((c) => ({ ...c, open: false }))} />
      <ConfirmDialog state={confirmState} onResolve={resolveConfirm} />
    </UiContext.Provider>
  );
}

export const useUi = () => useContext(UiContext);
