// Datos iniciales reales de la competencia.
// Las páginas son aproximadas y coinciden con el tramo de puntos de cada libro;
// pueden corregirse desde "Editar" en el detalle del libro.
import { todayISO } from '../utils/dates';
import { calcularPuntos } from '../utils/scoring';

export const COVER_COLORS = [
  '#2f4b3a', '#8c3b2e', '#1f3a5f', '#c9a227', '#5b3a5e', '#3d6b73',
  '#b5643c', '#27272a', '#6b7a3a', '#9d4a61', '#4a5d7e', '#d4c4a8',
];

const USERS = [
  { id: 'u-giovanni', name: 'Giovanni', shortName: 'Giovanni', color: '#3d6b73', bio: '' },
  { id: 'u-klissman', name: 'Klissman', shortName: 'Klissman', color: '#b5643c', bio: '' },
];

const CHALLENGE = {
  id: 'c-competencia',
  name: 'Competencia por un libro',
  startDate: '2026-09-01',
  endDate: '2026-10-31',
};

// [dueño, título, autor, páginas, color de portada]
const FINISHED_BOOKS = [
  ['u-giovanni', 'Los manuscritos rojos de la magia', 'Cassandra Clare y Wesley Chu', 368, '#8c3b2e'],
  ['u-giovanni', 'Una corte de alas y ruinas', 'Sarah J. Maas', 704, '#2f4b3a'],
  ['u-giovanni', 'Una corte de hielo y estrellas', 'Sarah J. Maas', 272, '#4a5d7e'],
  ['u-klissman', 'Ecce Homo', 'Friedrich Nietzsche', 160, '#27272a'],
  ['u-klissman', 'El idiota', 'Fiódor Dostoievski', 720, '#c9a227'],
  ['u-klissman', 'Los años de peregrinación del chico sin color', 'Haruki Murakami', 320, '#3d6b73'],
  ['u-klissman', 'Mujeres', 'Charles Bukowski', 352, '#9d4a61'],
  ['u-klissman', 'Noches blancas', 'Fiódor Dostoievski', 96, '#d4c4a8'],
  ['u-klissman', 'El proceso', 'Franz Kafka', 256, '#5b3a5e'],
];

export function buildDemoData() {
  const today = todayISO();
  const now = Date.now();

  const challenge = {
    ...CHALLENGE,
    participants: USERS.map((u) => u.id),
    status: 'active',
    winnerId: null,
    createdAt: new Date(`${CHALLENGE.startDate}T09:00:00`).toISOString(),
  };

  const books = [];
  const history = [];

  FINISHED_BOOKS.forEach(([ownerId, title, author, pages, coverColor], i) => {
    const id = `b-${i + 1}`;
    // Marcas de tiempo escalonadas para conservar el orden de la lista original.
    const at = new Date(now - (FINISHED_BOOKS.length - i) * 60_000).toISOString();
    books.push({
      id, ownerId, title, author, pages,
      currentPage: pages,
      status: 'finished',
      startedAt: null,
      finishedAt: today,
      notes: '',
      coverColor,
      coverUrl: '',
      createdAt: at,
    });
    history.push({
      id: `e-${i + 1}`, type: 'book_finished', userId: ownerId, bookId: id, bookTitle: title,
      challengeId: challenge.id, pages, pagesDelta: pages, points: calcularPuntos(pages), at,
    });
  });

  history.push({
    id: 'e-0', type: 'challenge_created', challengeId: challenge.id, challengeName: challenge.name,
    userId: USERS[0].id, at: challenge.createdAt,
  });
  history.sort((a, b) => b.at.localeCompare(a.at));

  return { users: USERS.map((u) => ({ ...u })), books, challenges: [challenge], history };
}
