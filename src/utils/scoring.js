// Reglas de puntuación y marcador. Sin dependencias de UI.

export const SCORING_RULES = [
  { min: 0, max: 199, points: 1, label: '0-199 páginas' },
  { min: 200, max: 399, points: 2, label: '200-399 páginas' },
  { min: 400, max: Infinity, points: 3, label: '400 páginas o más' },
];

export function calcularPuntos(paginas) {
  const n = Number(paginas) || 0;
  if (n < 200) return 1;
  if (n < 400) return 2;
  return 3;
}

/** Evento que otorgó puntos por un libro dentro de un desafío (si existe). */
export function findAward(history, bookId, challengeId) {
  return history.find(
    (e) => e.type === 'book_finished' && e.bookId === bookId && e.challengeId === challengeId && e.points > 0,
  );
}

/** Marcador de un desafío: puntos, libros terminados y páginas leídas por participante. */
export function getChallengeScores(challenge, history) {
  const scores = {};
  if (!challenge) return scores;
  for (const uid of challenge.participants) scores[uid] = { points: 0, books: 0, pages: 0 };

  for (const e of history) {
    if (e.challengeId !== challenge.id || !scores[e.userId]) continue;
    if (e.type === 'book_finished') {
      scores[e.userId].points += e.points || 0;
      scores[e.userId].books += 1;
    }
    // Los deltas negativos corrigen avances registrados por error.
    if (e.pagesDelta) scores[e.userId].pages += e.pagesDelta;
  }
  for (const s of Object.values(scores)) s.pages = Math.max(0, s.pages);
  return scores;
}

/** Ganador por puntos; desempate por libros y después por páginas. */
export function determineLeader(challenge, scores) {
  if (!challenge) return { leaderId: null, tie: false };
  const [a, b] = challenge.participants;
  const sa = scores[a] || { points: 0, books: 0, pages: 0 };
  const sb = scores[b] || { points: 0, books: 0, pages: 0 };
  const cmp = sa.points - sb.points || sa.books - sb.books || sa.pages - sb.pages;
  if (cmp === 0) return { leaderId: null, tie: true };
  return { leaderId: cmp > 0 ? a : b, tie: false };
}
