// Estado visual de la racha. La racha se calcula y guarda en Supabase
// (supabase/streaks.sql); aquí solo se interpreta respecto a la hora actual.
import { toISODate, addDays } from './dates';

export const HOUR_MS = 3_600_000;
export const ACTIVE_WINDOW_MS = 24 * HOUR_MS; // racha activa tras leer
export const GRACE_WINDOW_MS = 24 * HOUR_MS;  // periodo de gracia adicional
export const LOST_AFTER_MS = ACTIVE_WINDOW_MS + GRACE_WINDOW_MS;

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

/**
 * @returns {{status: 'active'|'grace'|'lost'|'new', count:number, best:number,
 *   msLeft:number, windowMs:number, fraction:number, nextIncrementIn:number}}
 */
export function getStreakState(streak, now = Date.now()) {
  const best = streak?.bestStreak ?? 0;
  const lastRead = streak?.lastReadAt ? new Date(streak.lastReadAt).getTime() : null;
  if (!lastRead || !streak.currentStreak) {
    return { status: best ? 'lost' : 'new', count: 0, best, msLeft: 0, windowMs: ACTIVE_WINDOW_MS, fraction: 0, nextIncrementIn: 0 };
  }

  const elapsed = Math.max(0, now - lastRead);
  if (elapsed >= LOST_AFTER_MS) {
    return { status: 'lost', count: 0, best, msLeft: 0, windowMs: ACTIVE_WINDOW_MS, fraction: 0, nextIncrementIn: 0 };
  }

  const inGrace = elapsed >= ACTIVE_WINDOW_MS;
  const msLeft = inGrace ? LOST_AFTER_MS - elapsed : ACTIVE_WINDOW_MS - elapsed;
  const windowMs = inGrace ? GRACE_WINDOW_MS : ACTIVE_WINDOW_MS;
  const lastIncrement = streak.lastIncrementAt ? new Date(streak.lastIncrementAt).getTime() : lastRead;

  return {
    status: inGrace ? 'grace' : 'active',
    count: streak.currentStreak,
    best,
    msLeft,
    windowMs,
    fraction: msLeft / windowMs,
    // Tiempo hasta que una nueva lectura vuelva a sumar +1.
    nextIncrementIn: Math.max(0, lastIncrement + ACTIVE_WINDOW_MS - now),
  };
}

/** "5 h 20 min", "42 min", "menos de 1 min". */
export function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 1) return 'menos de 1 min';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function nextMilestone(count) {
  return STREAK_MILESTONES.find((m) => m > count) ?? null;
}

/** Días (fecha local) de los últimos `days` días con lectura registrada. */
export function recentReadingDays(history, userId, days = 7, today = toISODate(new Date())) {
  const read = new Set(
    history.filter((e) => e.userId === userId && e.pagesDelta > 0 && e.type !== 'book_added').map((e) => toISODate(e.at)),
  );
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - (days - 1));
    return { date, read: read.has(date), isToday: date === today };
  });
}
