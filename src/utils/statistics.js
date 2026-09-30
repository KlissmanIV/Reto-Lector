import { Award, BookOpenCheck, Flame, Library, Mountain, Trophy } from 'lucide-react';

export const formatNumber = (n) => new Intl.NumberFormat('es-ES').format(n || 0);

export function progressPercent(book) {
  if (!book?.pages) return 0;
  return Math.min(100, Math.round((book.currentPage / book.pages) * 100));
}

/** Estadísticas históricas de un usuario (todas las temporadas). */
export function getUserStats(userId, books, history, challenges) {
  const own = books.filter((b) => b.ownerId === userId);
  const finished = own.filter((b) => b.status === 'finished');
  const events = history.filter((e) => e.userId === userId);

  const points = events.filter((e) => e.type === 'book_finished').reduce((s, e) => s + (e.points || 0), 0);
  const pages = Math.max(0, events.reduce((s, e) => s + (e.pagesDelta || 0), 0));
  const wins = challenges.filter((c) => c.status === 'closed' && c.winnerId === userId).length;
  const longest = finished.reduce((m, b) => Math.max(m, b.pages), 0);

  return {
    total: own.length,
    finished: finished.length,
    reading: own.filter((b) => b.status === 'reading').length,
    pending: own.filter((b) => b.status === 'pending').length,
    points,
    pages,
    wins,
    longest,
  };
}

const ACHIEVEMENTS = [
  { id: 'first', icon: BookOpenCheck, title: 'Primer libro', desc: 'Terminar un libro', test: (s) => s.finished >= 1 },
  { id: 'five', icon: Library, title: 'Estantería', desc: 'Terminar 5 libros', test: (s) => s.finished >= 5 },
  { id: 'long', icon: Mountain, title: 'Gran travesía', desc: 'Terminar un libro de 600+ páginas', test: (s) => s.longest >= 600 },
  { id: 'k-pages', icon: Flame, title: 'Mil páginas', desc: 'Leer 1.000 páginas', test: (s) => s.pages >= 1000 },
  { id: 'win', icon: Trophy, title: 'Campeón', desc: 'Ganar un desafío', test: (s) => s.wins >= 1 },
  { id: 'points', icon: Award, title: 'Veinte puntos', desc: 'Acumular 20 puntos', test: (s) => s.points >= 20 },
];

export function getAchievements(stats) {
  return ACHIEVEMENTS.map(({ test, ...a }) => ({ ...a, unlocked: test(stats) }));
}
