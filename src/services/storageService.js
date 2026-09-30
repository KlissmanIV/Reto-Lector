// Capa de persistencia. Toda la app lee y escribe datos a través de este módulo.
// Hoy usa localStorage; mañana puede delegar en una API, Supabase o Firebase
// manteniendo las mismas firmas asíncronas.
import { buildDemoData } from '../data/demoData';

const PREFIX = 'dl.';
const KEYS = {
  users: `${PREFIX}users`,
  books: `${PREFIX}books`,
  challenges: `${PREFIX}challenges`,
  history: `${PREFIX}history`,
  settings: `${PREFIX}settings`,
  meta: `${PREFIX}meta`,
};
const SCHEMA_VERSION = 2;

export const DEFAULT_SETTINGS = { theme: 'system', activeUserId: 'u-klissman' };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Cuota llena o almacenamiento bloqueado: se propaga para mostrar un aviso.
    throw new Error('No se pudo guardar en este navegador.', { cause: err });
  }
}

function seed(data) {
  write(KEYS.users, data.users);
  write(KEYS.books, data.books);
  write(KEYS.challenges, data.challenges);
  write(KEYS.history, data.history);
  write(KEYS.meta, { version: SCHEMA_VERSION, seededAt: new Date().toISOString() });
}

/** Garantiza que exista un conjunto de datos inicial. */
export async function initStorage() {
  const meta = read(KEYS.meta, null);
  if (!meta || meta.version !== SCHEMA_VERSION) seed(buildDemoData());
}

export const getUsers = async () => read(KEYS.users, []);
export const saveUsers = async (users) => write(KEYS.users, users);

export const getBooks = async () => read(KEYS.books, []);
export const saveBooks = async (books) => write(KEYS.books, books);

export const getChallenges = async () => read(KEYS.challenges, []);
export const saveChallenges = async (challenges) => write(KEYS.challenges, challenges);

export const getHistory = async () => read(KEYS.history, []);
export const saveHistory = async (history) => write(KEYS.history, history);

export const getSettings = async () => ({ ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) });
export const saveSettings = async (settings) => write(KEYS.settings, settings);

export async function loadAll() {
  await initStorage();
  const [users, books, challenges, history, settings] = await Promise.all([
    getUsers(), getBooks(), getChallenges(), getHistory(), getSettings(),
  ]);
  // Si el participante activo ya no existe (datos reemplazados), se usa uno válido.
  if (users.length && !users.some((u) => u.id === settings.activeUserId)) {
    settings.activeUserId = users.some((u) => u.id === DEFAULT_SETTINGS.activeUserId)
      ? DEFAULT_SETTINGS.activeUserId
      : users[0].id;
    write(KEYS.settings, settings);
  }
  return { users, books, challenges, history, settings };
}

/** Restaura los datos iniciales de la competencia (conserva los ajustes). */
export async function resetDemoData() {
  seed(buildDemoData());
  return loadAll();
}

/** Deja la app sin libros, desafíos ni historial (conserva participantes y ajustes). */
export async function clearData() {
  write(KEYS.books, []);
  write(KEYS.challenges, []);
  write(KEYS.history, []);
  return loadAll();
}

export const createId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
