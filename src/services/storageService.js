// Capa de persistencia. Toda la app lee y escribe datos a través de este módulo.
// Los datos compartidos viven en Supabase; solo las preferencias del dispositivo
// (tema) se guardan en localStorage.
import { supabase } from './supabaseClient';
import { getChallengeScores } from '../utils/scoring';

const SETTINGS_KEY = 'dl.settings';
const LEGACY_KEYS = { books: 'dl.books', challenges: 'dl.challenges', history: 'dl.history' };
const LEGACY_DONE_KEY = 'dl.migrated';

export const DEFAULT_SETTINGS = { theme: 'system', activeUserId: null };

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Almacenamiento bloqueado: la preferencia solo dura esta sesión.
  }
}

const iso = (value) => (value ? new Date(value).toISOString() : null);

function check({ error }, message = 'No se pudo guardar en la base de datos.') {
  if (error) throw new Error(message, { cause: error });
}

export const createId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// ---------------------------------------------------------------------------
// Mapeo filas <-> modelos del frontend
// ---------------------------------------------------------------------------

const userFromRow = (r) => ({ id: r.id, name: r.name, shortName: r.short_name, color: r.color, bio: r.bio, authUserId: r.auth_user_id });
const userToRow = (u) => ({ id: u.id, name: u.name, short_name: u.shortName, color: u.color, bio: u.bio ?? '' });

const bookFromRow = (r) => ({
  id: r.id, ownerId: r.owner_id, title: r.title, author: r.author, pages: r.pages,
  currentPage: r.current_page, status: r.status, startedAt: r.started_at, finishedAt: r.finished_at,
  notes: r.notes, coverColor: r.cover_color, coverUrl: r.cover_url, createdAt: iso(r.created_at),
});
const bookToRow = (b) => ({
  id: b.id, owner_id: b.ownerId, title: b.title, author: b.author, pages: b.pages,
  current_page: b.currentPage, status: b.status, started_at: b.startedAt || null, finished_at: b.finishedAt || null,
  notes: b.notes ?? '', cover_color: b.coverColor, cover_url: b.coverUrl ?? '', created_at: b.createdAt || undefined,
});

const challengeFromRow = (r) => ({
  id: r.id, name: r.name, startDate: r.start_date, endDate: r.end_date, status: r.status,
  winnerId: r.winner_id, tie: r.tie, createdAt: iso(r.created_at), closedAt: iso(r.closed_at),
  participants: (r.challenge_participants ?? []).map((p) => p.profile_id).sort(),
});
const challengeToRow = (c) => ({
  id: c.id, name: c.name, start_date: c.startDate, end_date: c.endDate, status: c.status,
  winner_id: c.winnerId ?? null, tie: !!c.tie, created_at: c.createdAt || undefined, closed_at: c.closedAt ?? null,
});

const eventFromRow = (r) => ({
  id: r.id, type: r.type, userId: r.user_id, bookId: r.book_id, bookTitle: r.book_title,
  challengeId: r.challenge_id, pages: r.pages, pagesDelta: r.pages_delta, page: r.page, points: r.points, at: iso(r.at),
});
const eventToRow = (e) => ({
  id: e.id, type: e.type, user_id: e.userId ?? null, book_id: e.bookId ?? null, book_title: e.bookTitle ?? null,
  challenge_id: e.challengeId ?? null, pages: e.pages ?? null, pages_delta: e.pagesDelta ?? 0, page: e.page ?? null,
  points: e.points ?? 0, at: e.at,
});

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const invalid = error.status === 400 || /invalid/i.test(error.message);
    throw new Error(invalid ? 'Correo o contraseña incorrectos.' : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

/** Preferencias locales de este dispositivo (lectura síncrona para aplicar el tema al instante). */
export const readSettings = () => ({ ...DEFAULT_SETTINGS, theme: readLocal(SETTINGS_KEY, {}).theme ?? 'system' });
export const getSettings = async () => readSettings();

/** Carga todos los datos compartidos. Lanza 'NO_PROFILE' si la cuenta no está vinculada. */
export async function loadAll() {
  const session = await getSession();
  if (!session) throw new Error('NO_SESSION');

  const [profiles, books, challenges, events, settings] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at'),
    supabase.from('books').select('*').order('created_at', { ascending: false }),
    supabase.from('challenges').select('*, challenge_participants(profile_id)').order('start_date'),
    supabase.from('events').select('*').order('at', { ascending: false }),
    getSettings(),
  ]);
  for (const res of [profiles, books, challenges, events]) check(res, 'No se pudieron cargar los datos.');

  // Los participantes desactivados se ocultan junto con todo lo relacionado con ellos.
  const users = profiles.data.filter((r) => r.active !== false).map(userFromRow);
  const activeIds = new Set(users.map((u) => u.id));
  const me = users.find((u) => u.authUserId === session.user.id);
  if (!me) throw new Error('NO_PROFILE');

  const history = events.data.map(eventFromRow).filter((e) => !e.userId || activeIds.has(e.userId));
  const visibleChallenges = challenges.data
    .map(challengeFromRow)
    .filter((c) => c.participants.every((id) => activeIds.has(id)));
  const challengeIds = new Set(visibleChallenges.map((c) => c.id));
  const challengeList = visibleChallenges.map((c) =>
    c.status === 'closed' ? { ...c, finalScores: getChallengeScores(c, history) } : c,
  );

  return {
    users,
    books: books.data.map(bookFromRow).filter((b) => activeIds.has(b.ownerId)),
    challenges: challengeList,
    history: history.filter((e) => !e.challengeId || challengeIds.has(e.challengeId)),
    settings: { ...settings, activeUserId: me.id },
    email: session.user.email,
  };
}

// ---------------------------------------------------------------------------
// Escritura: se envían solo las filas nuevas, modificadas o eliminadas.
// ---------------------------------------------------------------------------

function diff(next = [], prev = [], toRow) {
  const before = new Map(prev.map((x) => [x.id, JSON.stringify(toRow(x))]));
  const nextIds = new Set(next.map((x) => x.id));
  return {
    changed: next.filter((x) => before.get(x.id) !== JSON.stringify(toRow(x))),
    removed: prev.filter((x) => !nextIds.has(x.id)).map((x) => x.id),
    isNew: (id) => !before.has(id),
  };
}

/**
 * Persiste los cambios entre dos estados de la app. El orden respeta las
 * claves foráneas: primero se borran eventos y libros, luego se escriben
 * retos, libros y eventos.
 */
export async function persistChanges(prev, next, keys) {
  const has = (k) => keys.includes(k);

  if (has('settings')) writeLocal(SETTINGS_KEY, { theme: next.settings.theme });

  const events = has('history') ? diff(next.history, prev.history, eventToRow) : null;
  const books = has('books') ? diff(next.books, prev.books, bookToRow) : null;
  const challenges = has('challenges') ? diff(next.challenges, prev.challenges, challengeToRow) : null;
  const users = has('users') ? diff(next.users, prev.users, userToRow) : null;

  if (events?.removed.length) check(await supabase.from('events').delete().in('id', events.removed));
  if (books?.removed.length) check(await supabase.from('books').delete().in('id', books.removed));

  for (const u of users?.changed ?? []) {
    const { id, ...fields } = userToRow(u);
    check(await supabase.from('profiles').update(fields).eq('id', id));
  }

  if (challenges?.changed.length) {
    check(await supabase.from('challenges').upsert(challenges.changed.map(challengeToRow), { onConflict: 'id', defaultToNull: false }));
    const participants = challenges.changed
      .filter((c) => challenges.isNew(c.id))
      .flatMap((c) => c.participants.map((profileId) => ({ challenge_id: c.id, profile_id: profileId })));
    if (participants.length) {
      check(await supabase.from('challenge_participants').upsert(participants, { ignoreDuplicates: true }));
    }
  }

  if (books?.changed.length) {
    check(await supabase.from('books').upsert(books.changed.map(bookToRow), { onConflict: 'id', defaultToNull: false }));
  }

  if (events?.changed.length) {
    const res = await supabase.from('events').upsert(events.changed.map(eventToRow), { onConflict: 'id', defaultToNull: false });
    // 23505: el índice único impidió sumar puntos dos veces por el mismo libro.
    if (res.error?.code === '23505') throw new Error('Ese libro ya sumó sus puntos en este reto.');
    check(res);
  }
}

// ---------------------------------------------------------------------------
// Migración única de datos guardados en este navegador (versión sin servidor)
// ---------------------------------------------------------------------------

export function hasLegacyData() {
  if (readLocal(LEGACY_DONE_KEY, false)) return false;
  return readLocal(LEGACY_KEYS.books, []).length > 0;
}

/**
 * Sube los datos locales antiguos que pertenecen al usuario actual.
 * Usa inserciones que ignoran ids existentes, así que repetirla no duplica nada.
 */
export async function importLegacyData(myProfileId) {
  const books = readLocal(LEGACY_KEYS.books, []).filter((b) => b.ownerId === myProfileId);
  const challenges = readLocal(LEGACY_KEYS.challenges, []);
  const history = readLocal(LEGACY_KEYS.history, []).filter((e) => e.userId === myProfileId);
  let imported = 0;

  for (const c of challenges) {
    const res = await supabase.from('challenges').upsert(challengeToRow(c), { onConflict: 'id', ignoreDuplicates: true });
    if (res.error) continue; // p. ej. otro reto activo ya existe
    await supabase.from('challenge_participants').upsert(
      (c.participants ?? []).map((p) => ({ challenge_id: c.id, profile_id: p })),
      { ignoreDuplicates: true },
    );
  }

  if (books.length) {
    const res = await supabase.from('books').upsert(books.map(bookToRow), { onConflict: 'id', ignoreDuplicates: true }).select('id');
    check(res, 'No se pudieron importar los libros.');
    imported += res.data?.length ?? 0;
  }

  // Uno a uno: un evento que choque con la regla de puntos no bloquea al resto.
  for (const e of history) {
    const res = await supabase.from('events').upsert(eventToRow(e), { onConflict: 'id', ignoreDuplicates: true }).select('id');
    if (!res.error) imported += res.data?.length ?? 0;
  }

  writeLocal(LEGACY_DONE_KEY, true);
  return imported;
}
