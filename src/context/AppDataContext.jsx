import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as storage from '../services/storageService';
import { calcularPuntos, determineLeader, findAward, getChallengeScores } from '../utils/scoring';
import { isWithin, todayISO } from '../utils/dates';
import { useToast } from './ToastContext';

const AppDataContext = createContext(null);

const SAVERS = {
  users: storage.saveUsers,
  books: storage.saveBooks,
  challenges: storage.saveChallenges,
  history: storage.saveHistory,
  settings: storage.saveSettings,
};

const EMPTY = { users: [], books: [], challenges: [], history: [], settings: storage.DEFAULT_SETTINGS };
const MERGE_WINDOW_MS = 30 * 60 * 1000;

function event(type, fields) {
  return { id: storage.createId('e'), type, at: new Date().toISOString(), ...fields };
}

export function AppDataProvider({ children }) {
  const { toast } = useToast();
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState('loading');
  const ref = useRef(EMPTY);

  const load = useCallback(async (loader = storage.loadAll) => {
    try {
      const next = await loader();
      ref.current = next;
      setData(next);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Aplica cambios al estado y los persiste a través de storageService. */
  const commit = useCallback(
    async (partial) => {
      const next = { ...ref.current, ...partial };
      ref.current = next;
      setData(next);
      try {
        await Promise.all(Object.keys(partial).map((k) => SAVERS[k](next[k])));
      } catch (err) {
        toast(err.message || 'No se pudieron guardar los cambios.', { tone: 'error' });
      }
    },
    [toast],
  );

  // ---------- Derivados ----------
  const activeChallenge = useMemo(() => data.challenges.find((c) => c.status === 'active') ?? null, [data.challenges]);
  const scores = useMemo(() => getChallengeScores(activeChallenge, data.history), [activeChallenge, data.history]);
  const leader = useMemo(() => determineLeader(activeChallenge, scores), [activeChallenge, scores]);
  const usersById = useMemo(() => Object.fromEntries(data.users.map((u) => [u.id, u])), [data.users]);

  // ---------- Libros ----------
  /** Marca como terminado y entrega puntos si corresponde (una sola vez por desafío). */
  const finishBook = useCallback(
    async (bookId) => {
      const { books, history, challenges } = ref.current;
      const book = books.find((b) => b.id === bookId);
      if (!book || book.status === 'finished') return { points: 0, awarded: false };

      const today = todayISO();
      const challenge = challenges.find((c) => c.status === 'active');
      const eligible =
        challenge && challenge.participants.includes(book.ownerId) && isWithin(today, challenge.startDate, challenge.endDate);
      const already = eligible && findAward(history, book.id, challenge.id);
      const points = eligible && !already ? calcularPuntos(book.pages) : 0;

      const updated = { ...book, status: 'finished', currentPage: book.pages, finishedAt: today, startedAt: book.startedAt || today };
      const ev = event('book_finished', {
        userId: book.ownerId,
        bookId: book.id,
        bookTitle: book.title,
        challengeId: challenge?.id ?? null,
        pages: book.pages,
        pagesDelta: book.pages - book.currentPage,
        points,
      });

      await commit({ books: books.map((b) => (b.id === bookId ? updated : b)), history: [ev, ...history] });
      return { points, awarded: points > 0, alreadyAwarded: !!already, noChallenge: !eligible };
    },
    [commit],
  );

  const addBook = useCallback(
    async (input) => {
      const { books, history, challenges } = ref.current;
      const today = todayISO();
      const challengeId = challenges.find((c) => c.status === 'active')?.id ?? null;
      const wantsFinished = input.status === 'finished';
      const status = wantsFinished ? 'reading' : input.status;
      const currentPage = status === 'pending' ? 0 : Math.min(input.currentPage || 0, input.pages);

      const book = {
        id: storage.createId('b'),
        ownerId: input.ownerId,
        title: input.title.trim(),
        author: input.author.trim(),
        pages: input.pages,
        currentPage,
        status,
        startedAt: status === 'pending' ? null : input.startedAt || today,
        finishedAt: null,
        notes: input.notes?.trim() ?? '',
        coverColor: input.coverColor,
        coverUrl: input.coverUrl?.trim() ?? '',
        createdAt: new Date().toISOString(),
      };
      const base = { userId: book.ownerId, bookId: book.id, bookTitle: book.title, challengeId };
      const events = [event('book_added', base)];
      // El avance previo a registrar el libro no suma páginas al desafío.
      if (status === 'reading') events.unshift(event('book_started', base));

      await commit({ books: [book, ...books], history: [...events, ...history] });
      const result = wantsFinished ? await finishBook(book.id) : null;
      return { book, result };
    },
    [commit, finishBook],
  );

  const updateBook = useCallback(
    async (bookId, patch) => {
      const { books, history } = ref.current;
      const nextBooks = books.map((b) => {
        if (b.id !== bookId) return b;
        const pages = patch.pages ?? b.pages;
        const merged = { ...b, ...patch, pages };
        merged.currentPage = b.status === 'finished' ? pages : Math.min(b.currentPage, pages);
        return merged;
      });
      // Mantiene legible el historial si cambia el título.
      const nextHistory = patch.title
        ? history.map((e) => (e.bookId === bookId ? { ...e, bookTitle: patch.title } : e))
        : history;
      await commit({ books: nextBooks, history: nextHistory });
    },
    [commit],
  );

  const updateProgress = useCallback(
    async (bookId, page) => {
      const { books, history, challenges } = ref.current;
      const book = books.find((b) => b.id === bookId);
      if (!book) return;
      const target = Math.max(0, Math.min(book.pages, Math.round(page)));
      const delta = target - book.currentPage;
      if (delta === 0) return;

      const today = todayISO();
      const challengeId = challenges.find((c) => c.status === 'active')?.id ?? null;
      const updated = {
        ...book,
        currentPage: target,
        status: book.status === 'pending' && target > 0 ? 'reading' : book.status,
        startedAt: book.startedAt || today,
      };

      // Agrupa actualizaciones seguidas del mismo libro para no saturar la actividad.
      const last = history[0];
      const canMerge =
        last?.type === 'progress' && last.bookId === bookId && last.challengeId === challengeId &&
        Date.now() - new Date(last.at).getTime() < MERGE_WINDOW_MS;

      const nextHistory = canMerge
        ? [{ ...last, pagesDelta: last.pagesDelta + delta, page: target, at: new Date().toISOString() }, ...history.slice(1)]
        : [event('progress', { userId: book.ownerId, bookId, bookTitle: book.title, challengeId, pagesDelta: delta, page: target }), ...history];

      await commit({ books: books.map((b) => (b.id === bookId ? updated : b)), history: nextHistory });
    },
    [commit],
  );

  /** Cambia el estado. Terminar pasa por finishBook; deshacer un terminado revierte sus puntos del desafío activo. */
  const setBookStatus = useCallback(
    async (bookId, nextStatus) => {
      if (nextStatus === 'finished') return finishBook(bookId);
      const { books, history, challenges } = ref.current;
      const book = books.find((b) => b.id === bookId);
      if (!book || book.status === nextStatus) return null;

      const challenge = challenges.find((c) => c.status === 'active');
      let nextHistory = history;
      let currentPage = book.currentPage;
      let revoked = 0;

      if (book.status === 'finished' && challenge) {
        const finishEv = history.find((e) => e.type === 'book_finished' && e.bookId === bookId && e.challengeId === challenge.id);
        if (finishEv) {
          revoked = finishEv.points || 0;
          currentPage = Math.max(0, book.pages - (finishEv.pagesDelta || 0));
          nextHistory = history.filter((e) => e !== finishEv);
        }
      }
      if (nextStatus === 'pending' && book.status !== 'finished') currentPage = book.currentPage;

      const today = todayISO();
      const updated = {
        ...book,
        status: nextStatus,
        currentPage,
        finishedAt: null,
        startedAt: nextStatus === 'reading' ? book.startedAt || today : book.startedAt,
      };
      if (book.status === 'pending' && nextStatus === 'reading') {
        nextHistory = [event('book_started', { userId: book.ownerId, bookId, bookTitle: book.title, challengeId: challenge?.id ?? null }), ...nextHistory];
      }
      await commit({ books: books.map((b) => (b.id === bookId ? updated : b)), history: nextHistory });
      return { revoked };
    },
    [commit, finishBook],
  );

  /** Elimina el libro y su actividad del desafío en curso (los desafíos cerrados no se alteran). */
  const deleteBook = useCallback(
    async (bookId) => {
      const { books, history, challenges } = ref.current;
      const activeId = challenges.find((c) => c.status === 'active')?.id;
      await commit({
        books: books.filter((b) => b.id !== bookId),
        history: history.filter((e) => !(e.bookId === bookId && (e.challengeId === activeId || !e.challengeId))),
      });
    },
    [commit],
  );

  // ---------- Desafíos ----------
  const createChallenge = useCallback(
    async ({ name, startDate, endDate }) => {
      const { challenges, history, users } = ref.current;
      if (challenges.some((c) => c.status === 'active')) throw new Error('Ya hay un desafío en curso.');
      const challenge = {
        id: storage.createId('c'),
        name: name.trim(),
        startDate,
        endDate,
        participants: users.slice(0, 2).map((u) => u.id),
        status: 'active',
        winnerId: null,
        createdAt: new Date().toISOString(),
      };
      const ev = event('challenge_created', { challengeId: challenge.id, challengeName: challenge.name, userId: ref.current.settings.activeUserId });
      await commit({ challenges: [...challenges, challenge], history: [ev, ...history] });
      return challenge;
    },
    [commit],
  );

  const updateChallenge = useCallback(
    async (id, patch) => {
      const { challenges, history } = ref.current;
      const nextHistory = patch.name
        ? history.map((e) => (e.challengeId === id && e.challengeName ? { ...e, challengeName: patch.name } : e))
        : history;
      await commit({ challenges: challenges.map((c) => (c.id === id ? { ...c, ...patch } : c)), history: nextHistory });
    },
    [commit],
  );

  const closeChallenge = useCallback(
    async (id) => {
      const { challenges, history } = ref.current;
      const challenge = challenges.find((c) => c.id === id);
      if (!challenge) return null;
      const finalScores = getChallengeScores(challenge, history);
      const { leaderId, tie } = determineLeader(challenge, finalScores);
      const closed = { ...challenge, status: 'closed', winnerId: leaderId, tie, finalScores, closedAt: new Date().toISOString() };
      const ev = event('challenge_closed', { challengeId: id, challengeName: challenge.name, userId: leaderId });
      await commit({ challenges: challenges.map((c) => (c.id === id ? closed : c)), history: [ev, ...history] });
      return closed;
    },
    [commit],
  );

  // ---------- Usuarios y ajustes ----------
  const updateUser = useCallback(
    (id, patch) => commit({ users: ref.current.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }),
    [commit],
  );

  const updateSettings = useCallback(
    (patch) => commit({ settings: { ...ref.current.settings, ...patch } }),
    [commit],
  );

  const resetDemo = useCallback(() => load(storage.resetDemoData), [load]);
  const clearAll = useCallback(() => load(storage.clearData), [load]);

  const value = useMemo(
    () => ({
      ...data,
      status,
      activeChallenge,
      scores,
      leader,
      usersById,
      currentUser: usersById[data.settings.activeUserId] ?? data.users[0] ?? null,
      actions: {
        addBook, updateBook, updateProgress, setBookStatus, finishBook, deleteBook,
        createChallenge, updateChallenge, closeChallenge,
        updateUser, updateSettings, resetDemo, clearAll, reload: load,
      },
    }),
    [data, status, activeChallenge, scores, leader, usersById, addBook, updateBook, updateProgress, setBookStatus,
      finishBook, deleteBook, createChallenge, updateChallenge, closeChallenge, updateUser, updateSettings, resetDemo, clearAll, load],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useAppData = () => useContext(AppDataContext);
